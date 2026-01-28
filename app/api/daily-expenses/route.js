
import dbConnect from "@/lib/db";
import { DailyExpense } from "@/lib/models/DailyExpense";
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

        // Filter by user ID
        const expenses = await DailyExpense.find({ userId: session.user.id }).sort({ date: -1 });

        return NextResponse.json(expenses, {
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

        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await request.json();
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            // Handle Bulk Create (Array) - just in case
            if (Array.isArray(body)) {
                const itemsWithUser = body.map(t => {
                    const impact = (t.type === 'Money In' ? 1 : -1) * parseFloat(t.amount);
                    return {
                        ...t,
                        userId: session.user.id,
                        balanceImpact: impact
                    };
                });
                const savedItems = await DailyExpense.insertMany(itemsWithUser, { session: dbSession });

                // Update balances
                for (const item of savedItems) {
                    await updateAccountBalances(item, 1, dbSession);
                }

                await dbSession.commitTransaction();
                return NextResponse.json(savedItems);
            }

            const impact = (body.type === 'Money In' ? 1 : -1) * parseFloat(body.amount);
            const newExpense = new DailyExpense({
                ...body,
                userId: session.user.id,
                balanceImpact: impact
            });

            const saved = await newExpense.save({ session: dbSession });
            await updateAccountBalances(saved, 1, dbSession);

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
