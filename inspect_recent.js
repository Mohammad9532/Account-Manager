
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Transaction } from './lib/models/Transaction.js';
import { Account } from './lib/models/Account.js';

dotenv.config({ path: '.env' });

async function inspectRecent() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri, { dbName: 'Mintmart' });

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        console.log("Searching for transactions since:", oneHourAgo);

        // Find standard transactions
        const recent = await Transaction.find({ date: { $gte: oneHourAgo } });
        console.log(`Found ${recent.length} recent transactions.`);
        if (recent.length > 0) {
            console.log(JSON.stringify(recent, null, 2));
        } else {
            // Fallback: Just get last 3 by _id
            const last3 = await Transaction.find().sort({ _id: -1 }).limit(3);
            console.log("Last 3 by ID:", JSON.stringify(last3, null, 2));
        }

        // Check Account Balance
        const accounts = await Account.find({ name: /ICICI/i });
        console.log("ICICI Accounts:", accounts.map(a => ({
            name: a.name,
            id: a._id,
            balance: a.balance,
            available: a.availableCredit
        })));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

inspectRecent();
