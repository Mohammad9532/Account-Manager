
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Dynamic schema access or generic
dotenv.config({ path: '.env' });

async function searchDaily() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri, { dbName: 'Mintmart' });

        const collection = mongoose.connection.db.collection('dailyexpenses');
        const recent = await collection.find({ date: { $gte: new Date(Date.now() - 86400000) } }).toArray();

        console.log("Recent Daily Expenses:", JSON.stringify(recent, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

searchDaily();
