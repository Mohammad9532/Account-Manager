
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Transaction } from './lib/models/Transaction.js';

dotenv.config({ path: '.env' });

async function searchTxn() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri, { dbName: 'Mintmart' });

        console.log("Searching for amount 112...");
        const target = await Transaction.findOne({ amount: 112 });

        if (target) {
            console.log("FOUND!");
            console.log(JSON.stringify(target, null, 2));
        } else {
            console.log("NOT FOUND by amount. listing last 5...");
            const last5 = await Transaction.find().sort({ _id: -1 }).limit(5);
            console.log(JSON.stringify(last5, null, 2));
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

searchTxn();
