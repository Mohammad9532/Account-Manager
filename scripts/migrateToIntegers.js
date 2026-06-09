import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Account } from '../lib/models/Account.js';
import { Transaction } from '../lib/models/Transaction.js';
import { DailyExpense } from '../lib/models/DailyExpense.js';
import { CurrencyCustomer } from '../lib/models/CurrencyCustomer.js';
import { CurrencyDealer } from '../lib/models/CurrencyDealer.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing in .env');
    process.exit(1);
}

async function migrate() {
    console.log("🚀 Starting Precision Migration: Float -> Integer (cents/paise)");

    await mongoose.connect(MONGODB_URI, { dbName: 'Mintmart' });
    console.log("✅ Connected to MongoDB");

    const session = await mongoose.startSession();

    try {
        // 1. Snapshot Pre-Migration Balances
        const allAccounts = await Account.find({});
        const allTxns = await Transaction.find({});
        const allDailies = await DailyExpense.find({});
        const allCustomers = await CurrencyCustomer.find({});
        const allDealers = await CurrencyDealer.find({});

        const sumAccountsBefore = allAccounts.reduce((acc, a) => acc + (a.balance || 0), 0);
        const sumTxnsBefore = allTxns.reduce((acc, t) => acc + (t.amount || 0), 0);

        console.log(`📊 Pre-Migration Snapshot:`);
        console.log(`   Total Account Balances: ${sumAccountsBefore}`);
        console.log(`   Total Transaction Sum:  ${sumTxnsBefore}`);

        await session.withTransaction(async () => {
            console.log("🛠️  Migrating Accounts...");
            for (const acc of allAccounts) {
                const update = {
                    balance: Math.round((acc.balance || 0) * 100),
                    initialBalance: Math.round((acc.initialBalance || 0) * 100),
                    creditLimit: Math.round((acc.creditLimit || 0) * 100),
                    emis: (acc.emis || []).map(e => ({
                        ...e,
                        totalAmount: Math.round((e.totalAmount || 0) * 100),
                        remainingAmount: Math.round((e.remainingAmount || 0) * 100),
                        monthlyPayment: Math.round((e.monthlyPayment || 0) * 100)
                    }))
                };
                await Account.updateOne({ _id: acc._id }, { $set: update }, { session });
            }

            console.log("🛠️  Migrating Transactions...");
            for (const t of allTxns) {
                await Transaction.updateOne({ _id: t._id }, {
                    $set: {
                        amount: Math.round((t.amount || 0) * 100),
                        balanceImpact: Math.round((t.balanceImpact || 0) * 100)
                    }
                }, { session });
            }

            console.log("🛠️  Migrating Daily Expenses...");
            for (const d of allDailies) {
                await DailyExpense.updateOne({ _id: d._id }, {
                    $set: {
                        amount: Math.round((d.amount || 0) * 100),
                        balanceImpact: Math.round((d.balanceImpact || 0) * 100)
                    }
                }, { session });
            }

            console.log("🛠️  Migrating Currency Customers...");
            for (const c of allCustomers) {
                const updatedTxns = (c.transactions || []).map(t => ({
                    ...t,
                    foreignAmount: Math.round((t.foreignAmount || 0) * 100), // Assuming FC also cents
                    localAmount: Math.round((t.localAmount || 0) * 100)
                }));
                await CurrencyCustomer.updateOne({ _id: c._id }, { $set: { transactions: updatedTxns } }, { session });
            }

            console.log("🛠️  Migrating Currency Dealers...");
            for (const d of allDealers) {
                const updatedTxns = (d.transactions || []).map(t => ({
                    ...t,
                    foreignAmount: Math.round((t.foreignAmount || 0) * 100),
                    localAmount: Math.round((t.localAmount || 0) * 100)
                }));
                await CurrencyDealer.updateOne({ _id: d._id }, { $set: { transactions: updatedTxns } }, { session });
            }
        });

        // 2. Verification
        console.log("🔍 Verifying Integrity...");
        const accountsAfter = await Account.find({});
        const txnsAfter = await Transaction.find({});

        const sumAccountsAfter = accountsAfter.reduce((acc, a) => acc + (a.balance || 0), 0);
        const sumTxnsAfter = txnsAfter.reduce((acc, t) => acc + (t.amount || 0), 0);

        const expectedAccountSum = Math.round(sumAccountsBefore * 100);
        const expectedTxnSum = Math.round(sumTxnsBefore * 100);

        const accountDrift = Math.abs(sumAccountsAfter - expectedAccountSum);
        const txnDrift = Math.abs(sumTxnsAfter - expectedTxnSum);

        console.log(`📊 Post-Migration Totals:`);
        console.log(`   Account Sum: ${sumAccountsAfter} (Expected: ${expectedAccountSum})`);
        console.log(`   Txn Sum:     ${sumTxnsAfter} (Expected: ${expectedTxnSum})`);

        if (accountDrift > 0 || txnDrift > 0) {
            console.error("❌ CRITICAL ERROR: Data drift detected during migration!");
            console.error(`   Account Drift: ${accountDrift} units`);
            console.error(`   Txn Drift:     ${txnDrift} units`);
            console.error("   The changes were committed but the state is inconsistent. Please review immediately.");
            // In a real scenario, we might want to manually revert if drift is non-zero, 
            // but with Math.round and integer sum, it should be exact.
        } else {
            console.log("✨ SUCCESS: Migration completed with zero drift.");
        }

    } catch (error) {
        console.error("💥 MIGRATION FAILED:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrate();
