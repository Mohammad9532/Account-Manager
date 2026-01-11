
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../lib/models/User.js';
import { Transaction } from '../lib/models/Transaction.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

const TARGET_EMAIL = 'mohammadahmadsheikh580@gmail.com';

async function assignData() {
    try {
        console.log('Connecting to MongoDB (Mintmart)...');
        await mongoose.connect(MONGODB_URI, { dbName: 'Mintmart' });
        console.log('Connected to Mintmart.');

        const user = await User.findOne({ email: TARGET_EMAIL });

        if (!user) {
            console.error(`User with email ${TARGET_EMAIL} not found.`);
            process.exit(1);
        }

        console.log(`Found User: ${user.name} (${user._id})`);

        // Update Transactions
        console.log('Updating Transactions...');
        const result = await Transaction.updateMany(
            {}, // Match ALL documents
            { $set: { userId: user._id } }
        );

        console.log(`Successfully updated ${result.modifiedCount} transactions to be owned by ${user.email}.`);
        console.log(`Matched: ${result.matchedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Error migrating data:', error);
        process.exit(1);
    }
}

assignData();
