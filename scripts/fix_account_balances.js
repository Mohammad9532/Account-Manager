import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('MONGODB_URI missing'); process.exit(1); }

// ── Inline models ────────────────────────────────────────────────────────────
const AccountSchema = new mongoose.Schema({}, { strict: false });
const TransactionSchema = new mongoose.Schema({}, { strict: false });
const DailyExpenseSchema = new mongoose.Schema({}, { strict: false });

const Account     = mongoose.model('Account',     AccountSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const DailyExpense= mongoose.model('DailyExpense',DailyExpenseSchema);

const INTERNAL_TYPES = ['Bank', 'Cash', 'Credit Card'];

async function main() {
    await mongoose.connect(MONGODB_URI, { dbName: 'Mintmart' });
    console.log('✅ Connected');

    const accounts     = await Account.find({});
    const transactions = await Transaction.find({});
    const dailies      = await DailyExpense.find({});
    const allTxns      = [...transactions, ...dailies];

    console.log(`\nFound ${accounts.length} accounts, ${allTxns.length} transactions\n`);

    // Build account type map for quick lookup
    const accTypeMap = {};
    accounts.forEach(a => { accTypeMap[String(a._id)] = a.type; });

    // For each account, recalculate balance
    for (const acc of accounts) {
        const accId = String(acc._id);
        const initialBalance = parseFloat(acc.initialBalance || 0);
        let calculatedBalance = initialBalance;

        for (const t of allTxns) {
            const primaryId = String(t.accountId || '');
            const linkedId  = String(t.linkedAccountId || '');
            const amount    = parseFloat(t.amount || 0);
            const impact    = t.type === 'Money In' ? amount : -amount;

            if (primaryId === accId) {
                // This account is the PRIMARY account on the transaction
                calculatedBalance += impact;
            } else if (linkedId === accId) {
                // This account is the LINKED account
                const primaryType = accTypeMap[primaryId];
                const linkedType  = acc.type;
                const isInternal  = INTERNAL_TYPES.includes(primaryType) &&
                                    INTERNAL_TYPES.includes(linkedType);

                if (isInternal) {
                    // Internal transfer → opposite direction
                    calculatedBalance -= impact;
                } else {
                    // Ledger payment → same direction
                    calculatedBalance += impact;
                }
            }
        }

        const storedBalance = parseFloat(acc.balance || 0);
        const diff = Math.abs(calculatedBalance - storedBalance);

        console.log(`${acc.name} (${acc.type})`);
        console.log(`   Stored:     ₹${storedBalance.toFixed(2)}`);
        console.log(`   Calculated: ₹${calculatedBalance.toFixed(2)}`);

        if (diff > 0.01) {
            console.log(`   ⚠️  MISMATCH (diff: ${diff.toFixed(2)}) → FIXING...`);
            await Account.updateOne({ _id: acc._id }, { $set: { balance: calculatedBalance } });
            console.log(`   ✅ Fixed\n`);
        } else {
            console.log(`   ✅ OK\n`);
        }
    }

    console.log('🎉 All account balances are now correct.');
    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('💥 Error:', err);
    process.exit(1);
});
