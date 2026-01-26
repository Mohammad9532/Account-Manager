
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Account } from '../lib/models/Account.js';
import { Transaction } from '../lib/models/Transaction.js';

dotenv.config({ path: '.env' });

async function syncBalances() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI is missing in .env');

        await mongoose.connect(uri, { dbName: 'Mintmart' });
        console.log("✅ Connected to MongoDB Atlas (Mintmart)");

        const accounts = await Account.find({});
        const transactions = await Transaction.find({});
        console.log(`📊 Found ${accounts.length} accounts and ${transactions.length} transactions.`);

        for (const acc of accounts) {
            console.log(`\nProcessing "${acc.name}" (${acc.type}, ID: ${acc._id})...`);

            const accId = String(acc._id);
            const accName = (acc.name || '').toLowerCase().trim();

            // Recalculate balance for this account
            const balance = transactions.reduce((sum, t) => {
                const tAccountId = t.accountId ? String(t.accountId) : null;
                const tLinkedId = t.linkedAccountId ? String(t.linkedAccountId) : null;
                const tDesc = (t.description || '').toLowerCase().trim();

                // Logic: Match if direct ID link OR if a name-match exists for "Orphan" transactions (only for 'Other' type)
                let isMatch = (tAccountId === accId || tLinkedId === accId);

                if (!isMatch && acc.type === 'Other' && !t.accountId && !t.linkedAccountId && tDesc === accName) {
                    isMatch = true;
                }

                if (isMatch) {
                    const amount = parseFloat(t.amount || 0);
                    // Credit increases balance, Debit decreases it (as per app logic)
                    return t.type === 'CREDIT' ? sum + amount : sum - amount;
                }
                return sum;
            }, parseFloat(acc.initialBalance || 0)); // Start with initialBalance

            console.log(`  - Calculated Balance: ${balance} (Previous: ${acc.balance || 0})`);

            if (balance !== acc.balance) {
                await Account.findByIdAndUpdate(acc._id, { balance: balance });
                console.log(`  - ✅ Updated in database.`);
            } else {
                console.log(`  - ℹ️ Already in sync.`);
            }
        }

        console.log("\n✨ All account balances have been synchronized with the transaction history.");

    } catch (e) {
        console.error("❌ Error during synchronization:", e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

syncBalances();
