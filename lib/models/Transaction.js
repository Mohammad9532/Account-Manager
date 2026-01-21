import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Money In', 'Money Out']
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
        default: 'manager'
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: false
    },
    linkedAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: false
    },
    userId: {
        type: String,
        required: true,
        index: true
    }
});

// Helper to prevent OverwriteModelError in Next.js hot reload
export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
