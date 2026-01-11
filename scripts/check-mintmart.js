
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Transaction } from '../lib/models/Transaction.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkMintmart() {
    try {
        // Explicitly connect to Mintmart
        await mongoose.connect(MONGODB_URI, { dbName: 'Mintmart' });

        console.log('Connected to Mintmart DB.');

        const count = await Transaction.countDocuments({});
        console.log(`Total Transactions in Mintmart: ${count}`);

        const targetId = '69636a780ab77994c5f5747d';
        const userCount = await Transaction.countDocuments({ userId: targetId });
        console.log(`Transactions for user ${targetId} in Mintmart: ${userCount}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkMintmart();
