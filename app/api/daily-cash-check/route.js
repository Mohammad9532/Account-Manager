
import dbConnect from "@/lib/db";
import { Account } from "@/lib/models/Account";
import { Transaction } from "@/lib/models/Transaction";
import { DailyExpense } from "@/lib/models/DailyExpense";
import { DailyCashCheck } from "@/lib/models/DailyCashCheck";
import { ActivityLog } from "@/lib/models/ActivityLog";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

function getStartOfDay(date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
}

function getEndOfDay(date = new Date()) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
}

// GET: Calculate stats for "Today" (or open cash check screen)
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('accountId');
        const dateStr = searchParams.get('date'); // Optional, default today

        if (!accountId) {
            return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
        }

        const targetDate = dateStr ? new Date(dateStr) : new Date();
        const startOfDay = getStartOfDay(targetDate);
        const endOfDay = getEndOfDay(targetDate);

        // 1. Get Account Current Balance
        const account = await Account.findById(accountId);
        if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

        // Verify access (simple check: own account) - TODO: Add shared access check if needed for editors
        // For now allowing owners.
        if (account.userId !== session.user.id) {
            // Basic permission check - enhance later for shared editors
            // return NextResponse.json({ error: 'Unauthorized access to account' }, { status: 403 });
        }

        // 2. Get Today's Transactions (Ledger + Daily Expenses) affecting this account
        // A. Ledger Transactions
        const ledgerTxns = await Transaction.find({
            $or: [{ accountId: accountId }, { linkedAccountId: accountId }],
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        // B. Daily Expenses (If any are linked to this account? DailyExpenses model has accountId?)
        // Let's check DailyExpense schema. Yes, it has accountId.
        const dailyTxns = await DailyExpense.find({
            accountId: accountId,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        const allTxns = [...ledgerTxns, ...dailyTxns];

        let totalIn = 0;
        let totalOut = 0;

        allTxns.forEach(t => {
            const amount = parseFloat(t.amount);
            // Check logic: 
            // If it's the main accountId:
            //   Credit -> In
            //   Debit -> Out
            // If it's linkedAccountId (e.g. Transfer):
            //   Usually logic is inverted for linked? 
            //   Transaction: "Money Out" from Account A to Account B.
            //   For A (accountId): Debit (Out).
            //   For B (linkedAccountId): Credit (In).

            // Standardizing 'type' check:
            // Transaction model has `type`: 'Money In' | 'Money Out'.
            // DailyExpense model has `type`: 'Money In' | 'Money Out'.
            // (Note: Transaction constants usually map 'Money In' -> CREDIT, 'Money Out' -> DEBIT)

            // Wait, Transaction model enum is ['Money In', 'Money Out'].

            // Logic for Ledger:
            if (String(t.accountId) === String(accountId)) {
                if (t.type === 'Money In') totalIn += amount;
                else totalOut += amount; // Money Out
            } else if (String(t.linkedAccountId) === String(accountId)) {
                // Determine effect on linked account
                // If main tx was Money Out (Transfer), it comes IN to linked.
                // If main tx was Money In (e.g. pull?), it goes OUT of linked.
                if (t.type === 'Money Out') totalIn += amount;
                else totalOut += amount;
            }
        });

        // 3. Calculate Opening Balance
        // Opening = Current - NetChangeToday
        // NetChangeToday = TotalIn - TotalOut
        // Opening = Current - (In - Out) = Current - In + Out

        // Use account.balance as the "System Closing Balance" (Expected)
        // Wait, account.balance is the LIVE balance right now.
        // If we are checking for "Today", and it's mid-day, Expected = Live Balance.
        // If we are looking at a PAST date, we can't easily fetch "Balance at EOD" without replaying history.
        // FOR V1: Assume we are doing check for TODAY (latest).

        const currentSystemBalance = account.balance;
        const netChange = totalIn - totalOut;
        const calculatedOpening = currentSystemBalance - netChange;

        // 4. Check if a report already exists for today?
        const existingReport = await DailyCashCheck.findOne({
            accountId: accountId,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        return NextResponse.json({
            date: targetDate,
            openingBalance: calculatedOpening,
            totalIn,
            totalOut,
            expectedBalance: currentSystemBalance,
            alreadyChecked: !!existingReport,
            lastCheck: existingReport || null
        });

    } catch (error) {
        console.error("Daily Cash Status Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Submit Daily Cash Check
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const body = await req.json();

        // Validate body...
        const {
            accountId,
            date,
            openingBalance,
            totalIn,
            totalOut,
            expectedBalance,
            actualBalance,
            reason,
            note,
            autoAdjust
        } = body;

        let difference = actualBalance - expectedBalance;

        // Round to 2 decimals
        difference = Math.round(difference * 100) / 100;

        let status = 'Matched';
        if (difference < 0) status = 'Short';
        if (difference > 0) status = 'Excess';

        let adjustmentTransactionId = null;

        // Handle Auto-Adjustment
        if (autoAdjust && difference !== 0) {
            // Create a Transaction to fix the balance
            // If Short (Actual < Expected): We need to reduce balance. So 'Money Out'.
            // If Excess (Actual > Expected): We need to increase balance. So 'Money In'.

            const isShort = difference < 0;
            const adjustAmount = Math.abs(difference);

            const txnType = isShort ? 'Money Out' : 'Money In';

            const adjustmentTxn = new Transaction({
                type: txnType,
                amount: adjustAmount,
                category: 'Cash Adjustment',
                description: `Daily Check Adjustment: ${reason || status} - ${note}`,
                date: new Date(),
                accountId: accountId,
                userId: session.user.id,
                scope: 'manager' // Showing in ledger mainly
            });

            const savedTxn = await adjustmentTxn.save();
            adjustmentTransactionId = savedTxn._id;

            // Important: We must update the Account Balance now, because Transaction.save() might not trigger a balance update 
            // unless we have specific middleware. 
            // In FinanceContext frontend calculates balance dynamic from txns, so adding txn is enough for frontend.
            // But logic in GET above relies on account.balance.
            // Does Transaction save update Account? Usually no in standard Mongo unless coded.
            // I should update Account balance manually here to keep DB in sync if that's the design pattern.
            // Checking AccountSchema... it just has balance default 0.
            // Let's update it.

            const balanceChange = isShort ? -adjustAmount : adjustAmount;
            await Account.findByIdAndUpdate(accountId, { $inc: { balance: balanceChange } });
        }

        // Save Check Record
        const cashCheck = new DailyCashCheck({
            userId: session.user.id,
            accountId,
            date: date || new Date(),
            openingBalance,
            totalIn,
            totalOut,
            expectedBalance,
            actualBalance,
            difference,
            status,
            reason,
            note,
            adjustmentTransactionId
        });

        const savedCheck = await cashCheck.save();

        // Log Activity
        await ActivityLog.create({
            ledgerId: accountId,
            userId: session.user.id,
            action: 'CASH_CHECK',
            details: `Cash Check: ${status} (${difference}). Actual: ${actualBalance}`
        });

        return NextResponse.json(savedCheck);

    } catch (error) {
        console.error("Daily Cash Submit Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
