import mongoose from 'mongoose';

const LedgerAccessSchema = new mongoose.Schema({
    ledgerId: { // Refers to an Account
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
        index: true
    },
    userId: { // Refers to User (by email or ID? User model uses String _id usually or unique email?)
        // Standard User model in this codebase seems to use String for userId (often email from NextAuth)
        // Let's check Transaction.js: userId: { type: String, required: true }
        // Let's check User.js: no explicit _id, so it uses ObjectId by default.
        // However, Transaction uses String for userId.
        // Account uses String for userId.
        // So we should use String here to match existing pattern if it's the email or auth provider ID.
        // But for a reference to the User model, it should be ObjectId if we want population.
        // Wait, User.js typically has an _id (ObjectId).
        // Account.js has `userId: { type: String, ... }`.
        // I will use String here to be consistent with Account.js userId, assuming it stores the stable NextAuth ID.
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
