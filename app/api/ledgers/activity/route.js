import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Account } from '@/lib/models/Account';
import { LedgerAccess } from '@/lib/models/LedgerAccess';
import { ActivityLog } from '@/lib/models/ActivityLog';
import dbConnect from '@/lib/db';
import { checkLedgerAccess } from '@/lib/permissions';

export async function GET(req) {
    try {
        await dbConnect();
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const ledgerId = searchParams.get('ledgerId');

        if (!ledgerId) return NextResponse.json({ error: 'Missing ledgerId' }, { status: 400 });

        // Check permissions: Viewer or above can view logs?
        // Usually Owners and Editors. Let's say Viewers too.
        const { hasAccess } = await checkLedgerAccess(ledgerId, { id: session.user.id, email: session.user.email }, 'viewer');

        if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch logs
        const logs = await ActivityLog.find({ ledgerId }).sort({ createdAt: -1 }).limit(50); // Limit to recent 50

        return NextResponse.json(logs);

    } catch (error) {
        console.error('Get activity logs error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
