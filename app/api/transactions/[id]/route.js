import dbConnect from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";
import { updateAccountBalances } from "@/lib/balanceUtils";

export const dynamic = "force-dynamic";

async function checkOwnership(id, userId) {
    const transaction = await Transaction.findById(id);
    if (!transaction) return null;
    if (transaction.userId && transaction.userId != userId) {
        throw new Error("Unauthorized access to this transaction");
    }
    return transaction;
}

export async function PUT(request, { params }) {
    try {
        const session = await auth();
        if (!session)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        const { id } = await params;
        await dbConnect();
        const body = await request.json();

        try {
            const existing = await checkOwnership(id, session.user.id);
            if (!existing)
                return NextResponse.json(
                    { error: "Transaction not found" },
                    { status: 404 },
                );
        } catch (authError) {
            return NextResponse.json(
                { error: authError.message },
                { status: 403 },
            );
        }

        delete body.userId;

        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            const existing = await Transaction.findById(id).session(dbSession);
            if (!existing) {
                await dbSession.abortTransaction();
                return NextResponse.json(
                    { error: "Transaction not found" },
                    { status: 404 },
                );
            }

            // PASS userId for security check
            await updateAccountBalances(existing, -1, dbSession, session.user.id);

            const updatedAmount =
                body.amount !== undefined
                    ? Math.round(parseFloat(body.amount) * 100)
                    : existing.amount;
            const updatedType = body.type || existing.type;
            const newImpact =
                (updatedType === "Money In" ? 1 : -1) * updatedAmount;

            const updatedTransaction = await Transaction.findByIdAndUpdate(
                id,
                { ...body, amount: updatedAmount, balanceImpact: newImpact },
                { new: true, session: dbSession },
            );

            await updateAccountBalances(updatedTransaction, 1, dbSession, session.user.id);

            await dbSession.commitTransaction();
            return NextResponse.json(updatedTransaction);
        } catch (error) {
            await dbSession.abortTransaction();
            throw error;
        } finally {
            dbSession.endSession();
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await auth();
        if (!session)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        const { id } = await params;
        await dbConnect();

        try {
            const existing = await checkOwnership(id, session.user.id);
            if (!existing)
                return NextResponse.json(
                    { error: "Transaction not found" },
                    { status: 404 },
                );
        } catch (authError) {
            return NextResponse.json(
                { error: authError.message },
                { status: 403 },
            );
        }

        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            const existing = await Transaction.findById(id).session(dbSession);
            if (!existing) {
                await dbSession.abortTransaction();
                return NextResponse.json(
                    { error: "Transaction not found" },
                    { status: 404 },
                );
            }

            await updateAccountBalances(existing, -1, dbSession, session.user.id);
            await Transaction.findByIdAndDelete(id, { session: dbSession });

            await dbSession.commitTransaction();
            return NextResponse.json({ message: "Transaction deleted" });
        } catch (error) {
            await dbSession.abortTransaction();
            throw error;
        } finally {
            dbSession.endSession();
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
