import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function analyzeRafey() {
    try {
        const mintmartUri = MONGODB_URI.replace('.net/?', '.net/Mintmart?');
        await mongoose.connect(mintmartUri);

        const db = mongoose.connection.db;
        const transactions = await db.collection('transactions').find({
            description: { $regex: /Rafey/i },
            scope: 'manager'
        }).toArray();

        console.log(`Analysis for "Rafey":`);
        console.log(`Total records: ${transactions.length}`);

        const summary = transactions.reduce((acc, t) => {
            const type = t.type;
            const amount = parseFloat(t.amount);
            if (!acc[type]) acc[type] = 0;
            acc[type] += amount;

            const name = t.description;
            if (!acc.names[name]) acc.names[name] = 0;
            acc.names[name]++;

            return acc;
        }, { names: {} });

        console.log('Totals by Type:', JSON.stringify(summary, (k, v) => k === 'names' ? undefined : v, 2));
        console.log('Variations in Names:', JSON.stringify(summary.names, null, 2));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

analyzeRafey();
