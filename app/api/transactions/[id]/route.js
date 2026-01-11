import dbConnect from "@/lib/db";
import { Transaction } from "@/server/models/Transaction";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
    try {
        if (!process.env.MONGODB_URI) return NextResponse.json({ error: 'DB URI missing' }, { status: 500 });
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const updated = await Transaction.findByIdAndUpdate(
            id,
            body,
            { new: true }
        );
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    try {
        if (!process.env.MONGODB_URI) return NextResponse.json({ error: 'DB URI missing' }, { status: 500 });
        await dbConnect();
        const { id } = await params;
        await Transaction.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
