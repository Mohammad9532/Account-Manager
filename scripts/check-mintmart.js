import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// The user provided URI without db name, it defaults to 'test'
const MONGODB_URI = process.env.MONGODB_URI;

async function checkMintmart() {
    try {
        // Try connecting explicitly to Mintmart
        const mintmartUri = MONGODB_URI.replace('.net/?', '.net/Mintmart?');
        console.log('Connecting to:', mintmartUri);

        await mongoose.connect(mintmartUri);
        console.log('✅ Connected to Mintmart database');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log('Collections in Mintmart:');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);

            if (count > 0) {
                const sample = await db.collection(col.name).findOne();
                console.log(`  Sample:`, JSON.stringify(sample, null, 2));
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkMintmart();
