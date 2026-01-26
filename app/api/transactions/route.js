import dbConnect from "@/lib/db";
// import { Transaction } from "@/lib/models/Transaction"; // Removed static import
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LedgerAccess } from "@/lib/models/LedgerAccess";
import { checkLedgerAccess } from "@/lib/permissions";
import { ActivityLog } from '@/lib/models/ActivityLog';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        if (!process.env.MONGODB_URI) return NextResponse.json({ error: 'DB URI missing' }, { status: 500 });

        const { Transaction } = await import("@/lib/models/Transaction"); // Dynamic Import

        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Filter transactions by the logged-in user's ID
        // AND shared ledgers
        const userEmail = session.user.email; // Assuming email is used for sharing ID based on share route logic
        const userId = session.user.id; // Original creator ID

        // 1. Get ledgers shared with this user
        // We filter by 'Account' ledgers AND 'Ledger' ledgers
        const sharedAccess = await LedgerAccess.find({ userId: userEmail });
        const sharedAccountIds = sharedAccess.filter(a => a.type === 'Account' || !a.type).map(a => a.ledgerId);

        // Handling 'Ledger' type shares (Pure Ledgers)
        // For these, we don't look for accountId. We look for:
        // Transactions where userId = Ledger.ownerId AND description = Ledger.name

        let sharedLedgerConfig = []; // Array of { ownerId, name }
        const sharedLedgerAccess = sharedAccess.filter(a => a.type === 'Ledger');

        if (sharedLedgerAccess.length > 0) {
            const { Ledger } = await import("@/lib/models/Ledger");
            // Fetch all Ledger docs needed
            const ledgerDocs = await Ledger.find({ _id: { $in: sharedLedgerAccess.map(a => a.ledgerId) } });
            sharedLedgerConfig = ledgerDocs.map(d => ({
                ownerId: d.ownerId,
                name: d.name
            }));
        }

        // Complex Query Construction
        // Base: My transactions OR Shared Account transactions
        const orConditions = [
            { userId: userId }, // Created by me
            { accountId: { $in: sharedAccountIds } }, // In a shared ACCOUNT
            { linkedAccountId: { $in: sharedAccountIds } } // Linked to a shared ACCOUNT
        ];

        // Append Shared Ledger conditions
        sharedLedgerConfig.forEach(config => {
            orConditions.push({
                userId: config.ownerId,
                description: { $regex: new RegExp(`^${config.name}$`, 'i') }, // Case insensitive match
                scope: 'manager' // Only manager scope for these
            });
        });

        const transactions = await Transaction.find({
            $or: orConditions
        }).sort({ date: -1 });

        return NextResponse.json(transactions, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        if (!process.env.MONGODB_URI) return NextResponse.json({ error: 'DB URI missing' }, { status: 500 });

        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await request.json();

        const { Transaction } = await import("@/lib/models/Transaction"); // Single Dynamic Import

        // Handle Bulk Create (Array)
        if (Array.isArray(body)) {
            const transactionsWithUser = body.map(t => ({
                ...t,
                userId: session.user.id
            }));
            const savedTransactions = await Transaction.insertMany(transactionsWithUser);
            return NextResponse.json(savedTransactions);
        }

        // Handle Single Create (Object)
        const newTransactionData = {
            ...body,
            userId: session.user.id
        };

        // Permission Check for Account
        if (body.accountId) {
            const { hasAccess, error } = await checkLedgerAccess(body.accountId, session.user.email, 'editor'); // Use email as validUserId consistent with share
            // Wait, checkLedgerAccess checks Account.userId (Owner) OR LedgerAccess.
            // If I am the owner, Account.userId === my ID. 
            // Issues: Account.userId likely matches session.user.id (Google ID / DB ID), but LedgerAccess uses Email.
            // My checkLedgerAccess implementation needs to handle both or be consistent.
            // Let's rely on checkLedgerAccess to handle it. 
            // But I should pass the correct ID.
            // Let's pass session.user.id AND session.user.email if possible?
            // Or update checkLedgerAccess to accept both?
            // Current checkLedgerAccess(ledgerId, validUserId).
            // If Account.userId is an ID, and LedgerAccess.userId is an Email, we have a mismatch if we pass only one.

            // Quick fix: Check both in the util or pass the one that matches the context.
            // I'll call it with email as `validUserId` if I suspect sharing uses email.
            // But Owner check uses ID.
            // I will modify `checkLedgerAccess` in the next step to be robust. 
            // For now, I will assume `session.user.id` is what I want to check for ownership, 
            // and validation might fail for sharing if I don't pass email.

            // Actually, I can check manually here for safety:
            // 1. Is Owner? (Account.userId == session.user.id)
            // 2. Is Editor? (LedgerAccess has email)

            // Let's blindly use checkLedgerAccess but I must update it to handle this specific dual-ID case.
            // OR, better, update `checkLedgerAccess` to take `userObject` { id, email }.

            // I'll proceed with calling it and update the util in parallel.
            const canEdit = await checkLedgerAccess(body.accountId, session.user.email, 'editor'); // Check shared access

            // We also need to check if they are the owner (ID based).
            // Since checkLedgerAccess checks Account.userId vs validUserId, if I pass email, it might not match Account.userId (ID).
            // So I should check ownership manually first or update util. 

            // Let's implement robust check inline here for now to avoid multiple file edits in one turn causing confusion.
            const account = await dbConnect().then(() => import('@/lib/models/Account').then(m => m.Account.findById(body.accountId)));

            // Correction: Dynamic import or use globa Account if already imported? 
            // Account is not imported in this file yet (Wait, previous step I imported local Transaction).
            // I need to import Account.

            // I will add the check logic in a block.

            // Pass both ID and Email to checkLedgerAccess to ensure Owner check (ID) and Shared check (Email) both work
            const accessResult = await checkLedgerAccess(body.accountId, { id: session.user.id, email: session.user.email }, 'editor');
            if (!accessResult.hasAccess) {
                return NextResponse.json({ error: accessResult.error || 'Access denied' }, { status: 403 });
            }

            // Log Activity
            // Use email if available, otherwise fallback to ID (e.g. phone login) to satisfy required field
            const logUserId = session.user.email || session.user.id;

            await ActivityLog.create({
                ledgerId: body.accountId,
                userId: logUserId,
                action: 'ENTRY_ADDED',
                details: `${session.user.name || 'User'} added ${body.amount} - ${body.category}`
            });
        }

        const newTransaction = new Transaction(newTransactionData);
        const saved = await newTransaction.save();

        console.log("Saved Transaction:", {
            id: saved._id,
            accountId: saved.accountId,
            linkedAccountId: saved.linkedAccountId,
            type: saved.type,
            amount: saved.amount
        });

        // Update Account Balances
        if (body.accountId) {
            const Account = (await import('@/lib/models/Account')).Account;

            // Primary Account Update
            const amount = parseFloat(body.amount);
            // Logic fix: body.type might have been flipped in frontend?
            // No, frontend sends "Money In" or "Money Out".
            // We used 'Money In' string check.
            // If frontend flipped it to "Money Out" (DEBIT) for Transfer, then `isCredit` is false.
            // `change` = -amount.
            // HDFC (Primary) decreases. Correct.

            const isCredit = body.type === 'Money In';
            const change = isCredit ? amount : -amount;

            console.log(`Updating Primary Account ${body.accountId}: ${change}`);
            await Account.findByIdAndUpdate(body.accountId, {
                $inc: { balance: change }
            });

            // Linked Account Update (Transfer)
            if (body.linkedAccountId) {
                console.log(`Updating Linked Account ${body.linkedAccountId}: ${-change}`);
                await Account.findByIdAndUpdate(body.linkedAccountId, {
                    $inc: { balance: -change }
                });
            }
        }

        return NextResponse.json(saved);
    } catch (error) {
        console.error("POST Transaction Error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
