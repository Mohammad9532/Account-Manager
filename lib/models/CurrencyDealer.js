import mongoose from 'mongoose';

const CurrencyDealerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide a dealer name'],
        trim: true,
    },
    contact: {
        type: String,
        trim: true,
    },
    defaultCurrency: {
        type: String, // e.g., "USD"
        default: 'USD'
    },
    transactions: [{
        date: {
            type: Date,
            default: Date.now
        },
        type: {
            type: String,
            enum: ['buy', 'sell', 'payment', 'receipt'], // buy/sell = FX deals, payment/receipt = Settling the balance
            required: true
        },
        foreignCurrency: {
            type: String,
            uppercase: true
        },
        foreignAmount: {
            type: Number,
            default: 0
        },
        exchangeRate: {
            type: Number,
            default: 0
        },
        localAmount: {
            type: Number, // The amount in AED. For Buy/Sell, this is calc from rate. For Pay/Rec, it's the actual amount.
            required: true
        },
        description: String,
        status: {
            type: String,
            enum: ['completed', 'pending'],
            default: 'completed'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for Current Balance (Positive = We owe Dealer, Negative = Dealer owes us? Or standard Ledger?)
// Let's use standard: Credit (We owe) - Debit (They owe)
// Buy FC (We get USD, We owe AED) -> Credit
// Sell FC (We give USD, They owe AED) -> Debit
// Payment (We pay AED) -> Debit
// Receipt (We get AED) -> Credit
CurrencyDealerSchema.virtual('balance').get(function () {
    if (!this.transactions) return 0;
    return this.transactions.reduce((acc, txn) => {
        if (txn.type === 'buy' || txn.type === 'receipt') {
            return acc + (txn.localAmount || 0); // We owe them (or received cash, so liability/equity logic? Wait.)
            // Let's stick to "Dealer Balance": How much I OWE the dealer.
            // I Buy $1000 @ 3.67 -> I owe 3670 AED. (Positive)
            // I Pay 3670 AED -> Balance goes to 0. (Negative effect)
        } else if (txn.type === 'sell' || txn.type === 'payment') {
            return acc - (txn.localAmount || 0);
        }
        return acc;
    }, 0);
});

export const CurrencyDealer = mongoose.models.CurrencyDealer || mongoose.model('CurrencyDealer', CurrencyDealerSchema);
