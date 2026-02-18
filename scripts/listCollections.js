import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function listCollections() {
    try {
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

        const conn = await mongoose.connect(process.env.MONGODB_URI, { dbName: 'Mintmart' });
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in Mintmart:', collections.map(c => c.name));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

listCollections();
