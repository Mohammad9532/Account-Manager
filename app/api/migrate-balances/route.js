
import dbConnect from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { DailyExpense } from "@/lib/models/DailyExpense";
import { Account } from "@/lib/models/Account";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        // 1. Reset all accounts to initial balance
        const accounts = await Account.find({ userId: session.user.id });
        const accountMap = {};
        for (const acc of accounts) {
            acc.balance = acc.initialBalance || 0;
            accountMap[String(acc._id)] = acc;
        }

        // 2. Fetch all transactions
        const txns = await Transaction.find({ userId: session.user.id });
        const dailies = await DailyExpense.find({ userId: session.user.id });
        const all = [...txns, ...dailies];

        const internalTypes = ['Bank', 'Cash', 'Credit Card'];

        // 3. Process each
        for (const t of all) {
            const impact = (t.type === 'Money In' ? 1 : -1) * parseFloat(t.amount);
            t.balanceImpact = impact;
            await t.save();

            if (t.accountId && accountMap[String(t.accountId)]) {
                accountMap[String(t.accountId)].balance += impact;
            }

            if (t.linkedAccountId && accountMap[String(t.linkedAccountId)]) {
                const primaryAcc = accountMap[String(t.accountId)];
                const linkedAcc = accountMap[String(t.linkedAccountId)];

                if (primaryAcc && linkedAcc) {
                    const isInternal = internalTypes.includes(primaryAcc.type) &&
                        internalTypes.includes(linkedAcc.type);

                    const linkedMultiplier = isInternal ? -1 : 1;
                    linkedAcc.balance += (impact * linkedMultiplier);
                }
            }
        }

        // 4. Save all accounts
        for (const acc of accounts) {
            await acc.save();
        }

        return NextResponse.json({
            message: "Migration complete",
            processed: all.length,
            accounts: accounts.length
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
