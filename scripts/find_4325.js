import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TransactionSchema = new mongoose.Schema({}, { strict: false });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function find4325() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'Mintmart' });

    const txs = await Transaction.find({ amount: 4325 });
    console.log(`Found ${txs.length} transactions with amount 4325:`);
    console.log(JSON.stringify(txs, null, 2));

    await mongoose.disconnect();
}

find4325();
