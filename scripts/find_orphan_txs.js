import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TransactionSchema = new mongoose.Schema({}, { strict: false });
const AccountSchema = new mongoose.Schema({}, { strict: false });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);

async function findOrphanTxs() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'Mintmart' });

    const cardIdStr = '697856b543ed2113b553c9cd';
    
    // Search by string representation and object id representation
    const txs = await Transaction.find({
        $or: [
            { accountId: cardIdStr },
            { linkedAccountId: cardIdStr },
            { accountId: new mongoose.Types.ObjectId(cardIdStr) },
            { linkedAccountId: new mongoose.Types.ObjectId(cardIdStr) }
        ]
    });

    console.log(`Found ${txs.length} transactions referencing card ID ${cardIdStr} in total.`);
    
    // Print userIds
    const userIds = new Set(txs.map(tx => tx.userId));
    console.log('User IDs in these transactions:', Array.from(userIds));

    await mongoose.disconnect();
}

findOrphanTxs();
