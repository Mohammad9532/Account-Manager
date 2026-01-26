
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Transaction } from './lib/models/Transaction.js';

dotenv.config({ path: '.env' });

async function checkLastTransaction() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri, { dbName: 'Mintmart' }); // Added dbName

        const lastTxn = await Transaction.findOne().sort({ _id: -1 });
        console.log("Last Transaction Found:");
        console.log(JSON.stringify(lastTxn, null, 2));

        if (lastTxn) {
            console.log("Account ID:", lastTxn.accountId);
            console.log("Linked Account ID:", lastTxn.linkedAccountId);
            console.log("Type:", lastTxn.type);
            console.log("Amount:", lastTxn.amount);
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

checkLastTransaction();
