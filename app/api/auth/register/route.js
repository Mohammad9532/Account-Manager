import dbConnect from "@/lib/db";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        await dbConnect();
        const { name, phone, password } = await request.json();

        if (!name || !phone || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check availability
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            phone,
            password: hashedPassword,
            provider: 'credentials'
        });

        return NextResponse.json({ success: true, userId: newUser._id });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
