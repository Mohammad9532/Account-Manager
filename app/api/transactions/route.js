import dbConnect from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";
import { updateAccountBalances } from "@/lib/balanceUtils";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const transactions = await Transaction.find({
            userId: session.user.id,
        }).sort({ date: -1 });

        return NextResponse.json(transactions, {
            headers: {
                "Cache-Control":
                    "no-store, no-cache, must-revalidate, proxy-revalidate",
                Pragma: "no-cache",
                Expires: "0",
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();
        if (!session)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const body = await request.json();
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            if (Array.isArray(body)) {
                const transactionsWithUser = body.map((t) => {
                    const amountInCents = Math.round(parseFloat(t.amount) * 100);
                    const impact = (t.type === "Money In" ? 1 : -1) * amountInCents;

                    return {
                        ...t,
                        amount: amountInCents,
                        userId: session.user.id,
                        balanceImpact: impact,
                    };
                });

                const savedTransactions = await Transaction.insertMany(
                    transactionsWithUser,
                    { session: dbSession },
                );

                for (const t of savedTransactions) {
                    await updateAccountBalances(t, 1, dbSession, session.user.id);
                }

                await dbSession.commitTransaction();
                return NextResponse.json(savedTransactions);
            }

            // Single Transaction
            const amountInCents = Math.round(parseFloat(body.amount) * 100);
            const impact = (body.type === "Money In" ? 1 : -1) * amountInCents;

            const newTransaction = new Transaction({
                ...body,
                amount: amountInCents,
                userId: session.user.id,
                balanceImpact: impact,
            });

            const saved = await newTransaction.save({ session: dbSession });
            await updateAccountBalances(saved, 1, dbSession, session.user.id);

            await dbSession.commitTransaction();
            return NextResponse.json(saved);
        } catch (error) {
            await dbSession.abortTransaction();
            throw error;
        } finally {
            dbSession.endSession();
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
