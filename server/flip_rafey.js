import mongoose from 'mongoose';
import { Transaction } from './models/Transaction.js';

const user = 'mohammadahmadsheikh580_db_user';
const pass = encodeURIComponent('Ahmad@953263');
const host = 'mintmart.aj80l7d.mongodb.net';
const dbName = 'Mintmart';

const uri = `mongodb+srv://${user}:${pass}@${host}/${dbName}?retryWrites=true&w=majority&appName=Mintmart`;

async function flipRafey() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const query = { description: /Rafey/i };

        // Use native collection to ensure pipeline update is handled correctly
        const result = await Transaction.collection.updateMany(
            query,
            [
                {
                    $set: {
                        type: {
                            $cond: {
                                if: { $eq: ["$type", "Money In"] },
                                then: "Money Out",
                                else: "Money In"
                            }
                        }
                    }
                }
            ]
        );

        console.log(`✅ Successfully flipped ${result.modifiedCount} transactions for Rafey.`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

flipRafey();
