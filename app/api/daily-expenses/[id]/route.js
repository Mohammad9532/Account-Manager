
import dbConnect from "@/lib/db";
import { DailyExpense } from "@/lib/models/DailyExpense";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";
import { updateAccountBalances } from "@/lib/balanceUtils";

export const dynamic = 'force-dynamic';

export async function GET(request, props) {
    try {
        const params = await props.params;
        const { id } = params;
        if (!process.env.MONGODB_URI) return NextResponse.json({ error: 'DB URI missing' }, { status: 500 });

        await dbConnect();

        // Ensure user owns this
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const expense = await DailyExpense.findOne({ _id: id, userId: session.user.id });
        if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json(expense);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, props) {
    try {
        const params = await props.params;
        const { id } = params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const body = await request.json();

        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            // Find existing to reverse impact
            const existing = await DailyExpense.findOne({ _id: id, userId: session.user.id }).session(dbSession);
            if (!existing) {
                await dbSession.abortTransaction();
                return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
            }

            // Reverse old impact
            await updateAccountBalances(existing, -1, dbSession);

            // Calculate new impact if amount or type changed
            const updatedAmount = body.amount !== undefined ? parseFloat(body.amount) : existing.amount;
            const updatedType = body.type || existing.type;
            const newImpact = (updatedType === 'Money In' ? 1 : -1) * updatedAmount;

            const updated = await DailyExpense.findOneAndUpdate(
                { _id: id, userId: session.user.id },
                { ...body, balanceImpact: newImpact },
                { new: true, session: dbSession }
            );

            // Apply new impact
            await updateAccountBalances(updated, 1, dbSession);

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
        const params = await props.params;
        const { id } = params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            const existing = await DailyExpense.findOne({ _id: id, userId: session.user.id }).session(dbSession);
            if (!existing) {
                await dbSession.abortTransaction();
                return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
            }

            // Reverse impact before deleting
            await updateAccountBalances(existing, -1, dbSession);

            await DailyExpense.findOneAndDelete({ _id: id, userId: session.user.id }, { session: dbSession });

            await dbSession.commitTransaction();
            return NextResponse.json({ message: 'Deleted successfully' });
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
