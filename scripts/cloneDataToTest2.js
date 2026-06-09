import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function cloneDatabase() {
    const uri = process.env.MONGODB_URI;
    const sourceDbName = 'Mintmart';
    const targetDbName = 'Test2'; // Removed the space to avoid InvalidNamespace errors

    if (!uri) {
        console.error('MONGODB_URI is not defined in .env');
        return;
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas.');

        const sourceDb = client.db(sourceDbName);
        const targetDb = client.db(targetDbName);

        const collections = await sourceDb.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        console.log(`Cloning ${collectionNames.length} collections from "${sourceDbName}" to "${targetDbName}"...`);

        for (const name of collectionNames) {
            console.log(`- Cloning collection: ${name}`);

            // 1. Drop existing collection in target
            try {
                await targetDb.collection(name).drop();
                console.log(`  Dropped existing target collection: ${name}`);
            } catch (e) {
                // Ignore "ns not found" error
            }

            // 2. Fetch all from source
            const documents = await sourceDb.collection(name).find().toArray();

            if (documents.length > 0) {
                // 3. Insert into target
                const result = await targetDb.collection(name).insertMany(documents);
                console.log(`  Inserted ${result.insertedCount} documents.`);
            } else {
                console.log(`  Collection is empty, skipped insertion.`);
            }
        }

        console.log('--- Cloning Finished Successfully ---');
        console.log(`\x1b[32mTarget DB: "${targetDbName}" is now a fresh clone of "${sourceDbName}"\x1b[0m`);
    } catch (error) {
        console.error('Cloning failed:', error);
    } finally {
        await client.close();
    }
}

cloneDatabase();
