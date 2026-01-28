import { NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import { CurrencyDealer } from "@/lib/models/CurrencyDealer";
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const dealers = await CurrencyDealer.find({ userId: session.user.id }).sort({ createdAt: -1 });
        return NextResponse.json(dealers);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const body = await req.json();

        const dealer = new CurrencyDealer({
            ...body,
            userId: session.user.id
        });

        const saved = await dealer.save();
        return NextResponse.json(saved);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
