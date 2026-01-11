
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

// Transaction Schema
const TransactionSchema = new mongoose.Schema({
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    scope: { type: String, default: 'manager' },
    userId: { type: String }
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function restoreData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Fetch a valid user ID from an existing transaction
        const existingTxn = await Transaction.findOne();
        if (!existingTxn) {
            console.error('No existing transactions found to infer User ID.');
            return;
        }
        const userId = existingTxn.userId;
        console.log('Using User ID:', userId);

        const transactionsToRestore = [
            {
                description: 'Beingreal',
                category: 'EMI PAID',
                amount: 5520,
                type: 'Money Out', // Debit
                date: new Date('2026-01-11'),
                scope: 'manager',
                userId: userId
            },
            {
                description: 'Beingreal',
                category: 'PAN Card',
                amount: 110,
                type: 'Money In', // Credit
                date: new Date('2026-01-11'),
                scope: 'manager',
                userId: userId
            }
        ];

        for (const txn of transactionsToRestore) {
            // Optional: Check if duplicate exists to avoid double-restore if run twice
            const exists = await Transaction.findOne({
                description: txn.description,
                category: txn.category,
                amount: txn.amount,
                type: txn.type,
                date: {
                    $gte: new Date(txn.date.setHours(0, 0, 0, 0)),
                    $lt: new Date(txn.date.setHours(23, 59, 59, 999))
                }
            });

            if (exists) {
                console.log(`Skipping duplicate: ${txn.category} - ${txn.amount}`);
            } else {
                const newTxn = await Transaction.create(txn);
                console.log(`Restored: ${newTxn.category} - ${newTxn.amount}`);
            }
        }

        console.log('Restoration complete.');

    } catch (error) {
        console.error('Error restoring data:', error);
    } finally {
        await mongoose.disconnect();
    }
}

restoreData();
