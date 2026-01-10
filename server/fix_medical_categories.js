import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Transaction } from './models/Transaction.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://mohammadahmadsheikh580_db_user:Ahmad%40953263@mintmart.aj80l7d.mongodb.net/Mintmart?appName=Mintmart";

const fixCategories = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Define regex for flexible matching (case-insensitive)
        const regex = /medicin|medical|pharmacy|doctor/i;

        // Find documents that match the criteria but are NOT already 'Medical Expense'
        const query = {
            $or: [
                { category: { $regex: regex } },
                { description: { $regex: regex } }
            ],
            category: { $ne: 'Medical Expense' }
        };

        const result = await Transaction.updateMany(query, {
            $set: { category: 'Medical Expense' }
        });

        console.log(`✨ Updated ${result.modifiedCount} transactions to "Medical Expense".`);
        console.log(`Matched count: ${result.matchedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating categories:', error);
        process.exit(1);
    }
};

fixCategories();
