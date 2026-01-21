import { NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import { Account } from "@/lib/models/Account";
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { checkLedgerAccess } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Strict: Only Owner can delete account
        // We pass both ID and email to be safe, though account ownership is usually ID based.
        const { hasAccess, role } = await checkLedgerAccess(id, { id: session.user.id, email: session.user.email }, 'owner');

        if (!hasAccess || role !== 'owner') {
            return NextResponse.json({ error: 'Only the owner can delete this account' }, { status: 403 });
        }

        const deletedAccount = await Account.findByIdAndDelete(id);

        if (!deletedAccount) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const data = await req.json();

        // Check Permissions: Only Owner can edit Account Settings
        const { hasAccess, role } = await checkLedgerAccess(id, { id: session.user.id, email: session.user.email }, 'owner');

        if (!hasAccess || role !== 'owner') {
            return NextResponse.json({ error: 'Only the owner can update account settings' }, { status: 403 });
        }

        const updatedAccount = await Account.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!updatedAccount) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        return NextResponse.json(updatedAccount);
    } catch (error) {
        console.error('Error updating account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
