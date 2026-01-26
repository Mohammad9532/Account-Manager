
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function checkCollections() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to:", mongoose.connection.name);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        if (collections.find(c => c.name === 'transactions')) {
            const count = await mongoose.connection.db.collection('transactions').countDocuments();
            console.log("Transaction Count:", count);

            // Raw Find
            const last = await mongoose.connection.db.collection('transactions').find().sort({ _id: -1 }).limit(1).toArray();
            console.log("Raw Last Txn:", last);
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

checkCollections();
