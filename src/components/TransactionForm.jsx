'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Minus, Calendar, Tag, Type } from 'lucide-react';
import { TRANSACTION_TYPES, CATEGORIES, SCOPES } from '../utils/constants';
import { useFinance } from '../context/FinanceContext';

const TransactionForm = ({ onClose, scope = SCOPES.MANAGER, initialData = {}, ledgerAccountId = null, customCategories = null }) => {
    const { addTransaction, updateTransaction, accounts } = useFinance();
    const [formData, setFormData] = useState({
        type: initialData.type || TRANSACTION_TYPES.DEBIT,
        amount: '',
        category: '', // Don't autofill
        description: '',
        accountId: initialData.accountId || ledgerAccountId || '', // Default to ledgerAccountId if provided
        accountName: '',
        date: new Date().toISOString().split('T')[0],
        ...initialData
    });

    // Use custom categories if provided (from Ledger/Income context), else default list
    const categoryOptions = customCategories || CATEGORIES;

    const isManager = scope === SCOPES.MANAGER;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            amount: parseFloat(formData.amount),
            date: new Date(formData.date),
            scope
        };

        // Linked Account Logic:
        // If we are in a Ledger Context (ledgerAccountId provided) AND the user selected a DIFFERENT account (e.g. Bank)
        // Then: accountId = Selected Bank (Source), linkedAccountId = Ledger (Destination/Context)
        if (ledgerAccountId && payload.accountId && String(payload.accountId) !== String(ledgerAccountId)) {
            payload.linkedAccountId = ledgerAccountId;

            // TRANSFER LOGIC (Refined):
            // The Type toggle (Credit/Debit) refers to the CURRENT LEDGER (destination).
            // We ONLY flip the type if BOTH sides of the transaction are INTERNAL accounts.
            // If one side is a "Ledger" (type Other), both should show the SAME user-selected type.

            const selectedAccount = accounts.find(a => String(a._id) === String(payload.accountId));
            const contextAccount = accounts.find(a => String(a._id) === String(ledgerAccountId));

            const internalTypes = ['Bank', 'Cash', 'Credit Card'];
            const isInternalTransfer = selectedAccount && contextAccount &&
                internalTypes.includes(selectedAccount.type) &&
                internalTypes.includes(contextAccount.type);

            if (isInternalTransfer) {
                if (payload.type === TRANSACTION_TYPES.CREDIT) {
                    payload.type = TRANSACTION_TYPES.DEBIT;
                } else {
                    payload.type = TRANSACTION_TYPES.CREDIT;
                }
            }
        }

        // Remove empty accountId to avoid Mongoose CastError
        if (!payload.accountId) delete payload.accountId;

        try {
            if (formData._id) {
                await updateTransaction(formData._id, payload);
            } else {
                await addTransaction(payload);
            }

            // If it's a one-off entry from clicking a row, we usually want to close immediately
            if (onClose) onClose();
            else setFormData(prev => ({ ...prev, amount: '', description: '' }));
        } catch (error) {
            console.error("Transaction Error:", error);
            // Optionally handle error UI
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-[100dvh] md:h-auto p-6 md:rounded-2xl bg-slate-900 border-0 md:border border-slate-800 shadow-xl w-full max-w-lg mx-auto overflow-y-auto">

            {/* Mobile Header with Close Button */}
            <div className="flex items-center justify-between mb-8 md:mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {formData._id ? 'Edit Entry' : (isManager ? (initialData.description ? `Add Entry for ${initialData.description}` : 'Add Ledger Entry') : (scope === SCOPES.INCOME ? 'Add Daily Income' : 'Add Daily Expense'))}
                </h2>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="md:hidden p-2 -mr-2 text-slate-400 hover:text-white"
                    >
                        {/* Close Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                )}
            </div>

            <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: TRANSACTION_TYPES.CREDIT })}
                        // Disable if scope is DAILY (Expense only)
                        disabled={scope === SCOPES.DAILY}
                        className={`flex items-center justify-center gap-2 py-4 md:py-3 rounded-lg font-medium transition-all ${formData.type === TRANSACTION_TYPES.CREDIT
                            ? 'bg-emerald-500/10 text-emerald-400 shadow-inner'
                            : (scope === SCOPES.DAILY ? 'text-slate-700 cursor-not-allowed hidden' : 'text-slate-500 hover:text-slate-300')
                            }`}
                    >
                        <Plus className="w-5 h-5 md:w-4 md:h-4" /> {isManager ? 'Credit (In)' : 'Income (In)'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: TRANSACTION_TYPES.DEBIT })}
                        // Disable if scope is INCOME (Income only)
                        disabled={scope === SCOPES.INCOME}
                        className={`flex items-center justify-center gap-2 py-4 md:py-3 rounded-lg font-medium transition-all ${formData.type === TRANSACTION_TYPES.DEBIT
                            ? 'bg-rose-500/10 text-rose-400 shadow-inner'
                            : (scope === SCOPES.INCOME ? 'text-slate-700 cursor-not-allowed hidden' : 'text-slate-500 hover:text-slate-300')
                            }`}
                    >
                        <Minus className="w-5 h-5 md:w-4 md:h-4" /> {isManager ? 'Debit (Out)' : 'Expense (Out)'}
                    </button>
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Amount</label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">₹</span>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-5 pl-10 pr-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-bold text-2xl"
                            placeholder="0.00"
                            autoFocus
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                            {isManager ? 'Type' : 'Category'}
                        </label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                list="category-options"
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-4 md:py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500"
                                placeholder="Select or type category..."
                            />
                            <datalist id="category-options">
                                {categoryOptions.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-4 md:py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                        Payment Method (Account)
                    </label>
                    <div className="relative">
                        <select
                            value={formData.accountId || ''}
                            onChange={(e) => {
                                const selectedAccount = accounts.find(a => a._id === e.target.value);
                                setFormData({
                                    ...formData,
                                    accountId: e.target.value,
                                    accountName: selectedAccount ? selectedAccount.name : ''
                                });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-4 md:py-3 pl-4 pr-10 focus:outline-none focus:border-emerald-500 appearance-none"
                        >
                            <option value="">Select Account (Optional)</option>
                            {accounts
                                .filter(acc => acc.type !== 'Other')
                                .map(acc => (
                                    <option key={acc._id} value={acc._id}>
                                        {acc.name} ({acc.type})
                                    </option>
                                ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                        Description
                    </label>
                    <div className="relative">
                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-4 md:py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500"
                            placeholder="Enter description..."
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className={`w-full py-4 mt-auto md:mt-0 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-[0.98] ${formData.type === TRANSACTION_TYPES.CREDIT
                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                        : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                        }`}
                >
                    {formData._id ? 'Update Entry' : (isManager ? 'Save Entry' : 'Add Transaction')}
                </button>
            </div>
        </form>
    );
};

export default TransactionForm;
