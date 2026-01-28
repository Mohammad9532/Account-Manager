
import mongoose from 'mongoose';

const DailyExpenseSchema = new mongoose.Schema({
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
    userId: {
        type: String,
        index: true
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: false,
        index: true
    },
    balanceImpact: {
        type: Number,
        default: 0
    }
});

// Index for performance
DailyExpenseSchema.index({ userId: 1, date: -1 });

// Helper to prevent OverwriteModelError in Next.js hot reload
export const DailyExpense = mongoose.models.DailyExpense || mongoose.model('DailyExpense', DailyExpenseSchema);
