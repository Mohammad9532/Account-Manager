'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SCOPES, TRANSACTION_TYPES } from '../utils/constants';
import { useFinance } from '../context/FinanceContext';

const CalendarView = () => {
    const { transactions } = useFinance();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Get Daily Expenses
    const dailyExpenses = useMemo(() => {
        return transactions.filter(t => (t.scope || 'manager') === SCOPES.DAILY);
    }, [transactions]);

    // Calculate totals per day for the current month
    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday

        const dayList = [];

        // Pad empty days
        for (let i = 0; i < firstDay; i++) {
            dayList.push(null);
        }

        // Fill actual days
        for (let i = 1; i <= days; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            // Sum expenses for this day
            const dayTotal = dailyExpenses
                .filter(t => t.date.startsWith(dateStr) && t.type === TRANSACTION_TYPES.DEBIT)
                .reduce((sum, t) => sum + t.amount, 0);

            dayList.push({ day: i, total: dayTotal, date: dateStr });
        }
        return dayList;
    }, [currentDate, dailyExpenses]);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Daily Tracker
                </h3>
                <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-white min-w-[120px] text-center">{monthName}</span>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-xs text-slate-500 font-medium py-2">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {daysInMonth.map((d, idx) => (
                    <div
                        key={idx}
                        className={`min-h-[80px] rounded-xl p-2 border transition-all ${d
                            ? 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50'
                            : 'bg-transparent border-transparent'
                            }`}
                    >
                        {d && (
                            <div className="h-full flex flex-col justify-between">
                                <span className={`text-xs font-bold ${new Date().toDateString() === new Date(d.date).toDateString()
                                    ? 'text-blue-400 bg-blue-500/10 w-fit px-1.5 rounded'
                                    : 'text-slate-400'
                                    }`}>
                                    {d.day}
                                </span>
                                {d.total > 0 && (
                                    <span className="text-[10px] sm:text-xs font-mono font-bold text-rose-400 break-words leading-tight mt-1">
                                        ₹{d.total.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CalendarView;
