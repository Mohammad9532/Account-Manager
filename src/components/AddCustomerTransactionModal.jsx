'use client';

import React, { useState } from 'react';
import { X, Banknote, ArrowRight, Wallet, Receipt } from 'lucide-react';

const AddCustomerTransactionModal = ({ isOpen, onClose, customer, onTransactionAdded }) => {
    const [type, setType] = useState('receipt'); // 'receipt' (Customer Pays Us) or 'payment' (We Pay Customer)
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const txn = {
                date,
                type: type,
                localAmount: parseFloat(amount),
                description: description || (type === 'receipt' ? 'Payment Received' : 'Payment Made')
            };

            const response = await fetch(`/api/currency-customers/${customer._id}`, {
                method: 'PUT',
                body: JSON.stringify({ $push: { transactions: txn } }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                if (onTransactionAdded) onTransactionAdded();
                handleClose();
            } else {
                console.error('Failed to add transaction');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        setDescription('');
        setType('receipt');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Settle Amount
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">For: {customer?.name}</p>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Toggle Type */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setType('receipt')}
                            className={`py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${type === 'receipt' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            <Banknote className="w-4 h-4" /> Received
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('payment')}
                            className={`py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${type === 'payment' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            <Wallet className="w-4 h-4" /> Paid
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Amount (AED)</label>
                        <div className="relative">
                            <span className={`absolute left-4 top-3 font-bold ${type === 'receipt' ? 'text-emerald-500' : 'text-rose-500'}`}>AED</span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-slate-800 border-slate-700 text-white pl-14 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-lg font-bold"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Date</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-slate-800 border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Note (Optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-800 border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500/50"
                            placeholder={type === 'receipt' ? 'e.g. Received via Bank Transfer' : 'e.g. Correction or Refund'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] 
                        ${type === 'receipt' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'}`}
                    >
                        {loading ? 'Processing...' : (type === 'receipt' ? 'Receive Payment' : 'Record Payment')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddCustomerTransactionModal;
