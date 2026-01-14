
import dbConnect from "@/lib/db";
import { DailyExpense } from "@/lib/models/DailyExpense";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
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

export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const body = await request.json();

        // Update
        const updated = await DailyExpense.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            { ...body },
            { new: true }
        );

        if (!updated) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const deleted = await DailyExpense.findOneAndDelete({ _id: id, userId: session.user.id });

        if (!deleted) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
