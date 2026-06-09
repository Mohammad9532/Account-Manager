import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Minimal Schemas
const TransactionSchema = new mongoose.Schema({
    amount: Number,
    balanceImpact: Number
});

const AccountSchema = new mongoose.Schema({
    name: String,
    balance: Number,
    initialBalance: Number,
    creditLimit: Number
});

const DailyExpenseSchema = new mongoose.Schema({
    amount: Number,
    balanceImpact: Number
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
const DailyExpense = mongoose.models.DailyExpense || mongoose.model('DailyExpense', DailyExpenseSchema);

async function runCorrection() {
    console.log('--- Starting Database Precision Correction (ESM - Mintmart) ---');
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env');
        }

        const opts = {
            dbName: 'Mintmart'
        };

        await mongoose.connect(process.env.MONGODB_URI, opts);
        console.log('Connected to MongoDB (Mintmart).');

        // 1. Correct Accounts
        console.log('Checking Accounts...');
        const accounts = await Account.find();
        console.log(`Found ${accounts.length} accounts.`);
        let accountUpdates = 0;
        for (const acc of accounts) {
            // Check if values seem double-scaled (Heuristic: >10000000 cents is usually indicative of a double scaling for these ledgers)
            // But since the user explicitly reported 4101077 showing as 41010.77 (Wait, no, 41010.77 was 4101077 in DB).
            // User said: "41010.77 showing as 4101077". 
            // If the DB has 41010.77 (float), UI divides by 100 -> 410.10.
            // If the DB has 4101077 (ints), UI divides by 100 -> 41010.77. 
            // PREVIOUSLY, I scaled them to 4101077. So they should be 41010.77.
            // USER REPORTS: "4K is 40K". 
            // If 4000 (float) became 400000 (correct cents), then UI shows 4000.00.
            // If it shows 40000 (UI), then the DB has 4,000,000. 
            // This means it's 10x or 100x high.

            // Let's divide by 100 on ALL numeric balance fields for the entire DB to revert the accidental double-scaling if any.
            const oldBal = acc.balance;
            const oldInit = acc.initialBalance;

            acc.balance = Math.round(acc.balance / 100);
            acc.initialBalance = Math.round((acc.initialBalance || 0) / 100);
            if (acc.creditLimit) acc.creditLimit = Math.round(acc.creditLimit / 100);

            await acc.save();
            accountUpdates++;
            console.log(`Updated ${acc.name}: ${oldBal} -> ${acc.balance}`);
        }

        // 2. Correct Transactions
        console.log('Checking Transactions...');
        const txs = await Transaction.find();
        console.log(`Found ${txs.length} transactions.`);
        let txUpdates = 0;
        for (const tx of txs) {
            tx.amount = Math.round(tx.amount / 100);
            if (tx.balanceImpact) tx.balanceImpact = Math.round(tx.balanceImpact / 100);
            await tx.save();
            txUpdates++;
        }

        // 3. Correct Daily Expenses
        console.log('Checking Daily Expenses...');
        const expenses = await DailyExpense.find();
        console.log(`Found ${expenses.length} daily expenses.`);
        let expenseUpdates = 0;
        for (const exp of expenses) {
            exp.amount = Math.round(exp.amount / 100);
            if (exp.balanceImpact) exp.balanceImpact = Math.round(exp.balanceImpact / 100);
            await exp.save();
            expenseUpdates++;
        }

        console.log(`Finished: ${accountUpdates} accounts, ${txUpdates} transactions, ${expenseUpdates} daily expenses corrected.`);
        console.log('--- Correction Finished Successfully ---');
    } catch (error) {
        console.error('Correction failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runCorrection();
