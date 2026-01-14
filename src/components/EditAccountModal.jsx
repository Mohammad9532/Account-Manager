'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const EditAccountModal = ({ account, onClose }) => {
    const { updateAccount, accounts } = useFinance();
    const [formData, setFormData] = useState({
        name: '',
        initialBalance: '',
        creditLimit: '',
        linkedAccountId: '',
        billDay: '',
        dueDay: ''
    });

    const otherCreditCards = accounts.filter(a =>
        a.type === 'Credit Card' && a._id !== account._id
    );

    useEffect(() => {
        if (account) {
            setFormData({
                name: account.name || '',
                initialBalance: account.initialBalance || 0,
                creditLimit: account.creditLimit || '',
                linkedAccountId: account.linkedAccountId || '',
                billDay: account.billDay || '',
                dueDay: account.dueDay || ''
            });
        }
    }, [account]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await updateAccount(account._id, {
            ...formData,
            creditLimit: formData.linkedAccountId ? 0 : (parseFloat(formData.creditLimit) || 0),
            linkedAccountId: formData.linkedAccountId || null,
            billDay: parseInt(formData.billDay) || null,
            dueDay: parseInt(formData.dueDay) || null
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-white mb-1">Edit Account</h3>
                <p className="text-slate-400 text-sm mb-6">Update details for {account.name}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Account Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Initial Balance</label>
                        <input
                            type="number"
                            value={formData.initialBalance}
                            onChange={e => setFormData(prev => ({ ...prev, initialBalance: e.target.value }))}
                            disabled={account.transactionCount > 0}
                            className={`w-full bg-slate-950 border border-slate-800/50 rounded-xl px-4 py-3 text-white ${account.transactionCount > 0 ? 'text-slate-500 cursor-not-allowed' : 'focus:outline-none focus:border-emerald-500'}`}
                            title={account.transactionCount > 0 ? "Cannot edit balance after transactions are added" : "Initial balance"}
                        />
                        <p className="text-xs text-slate-600 mt-1">
                            {account.transactionCount > 0
                                ? "Cannot be changed after transactions are added."
                                : "Can be edited because no transactions exist."}
                        </p>
                    </div>

                    {account.type === 'Credit Card' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Share Limit With (Optional)</label>
                                <select
                                    value={formData.linkedAccountId}
                                    onChange={e => setFormData(prev => ({ ...prev, linkedAccountId: e.target.value }))}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                                >
                                    <option value="">None (Independent Limit)</option>
                                    {otherCreditCards.map(card => (
                                        <option key={card._id} value={card._id}>
                                            {card.name} (Limit: {card.creditLimit?.toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!formData.linkedAccountId && (
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Credit Limit</label>
                                    <input
                                        type="number"
                                        value={formData.creditLimit}
                                        onChange={e => setFormData(prev => ({ ...prev, creditLimit: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                            )}

                            {formData.linkedAccountId && (
                                <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sm text-sky-400 flex items-center gap-2">
                                    <span className="font-bold">Info:</span>
                                    This card will share the credit limit of the selected card.
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Bill Gen Day</label>
                                    <input
                                        type="number"
                                        min="1" max="31"
                                        value={formData.billDay}
                                        onChange={e => setFormData(prev => ({ ...prev, billDay: e.target.value }))}
                                        placeholder="Day (1-31)"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Due Day</label>
                                    <input
                                        type="number"
                                        min="1" max="31"
                                        value={formData.dueDay}
                                        onChange={e => setFormData(prev => ({ ...prev, dueDay: e.target.value }))}
                                        placeholder="Day (1-31)"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl mt-2 transition-all active:scale-[0.98]"
                    >
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditAccountModal;
