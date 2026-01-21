
import dbConnect from "@/lib/db";
import { Account } from "@/lib/models/Account";
import { LedgerAccess } from "@/lib/models/LedgerAccess";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        // 1. Own Accounts
        const ownAccounts = await Account.find({ userId: session.user.id }).sort({ createdAt: 1 });

        // 2. Shared Accounts
        // Find ledgers shared with this user (by email or ID)
        // We check both for robustness, though usually email for sharing
        const userEmail = session.user.email;
        const userId = session.user.id;

        const sharedAccess = await LedgerAccess.find({
            $or: [
                { userId: userEmail },
                { userId: userId }
            ]
        });

        const sharedLedgerIds = sharedAccess.map(a => a.ledgerId);

        // Fetch shared accounts
        const sharedAccounts = await Account.find({ _id: { $in: sharedLedgerIds } });

        // Combine
        // We might want to mark them as shared in the object or let frontend handle it.
        // Let's add a virtual property or just return them. 
        // Mongoose documents are objects.

        const allAccounts = [
            ...ownAccounts.map(a => ({ ...a.toObject(), isShared: false })),
            ...sharedAccounts.map(a => ({ ...a.toObject(), isShared: true, sharedRole: sharedAccess.find(sa => sa.ledgerId.toString() === a._id.toString())?.role }))
        ];

        // Sort combined list - maybe keep own first? Or sort by Name? Matches createdAt sort?
        // Let's just return combined.

        return NextResponse.json(allAccounts);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const body = await req.json();

        const account = new Account({
            ...body,
            userId: session.user.id
        });

        const saved = await account.save();
        return NextResponse.json(saved);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
