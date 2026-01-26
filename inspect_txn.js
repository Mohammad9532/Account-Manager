
const mongoose = require('mongoose');
const { Transaction } = require('./lib/models/Transaction'); // Adjust path as needed
require('dotenv').config({ path: '.env.local' });

async function checkLastTransaction() {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        const lastTxn = await Transaction.findOne().sort({ date: -1, createdAt: -1 });
        console.log("Last Transaction:");
        console.log(JSON.stringify(lastTxn, null, 2));

        if (lastTxn) {
            console.log("AccountId Type:", typeof lastTxn.accountId);
            console.log("LinkedAccountId Type:", typeof lastTxn.linkedAccountId);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkLastTransaction();
