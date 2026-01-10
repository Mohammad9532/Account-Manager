import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Transaction } from './models/Transaction.js';

dotenv.config();

// Encode password special char (@ -> %40)
// IMPORTANT: Added /Mintmart before ? to specify database name
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://mohammadahmadsheikh580_db_user:Ahmad%40953263@mintmart.aj80l7d.mongodb.net/Mintmart?appName=Mintmart";

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Read JSON file
        // d:/Account Manager/daily_migration.json
        const jsonPath = path.resolve('d:/Account Manager/daily_migration.json');
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const transactions = JSON.parse(rawData);

        console.log(`Found ${transactions.length} transactions to seed.`);

        // cleanup existing daily transactions to avoid duplicates
        const deleteResult = await Transaction.deleteMany({ scope: 'daily' });
        console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing daily transactions.`);

        // Validate and add date objects
        const validTransactions = transactions.map(t => ({
            ...t,
            date: new Date(t.date),
            type: t.type === 'debit' ? 'Money Out' : 'Money In'
        }));

        // Perform Insertion
        const result = await Transaction.insertMany(validTransactions);
        console.log(`🎉 Successfully seeded ${result.length} daily expenses!`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
