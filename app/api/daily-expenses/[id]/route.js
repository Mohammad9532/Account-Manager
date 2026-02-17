import dbConnect from "@/lib/db";
import { DailyExpense } from "@/lib/models/DailyExpense";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";
import { updateAccountBalances } from "@/lib/balanceUtils";

export const dynamic = "force-dynamic";

export async function GET(request, props) {
    try {
        const { id } = await props.params;

        const session = await auth();
        if (!session)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const expense = await DailyExpense.findOne({
            _id: id,
            userId: session.user.id,
        });
        if (!expense)
            return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json(expense);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, props) {
    try {
        const { id } = await props.params;

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
            const existing = await DailyExpense.findOne({
                _id: id,
                userId: session.user.id,
            }).session(dbSession);
            if (!existing) {
                await dbSession.abortTransaction();
                return NextResponse.json(
                    { error: "Not found or unauthorized" },
                    { status: 404 },
                );
            }

            await updateAccountBalances(existing, -1, dbSession, session.user.id);

            const updatedAmount =
                body.amount !== undefined
                    ? Math.round(parseFloat(body.amount) * 100)
                    : existing.amount;
            const updatedType = body.type || existing.type;
            const newImpact =
                (updatedType === "Money In" ? 1 : -1) * updatedAmount;

            const updated = await DailyExpense.findOneAndUpdate(
                { _id: id, userId: session.user.id },
                { ...body, amount: updatedAmount, balanceImpact: newImpact },
                { new: true, session: dbSession },
            );

            await updateAccountBalances(updated, 1, dbSession, session.user.id);

            await dbSession.commitTransaction();
            return NextResponse.json(updated);
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

export async function DELETE(request, props) {
    try {
        const { id } = await props.params;

        const session = await auth();
        if (!session)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            const existing = await DailyExpense.findOne({
                _id: id,
                userId: session.user.id,
            }).session(dbSession);
            if (!existing) {
                await dbSession.abortTransaction();
                return NextResponse.json(
                    { error: "Not found or unauthorized" },
                    { status: 404 },
                );
            }

            await updateAccountBalances(existing, -1, dbSession, session.user.id);
            await DailyExpense.findOneAndDelete(
                { _id: id, userId: session.user.id },
                { session: dbSession },
            );

            await dbSession.commitTransaction();
            return NextResponse.json({ message: "Deleted successfully" });
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
