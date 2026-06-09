import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const AccountSchema = new mongoose.Schema({ name: String, balance: Number });
const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);

async function inspectData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const accounts = await Account.find().limit(5);
        console.log('Sample Accounts:', JSON.stringify(accounts, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspectData();
