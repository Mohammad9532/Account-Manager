
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

const TransactionSchema = new mongoose.Schema({
    type: { type: String, required: true, enum: ['Money In', 'Money Out'] },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    scope: { type: String, default: 'manager' },
    userId: { type: String, index: true }
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function dedupRafeyLedger() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Regex for Rafey transactions
        const regex = /^Rafey - /;
        const allTransactions = await Transaction.find({ description: regex }).sort({ date: 1 });

        console.log(`Found ${allTransactions.length} potential "Rafey" transactions.`);

        if (allTransactions.length === 0) {
            console.log("No transactions found matching 'Rafey - ' pattern.");
            return;
        }

        const duplicatesToRemove = [];
        const seen = new Set();

        for (const txn of allTransactions) {
            // 2. Loose Identification Strategy
            // Ignore detailed timestamp (ms) and check Date(YYYY-MM-DD) + Amount + Type + Description
            // This catches cases where the import was run twice, generating different milliseconds but same day/data.

            const simpleDate = txn.date.toISOString().split('T')[0];
            const key = `${simpleDate}|${txn.amount}|${txn.type}|${txn.description}`;

            if (seen.has(key)) {
                duplicatesToRemove.push(txn._id);
            } else {
                seen.add(key);
            }
        }

        console.log(`Identified ${duplicatesToRemove.length} duplicates (Same Date-Day, Amount, Desc).`);

        if (process.argv.includes('--delete')) {
            if (duplicatesToRemove.length > 0) {
                console.log('Deleting duplicates...');
                const result = await Transaction.deleteMany({ _id: { $in: duplicatesToRemove } });
                console.log(`Deleted ${result.deletedCount} transactions.`);
            } else {
                console.log('No duplicates to delete.');
            }
        } else {
            console.log('DRY RUN COMPLETE. No data was deleted.');
            console.log('Run with --delete to actually remove files.');
            if (duplicatesToRemove.length > 0) {
                console.log('Sample duplicates found:');
                const samples = duplicatesToRemove.slice(0, 5);
                for (let id of samples) {
                    const t = allTransactions.find(x => x._id.toString() === id.toString());
                    console.log(` - ${t.date.toISOString()} | ${t.description} | ${t.amount}`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

dedupRafeyLedger();
