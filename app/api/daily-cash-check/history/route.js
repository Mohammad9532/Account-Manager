
import dbConnect from "@/lib/db";
import { DailyCashCheck } from "@/lib/models/DailyCashCheck";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('accountId');

        const query = { userId: session.user.id };
        if (accountId) query.accountId = accountId;

        // Default to last 30 checks
        const history = await DailyCashCheck.find(query)
            .sort({ date: -1 })
            .limit(30)
            .populate('accountId', 'name type currency');

        return NextResponse.json(history);

    } catch (error) {
        console.error("Daily Cash History Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
