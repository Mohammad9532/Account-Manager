import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '../../../lib/db';
import { Account } from '../../../lib/models/Account';
import { Transaction } from '../../../lib/models/Transaction';
import { DailyExpense } from '../../../lib/models/DailyExpense';

export async function DELETE(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Delete all data for the user
        await Promise.all([
            Account.deleteMany({ userId }),
            Transaction.deleteMany({ userId }),
            DailyExpense.deleteMany({ userId })
        ]);

        return NextResponse.json({ message: 'All data reset successfully' });
    } catch (error) {
        console.error('Error resetting data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
