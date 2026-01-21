import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Imported authOptions
import { Account } from '@/lib/models/Account';
import { User } from '@/lib/models/User';
import { LedgerAccess } from '@/lib/models/LedgerAccess';
import { ActivityLog } from '@/lib/models/ActivityLog';
import dbConnect from '@/lib/db';

export async function POST(req) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions); // Passed authOptions
        if (!session) {
            console.log("POST /api/ledgers/share: No session found");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { ledgerId, email, role } = body;

        console.log(`POST /api/ledgers/share: Request from ${session.user.email} to invite ${email} to ledger ${ledgerId}`);

        if (!ledgerId || !email || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const inviterId = session.user.id || session.user.email;

        // Verify Inviter is Owner
        const account = await Account.findById(ledgerId);
        if (!account) {
            console.log(`POST /api/ledgers/share: Ledger ${ledgerId} not found`);
            return NextResponse.json({ error: 'Ledger not found' }, { status: 404 });
        }

        // Ensure robust comparison by converting to string
        if (String(account.userId) !== String(inviterId)) {
            console.log(`POST /api/ledgers/share: Forbidden. Owner: ${account.userId}, Inviter: ${inviterId}`);
            return NextResponse.json({ error: 'Only the owner can invite users' }, { status: 403 });
        }

        // Find Invitee
        const invitee = await User.findOne({ email });
        if (!invitee) {
            console.log(`POST /api/ledgers/share: User ${email} not found`);
            return NextResponse.json({ error: 'User not found. They must be registered.' }, { status: 404 });
        }

        if (invitee.email === session.user.email) {
            return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 });
        }

        // Check if already shared
        // We use invitee.email as userId in LedgerAccess for consistency with how we found them
        const existingAccess = await LedgerAccess.findOne({ ledgerId, userId: invitee.email });

        if (existingAccess) {
            console.log(`POST /api/ledgers/share: User ${email} already has access`);
            return NextResponse.json({ error: 'User already has access' }, { status: 409 });
        }

        // Create Access
        await LedgerAccess.create({
            ledgerId,
            userId: invitee.email, // Storing email as the identifier
            role,
            invitedBy: inviterId
        });

        // Log Activity
        await ActivityLog.create({
            ledgerId,
            userId: inviterId,
            action: 'USER_INVITED',
            details: `Invited ${email} as ${role}`
        });

        console.log(`POST /api/ledgers/share: Success`);
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Share error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions); // Passed authOptions
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { ledgerId, userIdToRemove } = body;

        const removerId = session.user.id || session.user.email;

        // Verify Remover is Owner
        const account = await Account.findById(ledgerId);
        if (!account) return NextResponse.json({ error: 'Ledger not found' }, { status: 404 });

        if (String(account.userId) !== String(removerId)) {
            return NextResponse.json({ error: 'Only the owner can remove users' }, { status: 403 });
        }

        await LedgerAccess.findOneAndDelete({ ledgerId, userId: userIdToRemove });

        // Log
        await ActivityLog.create({
            ledgerId,
            userId: removerId,
            action: 'USER_REMOVED',
            details: `Removed access for ${userIdToRemove}`
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Remove access error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions); // Passed authOptions
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const ledgerId = searchParams.get('ledgerId');

        if (!ledgerId) return NextResponse.json({ error: 'Missing ledgerId' }, { status: 400 });

        const userId = session.user.id || session.user.email;

        const account = await Account.findById(ledgerId);
        if (!account) return NextResponse.json({ error: 'Ledger not found' }, { status: 404 });

        // Allow owner OR anyone who already has access to see the list? 
        // Typically only owner should see who has access, OR everyone with access.
        // Let's check if the requester has access
        const userAccess = await LedgerAccess.findOne({ ledgerId, userId: session.user.email });

        if (String(account.userId) !== String(userId) && !userAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const accessList = await LedgerAccess.find({ ledgerId });

        const enhancedList = await Promise.all(accessList.map(async (access) => {
            const user = await User.findOne({ email: access.userId }).select('name image email');
            return {
                ...access.toObject(),
                user: user || { email: access.userId, name: 'Unknown' }
            };
        }));

        return NextResponse.json({ users: enhancedList });

    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
