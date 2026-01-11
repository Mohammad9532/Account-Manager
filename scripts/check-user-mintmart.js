
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../lib/models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkUser() {
    try {
        await mongoose.connect(MONGODB_URI, { dbName: 'Mintmart' });
        console.log('Connected to Mintmart.');

        const email = 'mohammadahmadsheikh580@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log(`User found: ${user._id}`);
            console.log(`Provider: ${user.provider}`);
        } else {
            console.log('User NOT found in Mintmart DB.');
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkUser();
