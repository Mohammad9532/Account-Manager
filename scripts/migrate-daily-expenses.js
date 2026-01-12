
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

// Define schemas locally to avoid import issues
const TransactionSchema = new mongoose.Schema({
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    scope: { type: String, default: 'manager' }, // This is the field we filter by
    userId: { type: String, index: true }
});

const DailyExpenseSchema = new mongoose.Schema({
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    userId: { type: String, index: true }
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const DailyExpense = mongoose.models.DailyExpense || mongoose.model('DailyExpense', DailyExpenseSchema);

async function migrateDailyExpenses() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all transactions with scope 'daily'
        const dailyTransactions = await Transaction.find({ scope: 'daily' });
        console.log(`Found ${dailyTransactions.length} 'daily' transactions to migrate.`);

        if (dailyTransactions.length === 0) {
            console.log('No daily transactions found.');
            return;
        }

        const toInsert = dailyTransactions.map(t => ({
            type: t.type,
            amount: t.amount,
            category: t.category,
            description: t.description,
            date: t.date,
            userId: t.userId
            // Note: _id will be new
        }));

        if (process.argv.includes('--run')) {
            console.log('Migrating data...');
            const result = await DailyExpense.insertMany(toInsert);
            console.log(`Inserted ${result.length} documents into DailyExpenses collection.`);

            console.log('Deleting migrated documents from Transactions collection...');
            // Delete using original IDs
            const idsToDelete = dailyTransactions.map(t => t._id);
            const deleteResult = await Transaction.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`Deleted ${deleteResult.deletedCount} documents from Transactions collection.`);
        } else {
            console.log('DRY RUN COMPLETE. use --run to execute migration.');
            // Preview
            if (toInsert.length > 0) {
                console.log('Sample migration:', toInsert[0]);
            }
        }

    } catch (error) {
        console.error('Migration Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrateDailyExpenses();
