import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { User } from "@/lib/models/User";
import { NextResponse } from "next/server";

export async function PUT(req) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, email, phone } = await req.json();
        await dbConnect();

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { name, email, phone },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone
            }
        });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
