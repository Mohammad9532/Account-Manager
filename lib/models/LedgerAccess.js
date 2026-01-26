import mongoose from 'mongoose';

const LedgerAccessSchema = new mongoose.Schema({
    ledgerId: { // Refers to an Account OR Ledger
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
        // Removed strict ref: 'Account' to allow polymorphism manually or we can add refPath
    },
    type: {
        type: String,
        enum: ['Account', 'Ledger'],
        default: 'Account',
        required: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['owner', 'editor', 'viewer'],
        required: true
    },
    invitedBy: {
        type: String, // User ID of the inviter
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure a user has only one role per ledger
LedgerAccessSchema.index({ ledgerId: 1, userId: 1 }, { unique: true });

export const LedgerAccess = mongoose.models.LedgerAccess || mongoose.model('LedgerAccess', LedgerAccessSchema);
