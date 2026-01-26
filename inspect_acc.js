
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Account } from './lib/models/Account.js';

dotenv.config({ path: '.env' });

async function checkAccounts() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri, { dbName: 'Mintmart' });

        const ids = ['696506a6163211546233bad3', '696a8447025cd5626d4f4bb7'];
        const accounts = await Account.find({ _id: { $in: ids } });

        accounts.forEach(a => {
            console.log(`ID: ${a._id}, Name: ${a.name}, Type: ${a.type}`);
        });

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

checkAccounts();
