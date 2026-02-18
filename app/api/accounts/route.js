import dbConnect from "@/lib/db";
import { Account } from "@/lib/models/Account";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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
        const accounts = await Account.find({ userId: session.user.id }).sort({
            createdAt: 1,
        });
        return NextResponse.json(accounts);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await auth();
        if (!session)
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const data = { ...body };
        if (data.balance !== undefined) data.balance = Math.round(parseFloat(data.balance) * 100);
        if (data.initialBalance !== undefined) data.initialBalance = Math.round(parseFloat(data.initialBalance) * 100);
        if (data.creditLimit !== undefined) data.creditLimit = Math.round(parseFloat(data.creditLimit) * 100);

        const account = new Account({
            ...data,
            userId: session.user.id,
        });

        const saved = await account.save();
        return NextResponse.json(saved);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
