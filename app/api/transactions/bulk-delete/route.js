
import dbConnect from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid or empty IDs list' }, { status: 400 });
        }

        const result = await Transaction.deleteMany({
            _id: { $in: ids },
            userId: session.user.id // Ensure we only delete our own
        });

        return NextResponse.json({ message: 'Deleted successfully', count: result.deletedCount });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
