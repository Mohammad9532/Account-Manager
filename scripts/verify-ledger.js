import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verifyLedgerData() {
    try {
        const mintmartUri = MONGODB_URI.replace('.net/?', '.net/Mintmart?');
        await mongoose.connect(mintmartUri);
        console.log('✅ Connected to Mintmart database');

        const db = mongoose.connection.db;

        // Count total
        const total = await db.collection('transactions').countDocuments();
        console.log(`Total transactions in Mintmart: ${total}`);

        // Count manager scope
        const managerCount = await db.collection('transactions').countDocuments({ scope: 'manager' });
        console.log(`Transactions with scope "manager": ${managerCount}`);

        // Count where scope is missing (should default to manager)
        const missingScopeCount = await db.collection('transactions').countDocuments({ scope: { $exists: false } });
        console.log(`Transactions with missing scope: ${missingScopeCount}`);

        // Sample manager data
        if (managerCount > 0 || missingScopeCount > 0) {
            const query = managerCount > 0 ? { scope: 'manager' } : { scope: { $exists: false } };
            const sample = await db.collection('transactions').findOne(query);
            console.log(`Manager Sample:`, JSON.stringify(sample, null, 2));
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

verifyLedgerData();
