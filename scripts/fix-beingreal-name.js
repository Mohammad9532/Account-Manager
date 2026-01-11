
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

const TransactionSchema = new mongoose.Schema({}, { strict: false });
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function fixName() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the transactions with "Beingreal" (lowercase r)
        const result = await Transaction.updateMany(
            { description: 'Beingreal' },
            { $set: { description: 'BeingReal' } }
        );

        console.log(`Updated ${result.modifiedCount} transactions to 'BeingReal'`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixName();
