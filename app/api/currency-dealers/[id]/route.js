import { NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import { CurrencyDealer } from "@/lib/models/CurrencyDealer";
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const dealer = await CurrencyDealer.findOne({ _id: id, userId: session.user.id });

        if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });

        return NextResponse.json(dealer);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const data = await req.json();

        // Check if we are pushing a new transaction or updating the whole doc
        // For simplicity, we'll assume the client sends the update operation `$push` or just the data to set
        // But to be safe with Mongoose, let's just use findOneAndUpdate with the body provided

        const updatedDealer = await CurrencyDealer.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            data, // Allow full update including $push if sent from client, or $set
            { new: true, runValidators: true }
        );

        if (!updatedDealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });

        return NextResponse.json(updatedDealer);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;

        const deleted = await CurrencyDealer.findOneAndDelete({ _id: id, userId: session.user.id });

        if (!deleted) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
