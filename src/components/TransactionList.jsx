'use client';

import React from 'react';
import { Trash2, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TRANSACTION_TYPES, CATEGORY_COLORS, SCOPES } from '../utils/constants';

const TransactionList = ({ limit, scope = SCOPES.MANAGER, customData = null }) => {
    const { transactions, deleteTransaction, loading } = useFinance();

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    // Use customData if provided, otherwise filter by scope from context
    const filteredTransactions = customData || transactions.filter(t =>
        (t.scope || SCOPES.MANAGER) === scope
    );

    const displayTransactions = limit ? filteredTransactions.slice(0, limit) : filteredTransactions;

    if (filteredTransactions.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                No {scope === SCOPES.MANAGER ? 'account' : 'daily'} transactions yet.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {displayTransactions.map((t) => {
                // frontend normalization for medical terms
                const medicalKeywords = /medicin|medical|pharmacy|doctor|dr\.|hospital|clinic|chemist|lab|test|scan|x-ray|blood|health|checkup|consult|tablet|syrup|injection|bandage/i;
                const displayCategory = (medicalKeywords.test(t.description) || medicalKeywords.test(t.category)) ? 'Medical Expense' : t.category;

                return (
                    <div
                        key={t._id || t.id}
                        className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 transition-all cursor-default"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${t.type === TRANSACTION_TYPES.CREDIT ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {t.type === TRANSACTION_TYPES.CREDIT ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-200">{t.description}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>{new Date(t.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className={CATEGORY_COLORS[displayCategory] || 'text-slate-400'}>{displayCategory}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className={`font-bold font-mono ${t.type === TRANSACTION_TYPES.CREDIT ? 'text-emerald-400' : 'text-slate-200'}`}>
                                {t.type === TRANSACTION_TYPES.CREDIT ? '+' : '-'} ₹{t.amount?.toLocaleString()}
                            </span>
                            <button
                                onClick={() => deleteTransaction(t._id || t.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TransactionList;
