import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { Transaction } from './models/Transaction.js';

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB URI from environment variable
const uri = process.env.MONGODB_URI;

console.log('Connecting to MongoDB...');

mongoose.connect(uri)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// API Routes

// Get all transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const newTransaction = new Transaction(req.body);
        const saved = await newTransaction.save();
        res.json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update transaction
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const updated = await Transaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete transaction
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server (only if not running on Vercel)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel
export default app;
