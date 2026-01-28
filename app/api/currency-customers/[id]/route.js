import { NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import { CurrencyCustomer } from "@/lib/models/CurrencyCustomer";
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const customer = await CurrencyCustomer.findOne({ _id: id, userId: session.user.id });

        if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

        return NextResponse.json(customer);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const data = await req.json();

        const updatedCustomer = await CurrencyCustomer.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            data,
            { new: true, runValidators: true }
        );

        if (!updatedCustomer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

        return NextResponse.json(updatedCustomer);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;

        const deleted = await CurrencyCustomer.findOneAndDelete({ _id: id, userId: session.user.id });

        if (!deleted) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
