
import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Please provide an account name'],
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Cash', 'Bank', 'Credit Card', 'Other'],
        default: 'Bank'
    },
    balance: {
        type: Number,
        default: 0
    },
    // Credit Card Specific Fields
    creditLimit: {
        type: Number,
        default: 0
    },
    billDay: {
        type: Number, // Day of month (1-31)
        min: 1,
        max: 31
    },
    dueDay: {
        type: Number, // Day of month (1-31)
        min: 1,
        max: 31
    },
    currency: {
        type: String,
        default: 'INR'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
