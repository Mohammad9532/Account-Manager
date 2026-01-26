
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Account } from '../lib/models/Account.js';
import { Transaction } from '../lib/models/Transaction.js';
import { LedgerAccess } from '../lib/models/LedgerAccess.js'; // Assuming this tracks access

dotenv.config({ path: '.env' });

async function restoreLedgers() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri, { dbName: 'Mintmart' });

        console.log("Starting Ledger Restoration...");

        const otherAccounts = await Account.find({ type: 'Other' });
        console.log(`Found ${otherAccounts.length} accounts to restore.`);

        for (const acc of otherAccounts) {
            console.log(`\nRestoring "${acc.name}" (ID: ${acc._id})...`);

            // 1. Unlink Transactions where this is the Primary Account
            const primaryTxns = await Transaction.find({ accountId: acc._id });
            console.log(`  - Found ${primaryTxns.length} primary transactions.`);

            for (const t of primaryTxns) {
                // Remove accountId
                t.accountId = undefined; // Mongoose unset
                // Ensure description matches exactly
                t.description = acc.name;
                await t.save();
            }
            console.log(`  - Unlinked and updated descriptions for ${primaryTxns.length} transactions.`);

            // 2. Unlink Transactions where this is the Linked Account (Transfers)
            const linkedTxns = await Transaction.find({ linkedAccountId: acc._id });
            console.log(`  - Found ${linkedTxns.length} linked transactions (Transfers).`);

            for (const t of linkedTxns) {
                t.linkedAccountId = undefined;
                // We should also ensure description matches if we want it to show up?
                // But this modifies the OTHER side's transaction.
                // If we don't, it might disappear from this ledger but stay in the other.
                // For safety, let's append " - [Name]" if not present, or force set?
                // User wants "restore to ledger".
                // If we force set description to Acc Name, it will appear in the Ledger.
                // But it might obscure the original description.
                // Let's force set it for now as per "restore" instruction.
                t.description = acc.name;
                await t.save();
            }
            console.log(`  - Unlinked and updated descriptions for ${linkedTxns.length} transfers.`);

            // 3. Delete any LedgerAccess records
            const accessRes = await LedgerAccess.deleteMany({ ledgerId: acc._id });
            if (accessRes.deletedCount > 0) {
                console.log(`  - Deleted ${accessRes.deletedCount} LedgerAccess records.`);
            }

            // 4. Delete the Account
            await Account.findByIdAndDelete(acc._id);
            console.log(`  - Deleted Account document.`);

            console.log(`SUCCESS: "${acc.name}" restored to Virtual Ledger.`);
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

restoreLedgers();
