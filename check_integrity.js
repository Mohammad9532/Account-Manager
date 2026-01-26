
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Transaction } from './lib/models/Transaction.js';
import { Account } from './lib/models/Account.js';

dotenv.config({ path: '.env' });

async function checkConsistency() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri, { dbName: 'Mintmart' });

        const accounts = await Account.find({});

        console.log("Checking Consistency...");
        console.log("----------------------------------------------------------------");
        console.log("Name".padEnd(20) + " | " + "Stored".padEnd(10) + " | " + "Calc".padEnd(10) + " | Diff");
        console.log("----------------------------------------------------------------");

        for (const acc of accounts) {
            const txns = await Transaction.find({
                $or: [{ accountId: acc._id }, { linkedAccountId: acc._id }]
            });

            let calculatedBalance = acc.initialBalance || 0;

            for (const t of txns) {
                const amount = parseFloat(t.amount) || 0;

                if (String(t.accountId) === String(acc._id)) {
                    // Primary
                    const isCredit = t.type === 'Money In' || t.type === 'Credit' || t.type === 'Payment Received';
                    // Note: 'Payment Received' is category, type usually 'Money In'
                    // Check standard types
                    const isPlus = t.type === 'Money In';
                    calculatedBalance += isPlus ? amount : -amount;
                }

                if (String(t.linkedAccountId) === String(acc._id)) {
                    // Linked (Target of Transfer)
                    // If Source was 'Money Out' (Debit), Target is Credit (Plus)
                    // If Source was 'Money In' (Credit), Target is Debit (Minus)? (Refund?)

                    // Logic used in route:
                    // Source (Debit): change = -amount.
                    // Linked: $inc: -change = --amount = +amount.
                    // So if Source is Debit, Linked is Credit.

                    const isSourceCredit = t.type === 'Money In';
                    // linkChange = -(sourceChange)
                    // sourceChange = isSourceCredit ? amount : -amount
                    // linkChange = isSourceCredit ? -amount : amount

                    calculatedBalance += (isSourceCredit ? -amount : amount);
                }
            }

            const stored = acc.balance || 0;
            const diff = stored - calculatedBalance;
            const isMismatch = Math.abs(diff) > 0.1;

            const name = (acc.name || 'Unknown').substring(0, 19);

            console.log(
                name.padEnd(20) + " | " +
                stored.toFixed(2).padEnd(10) + " | " +
                calculatedBalance.toFixed(2).padEnd(10) + " | " +
                (isMismatch ? "MISMATCH" : "OK")
            );
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

checkConsistency();
