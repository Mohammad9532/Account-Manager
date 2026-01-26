
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Transaction } from './lib/models/Transaction.js';
import { Account } from './lib/models/Account.js';

dotenv.config({ path: '.env' });

async function repairBalances() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri, { dbName: 'Mintmart' });

        const accounts = await Account.find({}); // Get All Accounts

        console.log("Repairing Balances...");

        for (const acc of accounts) {
            const txns = await Transaction.find({
                $or: [{ accountId: acc._id }, { linkedAccountId: acc._id }]
            });

            let calculatedBalance = acc.initialBalance || 0;

            for (const t of txns) {
                const amount = parseFloat(t.amount) || 0;

                if (String(t.accountId) === String(acc._id)) {
                    // Primary
                    const isPlus = t.type === 'Money In';
                    calculatedBalance += isPlus ? amount : -amount;
                }

                if (String(t.linkedAccountId) === String(acc._id)) {
                    // Linked
                    const isSourceCredit = t.type === 'Money In';
                    calculatedBalance += (isSourceCredit ? -amount : amount);
                }
            }

            // Validate limits for Credit Card = Negative Balance usually?
            // Just trust calculation.

            if (acc.balance !== calculatedBalance) {
                console.log(`Fixing ${acc.name}: ${acc.balance} -> ${calculatedBalance}`);
                await Account.findByIdAndUpdate(acc._id, { balance: calculatedBalance });
            }
        }
        console.log("Repair Complete.");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

repairBalances();
