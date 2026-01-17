'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Plus, Trash2, ArrowRightLeft } from 'lucide-react';
import { formatDate } from '../utils/constants'; // Assuming handy
import AddDealerTransactionModal from './AddDealerTransactionModal';

const DealerDetailView = ({ dealerId, onBack }) => {
    const [dealer, setDealer] = useState(null);
    const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchDealer = async () => {
        try {
            const res = await fetch(`/api/currency-dealers/${dealerId}`);
            if (res.ok) {
                const data = await res.json();
                setDealer(data);
            }
        } catch (error) {
            console.error("Failed to fetch dealer details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDealer();
    }, [dealerId]);

    const handleAddTransaction = async (txnData) => {
        // We use PUT to push transaction to dealer's array
        try {
            const res = await fetch(`/api/currency-dealers/${dealerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    $push: { transactions: txnData } // Use MongoDB operator if backend supports it OR just push to array logic
                })
            });
            // Wait, my backend implementation of PUT was: params: id, body: data, then findOneAndUpdate(..., data).
            // So if I send { $push: { transactions: txnData } } it should work with Mongoose!

            if (res.ok) {
                fetchDealer();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteDealer = async () => {
        if (!window.confirm("Are you sure you want to delete this dealer?")) return;
        try {
            await fetch(`/api/currency-dealers/${dealerId}`, { method: 'DELETE' });
            onBack();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading details...</div>;
    if (!dealer) return <div className="p-8 text-center text-rose-500">Dealer not found</div>;

    const transactions = dealer.transactions?.sort((a, b) => new Date(b.date) - new Date(a.date)) || [];

    // Simple status badge
    const StatusBadge = ({ type }) => {
        const styles = {
            buy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            sell: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            payment: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            receipt: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        };
        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${styles[type] || styles.buy} uppercase`}>
                {type}
            </span>
        );
    };

    return (
        <div className="animate-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 border-b border-slate-700 pb-6">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dealers
                    </button>
                    <h1 className="text-3xl font-bold text-white mb-2">{dealer.name}</h1>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                        {dealer.contact && (
                            <div className="flex items-center gap-1.5">
                                <Phone className="w-4 h-4" />
                                {dealer.contact}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <ArrowRightLeft className="w-4 h-4" />
                            Default: {dealer.defaultCurrency}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleDeleteDealer}
                        className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsTxnModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Add Transaction
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats / Balance Card */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <p className="text-slate-400 text-sm mb-1">Current Balance</p>
                        <h2 className={`text-4xl font-bold ${dealer.balance >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {Math.abs(dealer.balance || 0).toFixed(2)} <span className="text-lg text-slate-500">AED</span>
                        </h2>
                        <p className="text-sm mt-2 text-slate-400">
                            {dealer.balance > 0 ? "You owe this dealer" : dealer.balance < 0 ? "Dealer owes you" : "All settled"}
                        </p>
                    </div>

                    {/* Pending / Summary Placeholders */}
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4 text-sm text-slate-400">
                        <div className="flex justify-between py-2 border-b border-slate-700/50">
                            <span>Total Deals</span>
                            <span className="text-white">{transactions.filter(t => t.type === 'buy' || t.type === 'sell').length}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span>Last Activity</span>
                            <span className="text-white">{transactions[0] ? new Date(transactions[0].date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700">
                        <h3 className="font-bold text-slate-200">Transaction History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="p-4 rounded-tl-lg">Date</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Foreign Qty</th>
                                    <th className="p-4">Rate</th>
                                    <th className="p-4 text-right">Local Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50 text-sm">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-500">No transactions yet</td>
                                    </tr>
                                ) : (
                                    transactions.map((txn, idx) => (
                                        <tr key={idx} className="hover:bg-slate-700/30 transition-colors group">
                                            <td className="p-4 text-slate-300 font-mono">
                                                {new Date(txn.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <StatusBadge type={txn.type} />
                                            </td>
                                            <td className="p-4 text-white font-medium">
                                                {txn.type === 'buy' || txn.type === 'sell' ? (
                                                    <span>
                                                        {txn.foreignAmount?.toFixed(2)} <span className="text-slate-500 text-xs">{txn.foreignCurrency}</span>
                                                    </span>
                                                ) : <span className="text-slate-600">-</span>}
                                            </td>
                                            <td className="p-4 text-slate-400">
                                                {txn.exchangeRate > 0 ? txn.exchangeRate.toFixed(4) : '-'}
                                            </td>
                                            <td className={`p-4 text-right font-bold font-mono ${(txn.type === 'buy' || txn.type === 'receipt') ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {/* Logic Check: 
                                                    Buy = Liability increases (Rose?) 
                                                    Sell = Liability decreases (Emerald?)
                                                    Payment = Liability decreases (Emerald?)
                                                    Receipt = Liability increases? (We got cash back?) 
                                                    Let's verify visual logic. 
                                                    - Buy (We took USD) -> Owe AED -> Red/Negative effect on our net worth? No, we got asset. But we OWE Dealer. So Red for Liability.
                                                    - Payment (We paid AED) -> Owe less -> Green because good?
                                                */}
                                                {txn.localAmount?.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AddDealerTransactionModal
                isOpen={isTxnModalOpen}
                onClose={() => setIsTxnModalOpen(false)}
                dealer={dealer}
                onAddTransaction={handleAddTransaction}
            />
        </div>
    );
};

export default DealerDetailView;
