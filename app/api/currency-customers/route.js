import { NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import { CurrencyCustomer } from "@/lib/models/CurrencyCustomer";
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const customers = await CurrencyCustomer.find({ userId: session.user.id }).sort({ createdAt: -1 });
        return NextResponse.json(customers);
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

        const customer = new CurrencyCustomer({
            ...body,
            userId: session.user.id
        });

        const saved = await customer.save();
        return NextResponse.json(saved);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
