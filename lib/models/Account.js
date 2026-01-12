
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
    currency: {
        type: String,
        default: 'AED'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
