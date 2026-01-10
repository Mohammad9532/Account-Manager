import mongoose from 'mongoose';
import { Transaction } from './models/Transaction.js';

const user = 'mohammadahmadsheikh580_db_user';
const pass = encodeURIComponent('Ahmad@953263');
const host = 'mintmart.aj80l7d.mongodb.net';
const dbName = 'Mintmart';

const uri = `mongodb+srv://${user}:${pass}@${host}/${dbName}?retryWrites=true&w=majority&appName=Mintmart`;

async function checkData() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const transactions = await Transaction.find({ description: /Rafey/i }).limit(5);
        console.log(`Found ${transactions.length} sample transactions for Rafey.`);
        if (transactions.length > 0) {
            console.log(JSON.stringify(transactions, null, 2));
        }

        const total = await Transaction.countDocuments({ description: /Rafey/i });
        console.log(`Total Rafey transactions: ${total}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

checkData();
