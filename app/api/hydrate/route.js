
import dbConnect from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { DailyExpense } from "@/lib/models/DailyExpense";
import { Account } from "@/lib/models/Account";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const userId = session.user.id;

        // Fetch accounts and recent transactions in parallel
        const [accounts, ledgers, dailies] = await Promise.all([
            Account.find({ userId }).lean(),
            Transaction.find({ userId }).sort({ date: -1 }).limit(100).lean(),
            DailyExpense.find({ userId }).sort({ date: -1 }).limit(100).lean()
        ]);

        return NextResponse.json({
            accounts,
            transactions: ledgers, // Already sorted newest first
            dailyExpenses: dailies
        });
    } catch (error) {
        console.error("[Hydrate] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
