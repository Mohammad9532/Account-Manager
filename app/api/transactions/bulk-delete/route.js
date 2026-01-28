import dbConnect from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";
import { updateAccountBalances } from "@/lib/balanceUtils";

export const dynamic = "force-dynamic";

export async function POST(request) {
    try {
        const session = await auth();
        if (!session)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: "Invalid or empty IDs list" },
                { status: 400 },
            );
        }

        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            const items = await Transaction.find({
                _id: { $in: ids },
                userId: session.user.id,
            }).session(dbSession);

            for (const item of items) {
                await updateAccountBalances(item, -1, dbSession);
            }

            const result = await Transaction.deleteMany(
                { _id: { $in: ids }, userId: session.user.id },
                { session: dbSession },
            );

            await dbSession.commitTransaction();
            return NextResponse.json({
                message: "Deleted successfully",
                count: result.deletedCount,
            });
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
