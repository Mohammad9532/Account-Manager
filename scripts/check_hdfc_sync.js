import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TransactionSchema = new mongoose.Schema({}, { strict: false });
const AccountSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkHDFCSync() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'Mintmart' });

    const user = await User.findOne({ email: 'beingsheikh7@gmail.com' });
    const userId = user._id.toString();

    const accounts = await Account.find({ userId });
    const hdfc = accounts.find(acc => acc.name.toLowerCase().includes('hdfc') && acc.type === 'Bank');

    if (!hdfc) {
        console.log('HDFC Bank account not found');
        await mongoose.disconnect();
        return;
    }

    const hdfcId = hdfc._id;
    const txs = await Transaction.find({
        $or: [
            { accountId: hdfcId },
            { linkedAccountId: hdfcId }
        ]
    });

    console.log(`Found ${txs.length} transactions for HDFC Bank:`);
    let computedBalance = hdfc.initialBalance || 0;

    const hdfcIdStr = hdfcId.toString();

    for (const t of txs) {
        const tAccId = t.accountId ? t.accountId.toString() : '';
        const tLinkedId = t.linkedAccountId ? t.linkedAccountId.toString() : '';

        const isPrimary = (tAccId === hdfcIdStr);
        const isLinked = (tLinkedId === hdfcIdStr);

        let impact = 0;
        if (isPrimary) {
            impact = t.balanceImpact || 0;
            computedBalance += impact;
            console.log(`[Primary] Date: ${t.date?.toISOString().substring(0,10)}, Type: ${t.type}, Category: ${t.category}, Amt: ${t.amount}, Impact: ${impact}, Desc: ${t.description}`);
        } else {
            // Find primary account type
            const prim = accounts.find(a => String(a._id) === tAccId);
            const primType = prim ? prim.type : 'Other';
            const internalTypes = ['Bank', 'Cash', 'Credit Card'];
            const isInternal = internalTypes.includes(primType) && internalTypes.includes(hdfc.type);

            const baseImpact = t.balanceImpact || 0;
            impact = isInternal ? -baseImpact : baseImpact;
            computedBalance += impact;
            console.log(`[Linked]  Date: ${t.date?.toISOString().substring(0,10)}, Type: ${t.type}, Category: ${t.category}, Amt: ${t.amount}, BaseImpact: ${baseImpact}, LinkedImpact: ${impact}, PrimaryType: ${primType}, Desc: ${t.description}`);
        }
    }

    console.log(`\nComputed Balance: ${computedBalance}`);
    console.log(`Stored Balance: ${hdfc.balance}`);
    console.log(`Difference (Stored - Computed): ${hdfc.balance - computedBalance}`);

    await mongoose.disconnect();
}

checkHDFCSync();
