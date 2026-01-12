import dbConnect from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        if (!process.env.MONGODB_URI) return NextResponse.json({ error: 'DB URI missing' }, { status: 500 });

        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Filter transactions by the logged-in user's ID
        const transactions = await Transaction.find({ userId: session.user.id }).sort({ date: -1 });

        return NextResponse.json(transactions);
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
        const newTransaction = new Transaction({
            ...body,
            userId: session.user.id
        });

        const saved = await newTransaction.save();
        return NextResponse.json(saved);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
