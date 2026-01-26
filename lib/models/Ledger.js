import mongoose from 'mongoose';

const LedgerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    ownerId: {
        type: String, // references User (usually email or auth ID)
        required: true,
        index: true
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure unique combination of Owner + Name to prevent duplicates
LedgerSchema.index({ ownerId: 1, name: 1 }, { unique: true });

export const Ledger = mongoose.models.Ledger || mongoose.model('Ledger', LedgerSchema);
