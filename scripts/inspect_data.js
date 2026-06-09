import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TransactionSchema = new mongoose.Schema({}, { strict: false });
const AccountSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function inspect() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'Mintmart' });
    console.log('Connected!');

    // Find User
    const user = await User.findOne({ email: 'beingsheikh7@gmail.com' });
    if (!user) {
        console.log('User not found!');
        // Let's list all users to see if we have a matching email/userId
        const allUsers = await User.find();
        console.log('All Users:', allUsers.map(u => ({ id: u._id, email: u.email, name: u.name })));
        await mongoose.disconnect();
        return;
    }
    console.log('Found User:', { id: user._id, email: user.email });

    const userId = user._id.toString();

    // Find accounts for this user
    const accounts = await Account.find({ userId });
    console.log('Accounts:');
    accounts.forEach(acc => {
        console.log(`- ${acc.name} (${acc.type}): ID=${acc._id}, Balance=${acc.balance}, InitialBalance=${acc.initialBalance}`);
    });

    const ccAccount = accounts.find(acc => acc.name.toLowerCase().includes('amazon pay'));
    if (!ccAccount) {
        console.log('No Amazon Pay Credit Card account found!');
        await mongoose.disconnect();
        return;
    }

    console.log('\n--- Amazon Pay Credit Card Details ---');
    console.log(JSON.stringify(ccAccount, null, 2));

    // Find transactions for this account or linked to this account
    const txs = await Transaction.find({
        $or: [
            { accountId: ccAccount._id },
            { linkedAccountId: ccAccount._id }
        ]
    }).sort({ date: -1 });

    console.log(`\nFound ${txs.length} transactions:`);
    txs.forEach(tx => {
        console.log(`[${tx.date?.toISOString()}] Type=${tx.type}, Category=${tx.category}, Amount=${tx.amount}, BalanceImpact=${tx.balanceImpact}, Desc="${tx.description}", accountId=${tx.accountId}, linkedAccountId=${tx.linkedAccountId}`);
    });

    await mongoose.disconnect();
}

inspect();
