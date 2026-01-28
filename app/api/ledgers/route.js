import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Ledger } from "@/lib/models/Ledger";
import dbConnect from "@/lib/db";

export async function POST(req) {
    try {
        const session = await auth();
        if (!session)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const data = await req.json();

        if (!data.name)
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 },
            );

        const userId = session.user.email;

        let ledger = await Ledger.findOne({ ownerId: userId, name: data.name });

        if (ledger) return NextResponse.json(ledger);

        ledger = await Ledger.create({
            name: data.name,
            ownerId: userId,
            description: data.description || "",
        });

        return NextResponse.json(ledger, { status: 201 });
    } catch (error) {
        console.error("Error creating ledger:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
