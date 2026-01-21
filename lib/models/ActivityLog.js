import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
    ledgerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
        index: true
    },
    userId: {
        type: String, // String to match other models
        required: true
    },
    action: {
        type: String,
        required: true,
        // Examples: "ENTRY_ADDED", "ENTRY_EDITED", "ENTRY_DELETED", "USER_INVITED", "USER_REMOVED"
    },
    details: {
        type: String, // Human readable description e.g. "Rahul edited ₹500 – Fuel"
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // Optional structured data for potential future use or debugging
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true // Useful for sorting logs by time
    }
});

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
