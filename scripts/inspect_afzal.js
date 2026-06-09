import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TransactionSchema = new mongoose.Schema({}, { strict: false });
const AccountSchema = new mongoose.Schema({}, { strict: false });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);

async function inspectAfzal() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'Mintmart' });

    const afzalId = '6a209cc9bf27b50f3c242b00';
    const acc = await Account.findById(afzalId);
    console.log('Afzal Account:', acc);

    const txs = await Transaction.find({
        $or: [
            { accountId: afzalId },
            { linkedAccountId: afzalId }
        ]
    });

    console.log(`Found ${txs.length} transactions for Afzal:`);
    txs.forEach(t => {
        console.log(`Date: ${t.date?.toISOString()}, Type: ${t.type}, Category: ${t.category}, Amount: ${t.amount}, BalanceImpact: ${t.balanceImpact}, accountId: ${t.accountId}, linkedAccountId: ${t.linkedAccountId}, Desc: ${t.description}`);
    });

    await mongoose.disconnect();
}

inspectAfzal();
