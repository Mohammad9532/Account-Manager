'use client';

import React from 'react';
import { useFinance } from '../context/FinanceContext';

const StatsCard = ({ title, amount, icon: Icon, type = 'neutral', trend, headerAction }) => {
    const { formatCurrency } = useFinance();

    const getColors = () => {
        switch (type) {
            case 'income': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'expense': return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
            default: return 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20';
        }
    };

    const style = getColors();

    return (
        <div className="relative p-6 rounded-2xl bg-white/70 dark:bg-finance-card border border-white dark:border-finance-border backdrop-blur-md shadow-sm dark:shadow-xl group hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="w-full">
                    {/* Header Row with Action */}
                    <div className="flex items-start justify-between w-full mb-1">
                        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h3>
                        {headerAction && <div className="ml-2">{headerAction}</div>}
                    </div>
                    <p className="text-2xl font-bold tracking-tight text-finance-text group-hover:scale-105 transition-transform origin-left">
                        {formatCurrency(Math.abs(amount))}
                    </p>
                </div>
                <div className={`p-3 rounded-xl ${style} group-hover:ring-2 ring-offset-2 ring-offset-finance-bg ring-current transition-all duration-500`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            {trend && (
                <div className="flex items-center gap-2 text-xs">
                    <span className={trend > 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                    <span className="text-slate-500 dark:text-slate-600">vs last month</span>
                </div>
            )}

            <div className={`absolute inset-x-0 bottom-0 h-1 rounded-b-2xl opacity-20 ${type === 'income' ? 'bg-emerald-500' : type === 'expense' ? 'bg-rose-500' : 'bg-sky-500'
                }`} />
        </div>
    );
};

export default StatsCard;
