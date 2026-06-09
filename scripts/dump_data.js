import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema({}, { strict: false });
const AccountSchema = new mongoose.Schema({}, { strict: false });
const TransactionSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');
const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema, 'accounts');
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema, 'transactions');

async function main() {
    console.log("Connecting to MongoDB (Test2)...");
    await mongoose.connect(MONGODB_URI, { dbName: 'Test2' });
    console.log("Connected.");

    const user = await User.findOne({ email: 'beingsheikh7@gmail.com' });
    if (!user) {
        console.log("User not found!");
        return;
    }
    const userIdStr = user._id.toString();
    console.log("User ID String:", userIdStr);

    const accounts = await Account.find({ userId: userIdStr });
    console.log("\n=== ACCOUNTS ===");
    for (const acc of accounts) {
        console.log({
            id: acc._id.toString(),
            name: acc.name,
            type: acc.type,
            initialBalance: acc.initialBalance,
            balance: acc.balance,
            creditLimit: acc.creditLimit,
            billDay: acc.billDay,
            dueDay: acc.dueDay,
            linkedAccountId: acc.linkedAccountId ? acc.linkedAccountId.toString() : null
        });
    }

    const apCard = accounts.find(a => a.name === 'Amazon Pay');
    if (apCard) {
        const txs = await Transaction.find({
            $or: [
                { accountId: apCard._id },
                { linkedAccountId: apCard._id },
                { accountId: apCard._id.toString() },
                { linkedAccountId: apCard._id.toString() }
            ]
        }).sort({ date: -1 });

        console.log("\n=== AMAZON PAY TRANSACTIONS ===");
        for (const tx of txs) {
            console.log({
                id: tx._id.toString(),
                date: tx.date,
                type: tx.type,
                amount: tx.amount,
                category: tx.category,
                description: tx.description,
                accountId: tx.accountId ? tx.accountId.toString() : null,
                linkedAccountId: tx.linkedAccountId ? tx.linkedAccountId.toString() : null,
                balanceImpact: tx.balanceImpact
            });
        }
    }

    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
