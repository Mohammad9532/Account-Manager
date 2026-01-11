'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Minus, Calendar, Tag, Type } from 'lucide-react';
import { TRANSACTION_TYPES, CATEGORIES, SCOPES } from '../utils/constants';
import { useFinance } from '../context/FinanceContext';

const TransactionForm = ({ onClose, scope = SCOPES.MANAGER, initialData = {} }) => {
    const { addTransaction, updateTransaction } = useFinance();
    const [formData, setFormData] = useState({
        type: TRANSACTION_TYPES.DEBIT,
        amount: '',
        category: 'Food',
        description: '',
        date: new Date().toISOString().split('T')[0],
        ...initialData // Override defaults with initial data
    });

    const isManager = scope === SCOPES.MANAGER;

    // Ensure initialData updates if it changes while mounted
    useEffect(() => {
        if (initialData && Object.keys(initialData).length > 0) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.description) return;

        const payload = {
            ...formData,
            amount: parseFloat(formData.amount),
            scope
        };
        console.log("Submitting Transaction:", payload);

        if (formData._id) {
            updateTransaction(formData._id, payload);
        } else {
            addTransaction(payload);
        }

        // If it's a one-off entry from clicking a row, we usually want to close immediately
        if (onClose) onClose();
        else setFormData(prev => ({ ...prev, amount: '', description: '' }));
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl max-w-lg w-full">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                {formData._id ? 'Edit Entry' : (isManager ? (initialData.description ? `Add Entry for ${initialData.description}` : 'Add Ledger Entry') : 'Add Daily Expense')}
            </h2>

            <div className="grid gap-6">
                {!isManager ? (
                    /* Hidden for Daily: Automatically Money Out */
                    <div className="hidden"></div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 p-1 bg-slate-950 rounded-xl border border-slate-800">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: TRANSACTION_TYPES.CREDIT })}
                            className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${formData.type === TRANSACTION_TYPES.CREDIT
                                ? 'bg-emerald-500/10 text-emerald-400 shadow-inner'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Plus className="w-4 h-4" /> Credit (In)
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: TRANSACTION_TYPES.DEBIT })}
                            className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${formData.type === TRANSACTION_TYPES.DEBIT
                                ? 'bg-rose-500/10 text-rose-400 shadow-inner'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Minus className="w-4 h-4" /> Debit (Out)
                        </button>
                    </div>
                )}

                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Amount</label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-4 pl-10 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-bold text-lg"
                            placeholder="0.00"
                            autoFocus
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                                placeholder="Select or type category..."
                            />
                            <datalist id="category-options">
                                {CATEGORIES.map(c => <option key={c} value={c} />)}
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
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                        {isManager ? 'Particulars (Person / Description)' : 'Description'}
                    </label>
                    <div className="relative">
                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                            placeholder={isManager ? "e.g. Rafey, Salary, HDFC..." : "What was this for?"}
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-[0.98] ${formData.type === TRANSACTION_TYPES.CREDIT
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
