
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Account } from '../lib/models/Account.js';
import { Transaction } from '../lib/models/Transaction.js';

dotenv.config({ path: '.env' });

async function checkIntegrity() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri, { dbName: 'Mintmart' });

        console.log("Checking integrity for restoration...");

        const otherAccounts = await Account.find({ type: 'Other' });

        for (const acc of otherAccounts) {
            console.log(`\nAccount: "${acc.name}" (ID: ${acc._id})`);
            const txns = await Transaction.find({ accountId: acc._id });

            let matchCount = 0;
            let mismatchCount = 0;
            const mismatches = [];

            for (const t of txns) {
                const desc = (t.description || '').trim().toLowerCase();
                const accName = (acc.name || '').trim().toLowerCase();

                if (desc === accName) {
                    matchCount++;
                } else {
                    mismatchCount++;
                    if (mismatches.length < 5) mismatches.push(t.description);
                }
            }

            console.log(`  Total Txns: ${txns.length}`);
            console.log(`  Matches: ${matchCount}`);
            console.log(`  Mismatches: ${mismatchCount}`);
            if (mismatchCount > 0) {
                console.log(`  Sample Mismatches: ${JSON.stringify(mismatches)}`);
                console.log(`  WARNING: These ${mismatchCount} transactions will disappear from the Ledger View if unlinked without updating description!`);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

checkIntegrity();
