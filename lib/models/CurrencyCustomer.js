import mongoose from 'mongoose';

const CurrencyCustomerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide a customer name'],
        trim: true,
    },
    contact: {
        type: String,
        trim: true,
    },
    transactions: [{
        date: {
            type: Date,
            default: Date.now
        },
        type: {
            type: String,
            enum: ['buy', 'sell', 'payment', 'receipt'],
            // Sell = We sold to Customer (They owe us). 
            // Receipt = They paid us (Owe less).
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
            type: Number, // AED amount
            required: true
        },
        description: String,
        dealerReferenceId: { // Link to the Dealer transaction if this was a back-to-back trade
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CurrencyDealer'
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

// Virtual for Balance
// Positive = Customer Owes US
// Sell (We give FC, They owe AED) -> Positive
// Receipt (We get AED) -> Negative (Reduces debt)
CurrencyCustomerSchema.virtual('balance').get(function () {
    if (!this.transactions) return 0;
    return this.transactions.reduce((acc, txn) => {
        if (txn.type === 'sell') {
            return acc + (txn.localAmount || 0); // They owe us
        } else if (txn.type === 'receipt') {
            return acc - (txn.localAmount || 0); // They paid us
        }
        // What about 'buy' from customer? (We buy from customer)
        // If we Buy from Customer -> We owe them. (Negative)
        // If we Pay Customer -> We owe less. (Positive effect on balance "They owe us" perspective? No.)
        // Let's stick to "Balance = How much THEY owe US".
        // Buy -> We owe them (-LocalAmount)
        // Payment -> We pay them (+LocalAmount, reducing our debt to them / increasing their balance to us)
        if (txn.type === 'buy') {
            return acc - (txn.localAmount || 0);
        }
        if (txn.type === 'payment') {
            return acc + (txn.localAmount || 0);
        }
        return acc;
    }, 0);
});

export const CurrencyCustomer = mongoose.models.CurrencyCustomer || mongoose.model('CurrencyCustomer', CurrencyCustomerSchema);
