import dbConnect from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { DailyExpense } from "@/lib/models/DailyExpense";
import { Account } from "@/lib/models/Account";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const userId = session.user.id;

        const [accounts, ledgers, dailies] = await Promise.all([
            Account.find({ userId }).lean(),
            Transaction.find({ userId }).sort({ date: -1 }).limit(100).lean(),
            DailyExpense.find({ userId }).sort({ date: -1 }).limit(100).lean(),
        ]);

        return NextResponse.json({
            accounts,
            transactions: ledgers,
            dailyExpenses: dailies,
        });
    } catch (error) {
        console.error("[Hydrate] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
