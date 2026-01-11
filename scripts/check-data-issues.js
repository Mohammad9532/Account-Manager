import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDataIssues() {
    try {
        const mintmartUri = MONGODB_URI.replace('.net/?', '.net/Mintmart?');
        await mongoose.connect(mintmartUri);
        console.log('✅ Connected to Mintmart database');

        const db = mongoose.connection.db;

        const problemTxns = await db.collection('transactions').find({
            scope: 'manager',
            $or: [
                { description: { $exists: false } },
                { description: null },
                { description: "" }
            ]
        }).toArray();

        console.log(`Found ${problemTxns.length} manager transactions with missing or empty descriptions.`);

        if (problemTxns.length > 0) {
            console.log('Problem Samples:', JSON.stringify(problemTxns.slice(0, 3), null, 2));
        }

        const totalManager = await db.collection('transactions').countDocuments({ scope: 'manager' });
        console.log(`Total manager transactions: ${totalManager}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkDataIssues();
