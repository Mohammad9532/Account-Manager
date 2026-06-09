import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TransactionSchema = new mongoose.Schema({}, { strict: false });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function inspectSpecificTxs() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'Mintmart' });

    const ids = [
        '6a213dd9d26d51ceeef7b93e',
        '6a213dfdd26d51ceeef7b953',
        '6a213e12d26d51ceeef7b960'
    ];

    const txs = await Transaction.find({ _id: { $in: ids } });
    console.log(JSON.stringify(txs, null, 2));

    await mongoose.disconnect();
}

inspectSpecificTxs();
