import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const AccountSchema = new mongoose.Schema({}, { strict: false });
const Account = mongoose.model('Account', AccountSchema);

async function main() {
    await mongoose.connect(MONGODB_URI, { dbName: 'Mintmart' });
    console.log('✅ Connected');

    // Amazon Pay ID for beingsheikh7@gmail.com account
    const AMAZON_PAY_ID = '697856b543ed2113b553c9cd';
    const CORRECT_BALANCE = -56056.98;

    const result = await Account.findOneAndUpdate(
        { _id: AMAZON_PAY_ID },
        { $set: { balance: CORRECT_BALANCE } },
        { new: true }
    );

    if (result) {
        console.log(`✅ Amazon Pay balance updated to ₹${CORRECT_BALANCE}`);
        console.log(`   Name: ${result.name}`);
        console.log(`   New Balance: ₹${result.balance}`);
    } else {
        console.log('❌ Account not found');
    }

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => { console.error('💥', err); process.exit(1); });
