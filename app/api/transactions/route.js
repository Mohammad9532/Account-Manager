import dbConnect from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";
import { updateAccountBalances } from "@/lib/balanceUtils";

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

        return NextResponse.json(transactions, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        if (!process.env.MONGODB_URI) return NextResponse.json({ error: 'DB URI missing' }, { status: 500 });

        const sessionUser = await getServerSession(authOptions);
        if (!sessionUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await request.json();
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Handle Bulk Create (Array)
            if (Array.isArray(body)) {
                const transactionsWithUser = body.map(t => {
                    const impact = (t.type === 'Money In' ? 1 : -1) * parseFloat(t.amount);
                    return {
                        ...t,
                        userId: sessionUser.user.id,
                        balanceImpact: impact
                    };
                });

                const savedTransactions = await Transaction.insertMany(transactionsWithUser, { session });

                // Update balances for each
                for (const t of savedTransactions) {
                    await updateAccountBalances(t, 1, session);
                }

                await session.commitTransaction();
                return NextResponse.json(savedTransactions);
            }

            // Handle Single Create (Object)
            const impact = (body.type === 'Money In' ? 1 : -1) * parseFloat(body.amount);
            const newTransaction = new Transaction({
                ...body,
                userId: sessionUser.user.id,
                balanceImpact: impact
            });

            const saved = await newTransaction.save({ session });
            await updateAccountBalances(saved, 1, session);

            await session.commitTransaction();
            return NextResponse.json(saved);
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
