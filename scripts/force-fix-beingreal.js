
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

const TransactionSchema = new mongoose.Schema({}, { strict: false });
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function forceFix() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Target both "Beingreal" and "BeingReal"
        const filter = {
            scope: 'manager',
            description: { $in: ['Beingreal', 'BeingReal'] }
        };

        // 1. Set Name to "Being Real" (with space, looks better, covers potential formatting)
        // 2. Set Time to 12:00 PM to avoid date-boundary issues
        const safeDate = new Date('2026-01-11T12:00:00.000Z');

        const result = await Transaction.updateMany(
            filter,
            {
                $set: {
                    description: 'Being Real',
                    date: safeDate
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} transactions to 'Being Real' at 12:00 PM.`);

        // Verify
        const updated = await Transaction.find({ description: 'Being Real' });
        console.log('Verified Updated:', updated.map(t => ({ id: t._id, desc: t.description, date: t.date })));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

forceFix();
