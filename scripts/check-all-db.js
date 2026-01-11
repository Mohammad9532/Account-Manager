import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkAllDatabases() {
    try {
        const client = await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const admin = mongoose.connection.db.admin();
        const { databases } = await admin.listDatabases();

        console.log('Databases available:');
        for (const dbInfo of databases) {
            console.log(`- ${dbInfo.name}`);
            const db = client.connection.useDb(dbInfo.name).db;
            const collections = await db.listCollections().toArray();
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`  * ${col.name}: ${count} documents`);
                if (count > 0 && col.name !== 'transactions') {
                    const sample = await db.collection(col.name).findOne();
                    console.log(`    Sample:`, JSON.stringify(sample, null, 2));
                }
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAllDatabases();
