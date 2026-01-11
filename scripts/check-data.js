
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

async function checkData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Check Unique User IDs
        const distinctUsers = await Transaction.distinct('userId');
        console.log('Unique User IDs found:', distinctUsers);

        // 2. Check the restored transactions
        const restored = await Transaction.find({ description: 'Beingreal' }).sort({ _id: -1 }).limit(5);
        console.log('\nRestored "Beingreal" Transactions:');
        restored.forEach(t => {
            console.log(`ID: ${t._id}, UserID: ${t.userId}, Date: ${t.date}, Scope: ${t.scope}, Amount: ${t.amount}`);
        });

        // 3. Check some other recent transactions (to compare UserID)
        const recent = await Transaction.find({ description: { $ne: 'Beingreal' } }).sort({ $natural: -1 }).limit(3);
        console.log('\nOther Recent Transactions:');
        recent.forEach(t => {
            console.log(`ID: ${t._id}, UserID: ${t.userId}, Date: ${t.date}, Scope: ${t.scope}, Desc: ${t.description}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
