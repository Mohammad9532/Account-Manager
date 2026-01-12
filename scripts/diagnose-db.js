
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

const TransactionSchema = new mongoose.Schema({
    scope: { type: String, default: 'manager' },
    date: Date
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function diagnose() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const total = await Transaction.countDocuments();
        console.log(`Total Documents in Transaction collection: ${total}`);

        const distinctScopes = await Transaction.distinct('scope');
        console.log('Distinct Scopes found:', distinctScopes);

        const countByScope = await Transaction.aggregate([
            { $group: { _id: "$scope", count: { $sum: 1 } } }
        ]);
        console.log('Count by Scope:', countByScope);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
