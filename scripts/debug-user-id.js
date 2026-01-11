
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Transaction } from '../lib/models/Transaction.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkData() {
    try {
        await mongoose.connect(MONGODB_URI);

        // Test exact query
        const targetId = '69636a780ab77994c5f5747d';
        console.log(`Querying for userId: "${targetId}"`);

        const count = await Transaction.countDocuments({ userId: targetId });
        console.log(`Found ${count} documents matching userId.`);

        const tx = await Transaction.findOne({ userId: targetId });
        if (tx) {
            console.log('Sample matched transaction:', tx._id);
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkData();
