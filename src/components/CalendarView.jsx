'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SCOPES, TRANSACTION_TYPES } from '../utils/constants';
import { useFinance } from '../context/FinanceContext';

const CalendarView = ({ scope }) => {
    const { transactions } = useFinance();
    const [currentDate, setCurrentDate] = useState(new Date());

    // 1. Filter Relevant Transactions (Memoized)
    const relevantTransactions = useMemo(() => {
        // Default to DAILY if no scope passed, but support others
        const targetScope = scope || SCOPES.DAILY;
        return transactions.filter(t => (t.scope || SCOPES.MANAGER) === targetScope);
    }, [transactions, scope]);

    // 2. Aggregate Totals by Date (HashMap O(N))
    const totalsMap = useMemo(() => {
        const map = {};
        relevantTransactions.forEach(t => {
            // Ensure we use local date string YYYY-MM-DD
            const dateStr = new Date(t.date).toLocaleDateString('en-CA'); // 'YYYY-MM-DD' format
            if (!map[dateStr]) map[dateStr] = 0;

            // For Income scope, we might want to show income (CREDIT) totals? 
            // The original code filtered for DEBIT (Expense). 
            // Let's adapt: If scope is INCOME, show CREDIT. If DAILY, show DEBIT.
            const targetType = (scope === SCOPES.INCOME) ? TRANSACTION_TYPES.CREDIT : TRANSACTION_TYPES.DEBIT;

            if (t.type === targetType) {
                map[dateStr] += t.amount;
            }
        });
        return map;
    }, [relevantTransactions, scope]);

    // 3. Generate Calendar Grid (O(Days))
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

        const days = [];

        // Pad empty start days
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        // Fill days
        for (let i = 1; i <= daysInMonth; i++) {
            // Construct YYYY-MM-DD manually to match toLocaleDateString('en-CA') logic or just use the same method
            // Safe way: create date object -> format
            const d = new Date(year, month, i);
            const dateStr = d.toLocaleDateString('en-CA');

            days.push({
                day: i,
                date: d,
                total: totalsMap[dateStr] || 0
            });
        }
        return days;
    }, [currentDate, totalsMap]);

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    const monthName = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });

    return (
        <div className="bg-finance-card p-4 rounded-2xl border border-finance-border shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    {scope === SCOPES.INCOME ? 'Income Calendar' : 'Expense Calendar'}
                </h3>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                    <button onClick={prevMonth} className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 hover:text-finance-text transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-finance-text min-w-[80px] text-center">{monthName}</span>
                    <button onClick={nextMonth} className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 hover:text-finance-text transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <div key={d} className="text-center text-[10px] text-slate-600 font-bold uppercase">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((d, idx) => {
                    if (!d) return <div key={idx} className="min-h-[40px] md:min-h-[60px]" />;

                    const isToday = new Date().toDateString() === d.date.toDateString();
                    const hasData = d.total > 0;

                    return (
                        <div
                            key={idx}
                            className={`min-h-[40px] md:min-h-[60px] rounded-lg p-1 border flex flex-col items-center justify-center transition-all ${hasData
                                ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                                : 'bg-transparent border-transparent'
                                }`}
                        >
                            <span className={`text-[10px] font-bold mb-0.5 ${isToday ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 rounded-md' : 'text-slate-500 dark:text-slate-500'}`}>
                                {d.day}
                            </span>
                            {hasData && (
                                <span className={`text-[9px] sm:text-[10px] font-mono font-bold leading-none ${scope === SCOPES.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                    }`}>
                                    {d.total >= 100000
                                        ? `${(d.total / 100000).toFixed(1)}k`
                                        : Math.round(d.total / 100)}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
