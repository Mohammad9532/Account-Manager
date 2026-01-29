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
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
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
                        className="group flex items-center justify-between p-3 rounded-xl bg-finance-card border border-finance-border hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(52,211,153,0.1)] transition-all cursor-default"
                    >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className={`p-2 rounded-full flex-shrink-0 ${t.type === TRANSACTION_TYPES.CREDIT ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                {t.type === TRANSACTION_TYPES.CREDIT ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-finance-text truncate pr-2">{t.description}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="whitespace-nowrap" suppressHydrationWarning>{new Date(t.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className={`truncate ${CATEGORY_COLORS[displayCategory] || 'text-slate-400 dark:text-slate-500'}`}>{displayCategory}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className={`font-bold font-mono ${t.type === TRANSACTION_TYPES.CREDIT ? 'text-emerald-600 dark:text-emerald-400' : 'text-finance-text'}`}>
                                {t.type === TRANSACTION_TYPES.CREDIT ? '+' : '-'} ₹{t.amount?.toLocaleString()}
                            </span>
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this transaction?')) {
                                        // Pass the explicit scope from the list prop to ensure correct endpoint usage
                                        deleteTransaction(t._id || t.id, scope);
                                    }
                                }}
                                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
                                title="Delete"
                            >
                                <Trash2 className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TransactionList;
