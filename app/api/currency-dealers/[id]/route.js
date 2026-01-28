import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { CurrencyDealer } from "@/lib/models/CurrencyDealer";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
    try {
        const session = await auth();
        if (!session)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const { id } = await params;
        const dealer = await CurrencyDealer.findOne({
            _id: id,
            userId: session.user.id,
        });

        if (!dealer)
            return NextResponse.json(
                { error: "Dealer not found" },
                { status: 404 },
            );

        return NextResponse.json(dealer);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const session = await auth();
        if (!session)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const { id } = await params;
        const data = await req.json();

        const updatedDealer = await CurrencyDealer.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            data,
            { new: true, runValidators: true },
        );

        if (!updatedDealer)
            return NextResponse.json(
                { error: "Dealer not found" },
                { status: 404 },
            );

        return NextResponse.json(updatedDealer);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const session = await auth();
        if (!session)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const { id } = await params;

        const deleted = await CurrencyDealer.findOneAndDelete({
            _id: id,
            userId: session.user.id,
        });

        if (!deleted)
            return NextResponse.json(
                { error: "Dealer not found" },
                { status: 404 },
            );

        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
