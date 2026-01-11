
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

async function checkManagerData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check manager transactions
        const managerTxns = await Transaction.find({ scope: 'manager' }).sort({ _id: -1 }).limit(20);
        console.log('\nRecent Manager Transactions:');
        managerTxns.forEach(t => {
            console.log(`Desc: "${t.description}", Cat: "${t.category}", Date: ${t.date}, Amount: ${t.amount}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkManagerData();
