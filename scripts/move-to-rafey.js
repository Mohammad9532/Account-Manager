
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

const TransactionSchema = new mongoose.Schema({}, { strict: false });
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function moveToRafey() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Target the specific transactions we just restored/modified
        // We look for any combination of the "Being..." names we might have created
        const filter = {
            scope: 'manager',
            description: { $in: ['Beingreal', 'BeingReal', 'Being Real'] },
            amount: { $in: [5520, 110] }
        };

        const result = await Transaction.updateMany(
            filter,
            {
                $set: {
                    description: 'Rafey'
                }
            }
        );

        console.log(`Moved ${result.modifiedCount} transactions to 'Rafey' ledger.`);

        // Verify existence in Rafey
        const rafeyTxns = await Transaction.find({ description: 'Rafey', amount: { $in: [5520, 110] } });
        console.log('Verified in Rafey:', rafeyTxns.map(t => ({ id: t._id, desc: t.description, amount: t.amount, category: t.category })));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

moveToRafey();
