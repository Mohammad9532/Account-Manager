const mongoose = require('mongoose');

// Define Schemas (simplified to match expected fields)
const TransactionSchema = new mongoose.Schema({}, { strict: false });
const AccountSchema = new mongoose.Schema({}, { strict: false });
const DailyExpenseSchema = new mongoose.Schema({}, { strict: false });

async function debug() {
    try {
        const uri = "mongodb+srv://mohammadahmadsheikh580_db_user:Ahmad%40953263@mintmart.aj80l7d.mongodb.net/?appName=Mintmart";
        await mongoose.connect(uri, { dbName: 'Mintmart' });
        console.log('Connected to DB');

        const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
        const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
        const DailyExpense = mongoose.models.DailyExpense || mongoose.model('DailyExpense', DailyExpenseSchema);

        // Find Rafey Ledger account specifically using a broader regex
        const accounts = await Account.find({});
        const rafeyAcc = accounts.find(a => a.name && /Rafey/i.test(a.name));

        if (rafeyAcc) {
            console.log('\nFound Rafey Account:', JSON.stringify(rafeyAcc, null, 2));
        } else {
            console.log('\nStill no Rafey account found in Account collection.');
            // Let's print accounts that look like ledgers
            console.log('Other Ledger-like accounts:', accounts.filter(a => a.type === 'Other').map(a => a.name));
        }

        // Search ALL transactions for "Rafey"
        const allTxs = await Transaction.find({
            $or: [
                { description: /Rafey/i },
                { category: /Rafey/i },
                { amount: 5000 }
            ]
        });
        console.log(`\nFound ${allTxs.length} Transactions matching criteria.`);
        allTxs.forEach(t => {
            console.log(`- ID: ${t._id}, Date: ${t.date}, Desc: "${t.description}", Amount: ${t.amount}, Type: ${t.type}, Acc: ${t.accountId}, Linked: ${t.linkedAccountId}, Scope: ${t.scope}`);
        });

        // Search ALL daily expenses for "Rafey"
        const allDailies = await DailyExpense.find({
            $or: [
                { description: /Rafey/i },
                { category: /Rafey/i },
                { amount: 5000 }
            ]
        });
        console.log(`\nFound ${allDailies.length} Daily Expenses matching criteria.`);
        allDailies.forEach(t => {
            console.log(`- ID: ${t._id}, Date: ${t.date}, Desc: "${t.description}", Amount: ${t.amount}, Type: ${t.type}, Acc: ${t.accountId}, Linked: ${t.linkedAccountId}, Scope: ${t.scope}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
