import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const AccountSchema = new mongoose.Schema({}, { strict: false });
const Account = mongoose.model('Account', AccountSchema);

async function main() {
    await mongoose.connect(MONGODB_URI, { dbName: 'Mintmart' });
    console.log('✅ Connected\n');

    // Find all HDFC Bank accounts to identify the right one
    const hdfcAccounts = await Account.find({ name: 'HDFC', type: 'Bank' });
    console.log(`Found ${hdfcAccounts.length} HDFC Bank account(s):`);
    hdfcAccounts.forEach(a => {
        console.log(`  _id: ${a._id}, balance: ${a.balance}, userId: ${a.userId}`);
    });

    // The one with balance -2529.30 is beingsheikh7's account
    const target = hdfcAccounts.find(a => Math.abs(parseFloat(a.balance) - (-2529.30)) < 1);

    if (!target) {
        console.log('\n❌ Could not find HDFC Bank with balance ~-2529.30');
        console.log('Trying to find by largest balance...');
    }

    const acc = target || hdfcAccounts.find(a => parseFloat(a.balance) !== 0);

    if (!acc) {
        console.log('❌ No matching account found.');
        await mongoose.disconnect();
        process.exit(1);
    }

    console.log(`\nUpdating account: ${acc._id} (current balance: ₹${acc.balance})`);

    const CORRECT_BALANCE = 1795.70;

    const result = await Account.findOneAndUpdate(
        { _id: acc._id },
        { $set: { balance: CORRECT_BALANCE } },
        { new: true }
    );

    console.log(`✅ HDFC Bank balance updated:`);
    console.log(`   Name: ${result.name}`);
    console.log(`   New Balance: ₹${result.balance}`);

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => { console.error('💥', err); process.exit(1); });
