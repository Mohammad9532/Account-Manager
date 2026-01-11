import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Money In', 'Money Out'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    scope: {
        type: String,
        enum: ['manager', 'daily'],
        default: 'manager',
        required: true
    }
});

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
