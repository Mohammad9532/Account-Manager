import dbConnect from "@/lib/db";
import { DailyExpense } from "@/lib/models/DailyExpense";
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
        const expenses = await DailyExpense.find({
            userId: session.user.id,
        }).sort({ date: -1 });

        return NextResponse.json(expenses, {
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
                const itemsWithUser = body.map((t) => {
                    const amountInCents = Math.round(parseFloat(t.amount) * 100);
                    const impact = (t.type === "Money In" ? 1 : -1) * amountInCents;
                    return {
                        ...t,
                        amount: amountInCents,
                        userId: session.user.id,
                        balanceImpact: impact,
                    };
                });
                const savedItems = await DailyExpense.insertMany(
                    itemsWithUser,
                    { session: dbSession },
                );

                for (const item of savedItems) {
                    await updateAccountBalances(item, 1, dbSession, session.user.id);
                }

                await dbSession.commitTransaction();
                return NextResponse.json(savedItems);
            }

            const amountInCents = Math.round(parseFloat(body.amount) * 100);
            const impact = (body.type === "Money In" ? 1 : -1) * amountInCents;
            const newExpense = new DailyExpense({
                ...body,
                amount: amountInCents,
                userId: session.user.id,
                balanceImpact: impact,
            });

            const saved = await newExpense.save({ session: dbSession });
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
