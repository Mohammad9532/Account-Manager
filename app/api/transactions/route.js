import dbConnect from "@/lib/db";
import { Transaction } from "@/server/models/Transaction";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        if (!process.env.MONGODB_URI) return NextResponse.json({ error: 'DB URI missing' }, { status: 500 });
        await dbConnect();
        const transactions = await Transaction.find().sort({ date: -1 });
        console.log(`📡 API: Fetched ${transactions.length} transactions.`);
        const scopes = [...new Set(transactions.map(t => t.scope || 'manager'))];
        console.log(`🔍 Scopes found: ${scopes.join(', ')}`);
        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        if (!process.env.MONGODB_URI) return NextResponse.json({ error: 'DB URI missing' }, { status: 500 });
        await dbConnect();
        const body = await request.json();
        const newTransaction = new Transaction(body);
        const saved = await newTransaction.save();
        return NextResponse.json(saved);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
