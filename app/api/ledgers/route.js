
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Fixed path
import { Ledger } from '@/lib/models/Ledger'; // Used @ alias
import dbConnect from '@/lib/db'; // Fixed to default import and @ alias

// POST: Register a new Shareable Ledger Identity
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const data = await req.json();

        // Input: { name: 'Ledger Name' }
        if (!data.name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const userId = session.user.email; // Or id? Using email based on context.

        // Check if already exists
        let ledger = await Ledger.findOne({
            ownerId: userId,
            name: data.name
        });

        if (ledger) {
            // Idempotent: If exists, return it.
            return NextResponse.json(ledger);
        }

        // Create new
        ledger = await Ledger.create({
            name: data.name,
            ownerId: userId,
            description: data.description || ''
        });

        return NextResponse.json(ledger, { status: 201 });

    } catch (error) {
        console.error("Error creating ledger:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
