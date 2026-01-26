
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
    linkedAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        default: null
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
    emis: [{
        name: { type: String, required: true },
        totalAmount: { type: Number, required: true }, // Original Principal
        remainingAmount: { type: Number, required: true }, // Currently blocked amount
        interestRate: { type: Number, default: 0 },
        gst: { type: Number, default: 0 },
        monthlyPayment: { type: Number, default: 0 },
        tenureMonths: { type: Number, default: 0 },
        paidMonths: { type: Number, default: 0 },
        startDate: { type: Date, default: Date.now },
        status: { type: String, enum: ['Active', 'Closed'], default: 'Active' }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});



export const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
