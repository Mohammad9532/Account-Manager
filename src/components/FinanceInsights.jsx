'use client';

import React, { useMemo } from 'react';
import { Target, TrendingUp, PieChart, Activity } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { SCOPES, TRANSACTION_TYPES } from '../utils/constants';

const FinanceInsights = ({ transactions }) => {
    const { formatCurrency } = useFinance();

    const insights = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Filter transactions for this month across all scopes
        const monthlyTransactions = transactions.filter(t => new Date(t.date) >= startOfMonth);

        // Summarize by Category
        const categoryMap = {};
        let totalIncome = 0;
        let totalExpense = 0;

        monthlyTransactions.forEach(t => {
            const amt = parseFloat(t.amount || 0);
            const isManager = (t.scope || SCOPES.MANAGER) === SCOPES.MANAGER;

            // Logic for Dashboard Insights:
            // We care about REAL Cash Flow (Daily Expenses + Manager Incomes/Expenses)
            if (t.type === TRANSACTION_TYPES.CREDIT) {
                totalIncome += amt;
            } else {
                totalExpense += amt;
                const cat = t.category || 'Miscellaneous';
                categoryMap[cat] = (categoryMap[cat] || 0) + amt;
            }
        });

        // Get Top Category
        const categories = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

        return {
            totalIncome,
            totalExpense,
            categories,
            savingsRate: Math.max(0, savingsRate)
        };
    }, [transactions]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Savings Rate Card */}
            <div className="bg-finance-card border border-finance-border rounded-2xl p-4 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Target className="w-24 h-24 text-sky-500" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                        <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">Savings Rate (Month)</h3>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-bold text-finance-text">{insights.savingsRate}%</span>
                        <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-800 rounded-full mb-1.5 overflow-hidden">
                            <div
                                className="h-full bg-sky-500 rounded-full transition-all duration-1000"
                                style={{ width: `${insights.savingsRate}%` }}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">You saved {formatCurrency(insights.totalIncome - insights.totalExpense)} this month</p>
                </div>
            </div>

            {/* Top Spending Categories */}
            <div className="lg:col-span-2 bg-finance-card border border-finance-border rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                        <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">Top Spending</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {insights.categories.length > 0 ? insights.categories.map(([name, amt], idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[100px]">{name}</span>
                                <span className="text-finance-text font-bold">{formatCurrency(amt)}</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${idx === 0 ? 'bg-orange-500' : idx === 1 ? 'bg-orange-500/60' : 'bg-orange-500/30'}`}
                                    style={{ width: `${(amt / insights.totalExpense) * 100}%` }}
                                />
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-3 py-4 text-center text-slate-500 text-sm">No spending data for this month</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinanceInsights;
