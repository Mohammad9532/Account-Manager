import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const AccountSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function listAll() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'Mintmart' });

    const user = await User.findOne({ email: 'beingsheikh7@gmail.com' });
    const userId = user._id.toString();

    const accounts = await Account.find({ userId });
    console.log(JSON.stringify(accounts, null, 2));

    await mongoose.disconnect();
}

listAll();
