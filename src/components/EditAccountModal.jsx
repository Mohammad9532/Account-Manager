'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const EditAccountModal = ({ account, onClose }) => {
    const { updateAccount, accounts, transactions, SCOPES, TRANSACTION_TYPES } = useFinance();
    const [formData, setFormData] = useState({
        name: '',
        initialBalance: '',
        creditLimit: '',
        linkedAccountId: '',
        billDay: '',
        dueDay: '',
        balance: undefined // Handle manual correction
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
                dueDay: account.dueDay || '',
                balance: undefined // Reset correction on account change
            });
        }
    }, [account]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const updatePayload = {
            ...formData,
            creditLimit: formData.linkedAccountId ? 0 : (parseFloat(formData.creditLimit) || 0),
            linkedAccountId: formData.linkedAccountId || null,
            billDay: parseInt(formData.billDay) || null,
            dueDay: parseInt(formData.dueDay) || null
        };

        // If manual correction is provided, adjust initialBalance
        if (formData.balance !== undefined && formData.balance !== '') {
            const targetBalance = parseFloat(formData.balance);
            const accId = String(account._id);
            const accName = (account.name || '').toLowerCase().trim();

            // Calculate current sum of transactions (EXCLUDING initial balance)
            const transactionsSum = transactions.reduce((sum, t) => {
                const tAccountId = t.accountId ? String(t.accountId) : null;
                const tLinkedId = t.linkedAccountId ? String(t.linkedAccountId) : null;
                const tDesc = (t.description || '').toLowerCase().trim();

                const isDirectMatch = tAccountId === accId || tLinkedId === accId;
                const isNameMatch = account.type === 'Other' && !t.accountId && !t.linkedAccountId && tDesc === accName;

                if (isDirectMatch || isNameMatch) {
                    if ((t.scope || SCOPES.MANAGER) !== SCOPES.MANAGER) return sum;
                    const amount = parseFloat(t.amount || 0);

                    const isPrimary = tAccountId === accId;
                    const isLinked = tLinkedId === accId;

                    if (isPrimary) {
                        return t.type === TRANSACTION_TYPES.CREDIT ? sum + amount : sum - amount;
                    } else if (isLinked) {
                        return t.type === TRANSACTION_TYPES.CREDIT ? sum - amount : sum + amount;
                    }
                }
                return sum;
            }, 0);

            // newInitialBalance + transactionsSum = targetBalance
            // => newInitialBalance = targetBalance - transactionsSum
            updatePayload.initialBalance = targetBalance - transactionsSum;
            updatePayload.balance = targetBalance; // Also update the balance field for immediate DB sync
        } else {
            // Ensure we don't send undefined balance if no correction was made
            delete updatePayload.balance;
        }

        await updateAccount(account._id, updatePayload);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-finance-bg border border-finance-border rounded-2xl w-full max-w-sm p-6 relative shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-finance-text mb-1">Edit Account</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Update details for {account.name}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Account Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-finance-text focus:outline-none focus:border-emerald-500 transition-colors"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Initial Balance</label>
                        <input
                            type="number"
                            value={formData.initialBalance}
                            onChange={e => setFormData(prev => ({ ...prev, initialBalance: e.target.value }))}
                            disabled={account.transactionCount > 0}
                            className={`w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-3 text-finance-text ${account.transactionCount > 0 ? 'opacity-60 cursor-not-allowed' : 'focus:outline-none focus:border-emerald-500'}`}
                            title={account.transactionCount > 0 ? "Cannot edit balance after transactions are added" : "Initial balance"}
                        />
                        <p className="text-xs text-slate-600 mt-1">
                            {account.transactionCount > 0
                                ? "Cannot be changed after transactions are added."
                                : "Can be edited because no transactions exist."}
                        </p>
                    </div>

                    {/* Manual Balance Correction */}
                    <div>
                        <label className="block text-sm text-amber-600 dark:text-amber-500/80 mb-1 font-medium flex items-center gap-2">
                            Current Balance (Correction)
                            <span className="text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Use to fix mismatches</span>
                        </label>
                        <input
                            type="number"
                            value={formData.balance !== undefined ? formData.balance : ''}
                            onChange={e => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                            className="w-full bg-slate-100 dark:bg-slate-950 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-3 text-finance-text focus:outline-none focus:border-amber-500 transition-colors"
                            placeholder={account.balance || 0}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Override the calculated balance if it doesn't match your actual bank/card.
                        </p>
                    </div>

                    {account.type === 'Credit Card' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div>
                                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Share Limit With (Optional)</label>
                                <select
                                    value={formData.linkedAccountId}
                                    onChange={e => setFormData(prev => ({ ...prev, linkedAccountId: e.target.value }))}
                                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-finance-text focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                                >
                                    <option className="bg-finance-bg" value="">None (Independent Limit)</option>
                                    {otherCreditCards.map(card => (
                                        <option className="bg-finance-bg" key={card._id} value={card._id}>
                                            {card.name} (Limit: {card.creditLimit?.toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!formData.linkedAccountId && (
                                <div>
                                    <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Credit Limit</label>
                                    <input
                                        type="number"
                                        value={formData.creditLimit}
                                        onChange={e => setFormData(prev => ({ ...prev, creditLimit: e.target.value }))}
                                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-finance-text focus:outline-none focus:border-emerald-500 transition-colors"
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
                                    <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Bill Gen Day</label>
                                    <input
                                        type="number"
                                        min="1" max="31"
                                        value={formData.billDay}
                                        onChange={e => setFormData(prev => ({ ...prev, billDay: e.target.value }))}
                                        placeholder="Day (1-31)"
                                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-finance-text focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Due Day</label>
                                    <input
                                        type="number"
                                        min="1" max="31"
                                        value={formData.dueDay}
                                        onChange={e => setFormData(prev => ({ ...prev, dueDay: e.target.value }))}
                                        placeholder="Day (1-31)"
                                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-finance-text focus:outline-none focus:border-emerald-500 transition-colors"
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
