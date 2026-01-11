import dbConnect from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

async function checkOwnership(id, userId) {
    const transaction = await Transaction.findById(id);
    if (!transaction) return null;
    // Use loose equality to match MongoDB ObjectId with String ID
    if (transaction.userId && transaction.userId != userId) {
        throw new Error("Unauthorized access to this transaction");
    }
    return transaction;
}

export async function PUT(request, { params }) {
    try {
        if (!process.env.MONGODB_URI) return NextResponse.json({ error: 'DB URI missing' }, { status: 500 });

        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await dbConnect();
        const body = await request.json();

        // Verify ownership
        try {
            const existing = await checkOwnership(id, session.user.id);
            if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        } catch (authError) {
            return NextResponse.json({ error: authError.message }, { status: 403 });
        }

        // Ensure we don't overwrite userId
        delete body.userId;

        const updatedTransaction = await Transaction.findByIdAndUpdate(
            id,
            { ...body },
            { new: true }
        );

        if (!updatedTransaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }
        return NextResponse.json(updatedTransaction);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        if (!process.env.MONGODB_URI) return NextResponse.json({ error: 'DB URI missing' }, { status: 500 });

        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await dbConnect();

        // Verify ownership
        try {
            const existing = await checkOwnership(id, session.user.id);
            if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        } catch (authError) {
            return NextResponse.json({ error: authError.message }, { status: 403 });
        }

        const deletedTransaction = await Transaction.findByIdAndDelete(id);

        if (!deletedTransaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }
        return NextResponse.json({ message: "Transaction deleted" });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
