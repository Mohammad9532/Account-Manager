import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Transaction } from './models/Transaction.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://mohammadahmadsheikh580_db_user:Ahmad%40953263@mintmart.aj80l7d.mongodb.net/Mintmart?appName=Mintmart";

const clearData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check for command line arguments
        const arg = process.argv[2];

        if (arg === 'ledger') {
            console.log('🗑️ Clearing Ledger Data (scope: manager)...');
            const result = await Transaction.deleteMany({ scope: 'manager' });
            console.log(`✅ Deleted ${result.deletedCount} ledger transactions.`);
        } else if (arg === 'daily') {
            console.log('🗑️ Clearing Daily Expenses (scope: daily)...');
            const result = await Transaction.deleteMany({ scope: 'daily' });
            console.log(`✅ Deleted ${result.deletedCount} daily transactions.`);
        } else if (arg === 'all') {
            console.log('⚠️⚠️⚠️ CLEARING ALL TRANSACTIONS... ⚠️⚠️⚠️');
            const result = await Transaction.deleteMany({});
            console.log(`✅ Deleted ${result.deletedCount} total transactions.`);
        } else {
            console.log('❓ Please specify what to clear: node server/clear_data.js [ledger|daily|all]');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        process.exit(1);
    }
};

clearData();
