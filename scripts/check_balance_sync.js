import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TransactionSchema = new mongoose.Schema({}, { strict: false });
const AccountSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkSync() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'Mintmart' });

    const user = await User.findOne({ email: 'beingsheikh7@gmail.com' });
    const userId = user._id.toString();

    const accounts = await Account.find({ userId });
    const ccAccount = accounts.find(acc => acc.name.toLowerCase().includes('amazon pay'));

    if (!ccAccount) {
        console.log('Account not found');
        await mongoose.disconnect();
        return;
    }

    const ccIdObj = ccAccount._id;
    const ccIdStr = ccAccount._id.toString();

    // Find all transactions matching userId to be 100% sure we see everything
    const allUserTxs = await Transaction.find({ userId }).sort({ date: -1 });

    console.log(`Total transactions for user: ${allUserTxs.length}`);

    let computedBalance = ccAccount.initialBalance || 0;
    const internalTypes = ['Bank', 'Cash', 'Credit Card'];
    const isInternal = (type) => internalTypes.includes(type);

    let matchCount = 0;
    for (const tx of allUserTxs) {
        const txAccId = tx.accountId ? tx.accountId.toString() : '';
        const txLinkedAccId = tx.linkedAccountId ? tx.linkedAccountId.toString() : '';

        const isPrimary = (txAccId === ccIdStr);
        const isLinked = (txLinkedAccId === ccIdStr);

        if (isPrimary || isLinked) {
            matchCount++;
            let impact = 0;
            if (isPrimary) {
                impact = tx.balanceImpact || 0;
                computedBalance += impact;
                console.log(`[Primary] Date: ${tx.date?.toISOString().substring(0,10)}, Type: ${tx.type}, Category: ${tx.category}, Amt: ${tx.amount}, Impact: ${impact}, Desc: ${tx.description}, txId: ${tx._id}`);
            } else {
                const primaryAcc = accounts.find(a => String(a._id) === txAccId);
                const primaryType = primaryAcc ? primaryAcc.type : 'Other';
                const isInternalTransfer = isInternal(primaryType) && isInternal(ccAccount.type);

                const baseImpact = tx.balanceImpact || 0;
                impact = isInternalTransfer ? -baseImpact : baseImpact;
                computedBalance += impact;
                console.log(`[Linked]  Date: ${tx.date?.toISOString().substring(0,10)}, Type: ${tx.type}, Category: ${tx.category}, Amt: ${tx.amount}, BaseImpact: ${baseImpact}, LinkedImpact: ${impact}, PrimaryType: ${primaryType}, Desc: ${tx.description}, txId: ${tx._id}`);
            }
        }
    }

    console.log(`\nMatched transactions: ${matchCount}`);
    console.log(`Computed Balance: ${computedBalance}`);
    console.log(`Stored Balance: ${ccAccount.balance}`);
    console.log(`Difference (Stored - Computed): ${ccAccount.balance - computedBalance}`);

    await mongoose.disconnect();
}

checkSync();
