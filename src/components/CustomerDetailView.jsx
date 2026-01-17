'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Plus, Trash2, Banknote } from 'lucide-react';
import AddCustomerTransactionModal from './AddCustomerTransactionModal';

const CustomerDetailView = ({ customerId, onBack }) => {
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

    const fetchCustomer = async () => {
        try {
            const res = await fetch(`/api/currency-customers/${customerId}`);
            if (res.ok) {
                const data = await res.json();
                setCustomer(data);
            }
        } catch (error) {
            console.error("Failed to fetch customer details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomer();
    }, [customerId]);

    const handleDeleteCustomer = async () => {
        if (!window.confirm("Are you sure you want to delete this customer?")) return;
        try {
            await fetch(`/api/currency-customers/${customerId}`, { method: 'DELETE' });
            onBack();
        } catch (e) {
            console.error(e);
        }
    };

    const handleTransactionAdded = () => {
        setIsSettleModalOpen(false);
        fetchCustomer();
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading details...</div>;
    if (!customer) return <div className="p-8 text-center text-rose-500">Customer not found</div>;

    const transactions = customer.transactions?.sort((a, b) => new Date(b.date) - new Date(a.date)) || [];

    // Simple status badge
    const StatusBadge = ({ type }) => {
        const styles = {
            buy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', // They bought from us? Or We bought from them? Model says Sell = We Sold.
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

    // Customer usually just receives "Sell" (We sold to him) or "Receipt" (He paid us).
    // Sometimes we might "Payment" (We pay him back?)

    return (
        <div className="animate-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 border-b border-slate-700 pb-6">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to List
                    </button>
                    <h1 className="text-3xl font-bold text-white mb-2">{customer.name}</h1>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                        {customer.contact && (
                            <div className="flex items-center gap-1.5">
                                <Phone className="w-4 h-4" />
                                {customer.contact}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setIsSettleModalOpen(true)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        <Banknote className="w-4 h-4" />
                        Settle Balance
                    </button>
                    <button
                        onClick={handleDeleteCustomer}
                        className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    {/* Add Transaction directly for Customer usually done via Dealer Trade or Direct Receipt */}
                    {/* TODO: Add 'Add Payment/Receipt' Modal for customer if needed directly */}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats / Balance Card */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <p className="text-slate-400 text-sm mb-1">Current Balance</p>
                        <h2 className={`text-4xl font-bold ${customer.balance > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {Math.abs(customer.balance || 0).toFixed(2)} <span className="text-lg text-slate-500">AED</span>
                        </h2>
                        <p className="text-sm mt-2 text-slate-400">
                            {customer.balance > 0 ? "Customer owes you" : customer.balance < 0 ? "You owe customer" : "All settled"}
                        </p>
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
                                                {txn.foreignAmount ? (
                                                    <span>
                                                        {txn.foreignAmount?.toFixed(2)} <span className="text-slate-500 text-xs">{txn.foreignCurrency}</span>
                                                    </span>
                                                ) : <span className="text-slate-600">-</span>}
                                            </td>
                                            <td className="p-4 text-slate-400">
                                                {txn.exchangeRate > 0 ? txn.exchangeRate.toFixed(4) : '-'}
                                            </td>
                                            <td className={`p-4 text-right font-bold font-mono ${(txn.type === 'sell') ? 'text-emerald-400' : 'text-slate-300'}`}>
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
            <AddCustomerTransactionModal
                isOpen={isSettleModalOpen}
                onClose={() => setIsSettleModalOpen(false)}
                customer={customer}
                onTransactionAdded={handleTransactionAdded}
            />
        </div>
    );
};

export default CustomerDetailView;
