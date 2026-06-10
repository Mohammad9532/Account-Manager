import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('MONGODB_URI missing'); process.exit(1); }

const AccountSchema = new mongoose.Schema({}, { strict: false });
const TransactionSchema = new mongoose.Schema({}, { strict: false });

const Account = mongoose.model('Account', AccountSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

const INTERNAL_TYPES = ['Bank', 'Cash', 'Credit Card'];

async function main() {
    await mongoose.connect(MONGODB_URI, { dbName: 'Mintmart' });
    console.log('✅ Connected\n');

    // Find the Amazon Pay credit card account for beingsheikh7
    const accounts = await Account.find({});
    const allTxns = await Transaction.find({});

    // Find Amazon Pay accounts
    const amazonPayAccounts = accounts.filter(a => a.name === 'Amazon Pay');
    console.log(`Found ${amazonPayAccounts.length} Amazon Pay account(s):`);
    amazonPayAccounts.forEach(a => {
        console.log(`  _id: ${a._id}, balance: ${a.balance}, userId: ${a.userId}`);
    });
    console.log('');

    // Build account type map
    const accTypeMap = {};
    accounts.forEach(a => { accTypeMap[String(a._id)] = a.type; });

    // For each Amazon Pay account, find the 4325 transaction
    for (const acc of amazonPayAccounts) {
        const accId = String(acc._id);
        console.log(`\n=== Processing Amazon Pay (${accId}) ===`);
        console.log(`   Stored balance: ₹${acc.balance}`);

        // Find ALL transactions affecting this account
        const relatedTxns = allTxns.filter(t =>
            String(t.accountId) === accId ||
            String(t.linkedAccountId) === accId
        );

        console.log(`   Total related transactions: ${relatedTxns.length}`);

        // Look for recent 4325 transactions
        const recent4325 = relatedTxns.filter(t => {
            const amt = parseFloat(t.amount);
            return amt === 4325 || amt === 432500;
        });

        if (recent4325.length > 0) {
            console.log(`\n   🔍 Found ${recent4325.length} transaction(s) with amount 4325 or 432500:`);
            recent4325.forEach(t => {
                console.log(`      _id: ${t._id}`);
                console.log(`      amount: ${t.amount}`);
                console.log(`      type: ${t.type}`);
                console.log(`      accountId: ${t.accountId}`);
                console.log(`      linkedAccountId: ${t.linkedAccountId}`);
                console.log(`      date: ${t.date}`);
                console.log('');
            });
        } else {
            console.log(`\n   ⚠️  No transaction with amount 4325/432500 found for this account`);
        }

        // Recalculate balance from ALL transactions
        const initialBalance = parseFloat(acc.initialBalance || 0);
        let calculatedBalance = initialBalance;

        for (const t of relatedTxns) {
            const primaryId = String(t.accountId || '');
            const linkedId = String(t.linkedAccountId || '');
            const amount = parseFloat(t.amount || 0);
            const impact = t.type === 'Money In' ? amount : -amount;

            if (primaryId === accId) {
                calculatedBalance += impact;
            } else if (linkedId === accId) {
                const primaryType = accTypeMap[primaryId];
                const linkedType = acc.type;
                const isInternal = INTERNAL_TYPES.includes(primaryType) && INTERNAL_TYPES.includes(linkedType);
                if (isInternal) {
                    calculatedBalance -= impact;
                } else {
                    calculatedBalance += impact;
                }
            }
        }

        console.log(`   Calculated balance: ₹${calculatedBalance.toFixed(2)}`);
        const diff = Math.abs(calculatedBalance - parseFloat(acc.balance));

        if (diff > 0.01) {
            console.log(`   ⚠️  MISMATCH (diff: ₹${diff.toFixed(2)}) → FIXING to ₹${calculatedBalance.toFixed(2)}`);
            await Account.updateOne({ _id: acc._id }, { $set: { balance: calculatedBalance } });
            console.log(`   ✅ Fixed!`);
        } else {
            console.log(`   ✅ Balance already correct.`);
        }
    }

    console.log('\n🎉 Done.');
    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('💥', err);
    process.exit(1);
});
