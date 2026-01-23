
import mongoose from 'mongoose';

const DailyCashCheckSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
        index: true
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    openingBalance: {
        type: Number,
        required: true
    },
    totalIn: {
        type: Number,
        required: true
    },
    totalOut: {
        type: Number,
        required: true
    },
    expectedBalance: {
        type: Number,
        required: true
    },
    actualBalance: {
        type: Number,
        required: true
    },
    difference: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Matched', 'Short', 'Excess'],
        required: true
    },
    reason: {
        type: String,
        default: ''
    },
    note: {
        type: String,
        default: ''
    },
    adjustmentTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const DailyCashCheck = mongoose.models.DailyCashCheck || mongoose.model('DailyCashCheck', DailyCashCheckSchema);
