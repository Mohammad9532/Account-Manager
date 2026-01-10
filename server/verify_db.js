import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Transaction } from './models/Transaction.js';

dotenv.config();

// Encode password special char (@ -> %40)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://mohammadahmadsheikh580_db_user:Ahmad%40953263@mintmart.aj80l7d.mongodb.net/?appName=Mintmart";

const verifyData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const count = await Transaction.countDocuments();
        console.log(`Total Transactions: ${count}`);

        const dailyCount = await Transaction.countDocuments({ scope: 'daily' });
        console.log(`Daily Scope Transactions: ${dailyCount}`);

        const sample = await Transaction.findOne({ scope: 'daily' });
        console.log('Sample Daily Transaction:', sample);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

verifyData();
