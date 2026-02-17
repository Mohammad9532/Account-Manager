import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// This script rolls back the integer migration by dividing all relevant fields by 100.
// USE WITH CAUTION. This will reintroduce floating point precision issues.

async function rollback() {
    console.log("🚀 Starting Precision Rollback: Integer (cents) -> Float");

    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI not found in environment.");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: 'Mintmart' });
        console.log("✅ Connected to MongoDB (Mintmart)");

        const session = await mongoose.startSession();

        // Define schemas inline to avoid import issues
        const Account = mongoose.models.Account || mongoose.model('Account', new mongoose.Schema({}, { strict: false }));
        const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
        const DailyExpense = mongoose.models.DailyExpense || mongoose.model('DailyExpense', new mongoose.Schema({}, { strict: false }));
        const CurrencyCustomer = mongoose.models.CurrencyCustomer || mongoose.model('CurrencyCustomer', new mongoose.Schema({}, { strict: false }));
        const CurrencyDealer = mongoose.models.CurrencyDealer || mongoose.model('CurrencyDealer', new mongoose.Schema({}, { strict: false }));

        console.log("📊 Pre-Rollback Snapshot:");
        const totalBal = await Account.aggregate([{ $group: { _id: null, sum: { $sum: "$balance" } } }]);
        console.log(`   Total Cents in Accounts: ${totalBal[0]?.sum || 0}`);

        await session.withTransaction(async () => {
            console.log("🛠️  Rolling back Accounts...");
            const accounts = await Account.find({}).session(session);
            for (const acc of accounts) {
                const update = {
                    balance: (acc.balance || 0) / 100,
                    initialBalance: (acc.initialBalance || 0) / 100,
                    creditLimit: (acc.creditLimit || 0) / 100
                };
                if (acc.emis && acc.emis.length > 0) {
                    update.emis = acc.emis.map(e => ({
                        ...e,
                        totalAmount: (e.totalAmount || 0) / 100,
                        remainingAmount: (e.remainingAmount || 0) / 100,
                        monthlyPayment: (e.monthlyPayment || 0) / 100
                    }));
                }
                await Account.updateOne({ _id: acc._id }, { $set: update }, { session });
            }

            console.log("🛠️  Rolling back Transactions...");
            const txns = await Transaction.find({}).session(session);
            for (const t of txns) {
                await Transaction.updateOne({ _id: t._id }, {
                    $set: {
                        amount: (t.amount || 0) / 100,
                        balanceImpact: (t.balanceImpact || 0) / 100
                    }
                }, { session });
            }

            console.log("🛠️  Rolling back Daily Expenses...");
            const expenses = await DailyExpense.find({}).session(session);
            for (const e of expenses) {
                await DailyExpense.updateOne({ _id: e._id }, { $set: { amount: (e.amount || 0) / 100 } }, { session });
            }

            console.log("🛠️  Rolling back Currency Data...");
            const customers = await CurrencyCustomer.find({}).session(session);
            for (const c of customers) {
                await CurrencyCustomer.updateOne({ _id: c._id }, {
                    $set: {
                        totalIn: (c.totalIn || 0) / 100,
                        totalOut: (c.totalOut || 0) / 100,
                        balance: (c.balance || 0) / 100
                    }
                }, { session });
            }

            const dealers = await CurrencyDealer.find({}).session(session);
            for (const d of dealers) {
                await CurrencyDealer.updateOne({ _id: d._id }, {
                    $set: {
                        totalIn: (d.totalIn || 0) / 100,
                        totalOut: (d.totalOut || 0) / 100,
                        balance: (d.balance || 0) / 100
                    }
                }, { session });
            }
        });

        console.log("📊 Post-Rollback Verification:");
        const postTotalBal = await Account.aggregate([{ $group: { _id: null, sum: { $sum: "$balance" } } }]);
        console.log(`   Total Float Balance: ${postTotalBal[0]?.sum || 0}`);

        console.log("✨ SUCCESS: Rollback completed.");
    } catch (error) {
        console.error("❌ ERROR during rollback:", error);
    } finally {
        await mongoose.connection.close();
    }
}

rollback();
