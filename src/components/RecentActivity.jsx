'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { TRANSACTION_TYPES } from '../utils/constants';
import { useFinance } from '../context/FinanceContext';

const RecentActivity = ({ transactions, accounts }) => {
    const { formatCurrency } = useFinance();
    // Get latest 5 transactions
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const getAccountName = (id) => {
        const acc = accounts.find(a => a._id === id);
        return acc ? acc.name : 'Unknown';
    };

    return (
        <div className="bg-finance-card rounded-2xl border border-finance-border overflow-hidden shadow-xl">
            <div className="p-4 border-b border-finance-border flex justify-between items-center bg-finance-card/50 backdrop-blur-sm">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Live Transactions
                </h3>
                <span className="text-xs text-slate-400 font-mono">LATEST 5</span>
            </div>

            <div className="divide-y divide-finance-border">
                {recentTransactions.map((t, i) => {
                    const isCredit = t.type === TRANSACTION_TYPES.CREDIT;
                    return (
                        <div key={t._id || i} className="p-4 flex justify-between items-center hover:bg-slate-700/30 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                    {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-white font-medium text-sm group-hover:text-emerald-300 transition-colors">
                                        {t.description || 'Untitled Transaction'}
                                    </p>
                                    <p className="text-xs text-slate-400" suppressHydrationWarning>
                                        {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {getAccountName(t.accountId)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`block font-mono font-bold ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isCredit ? '+' : '-'} {formatCurrency(Math.abs(t.amount))}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {recentTransactions.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        No recent transactions found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentActivity;
