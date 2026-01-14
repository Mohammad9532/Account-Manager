'use client';

import React, { useState, useMemo } from 'react';
import { Wallet, TrendingUp, Plus, X, Search, Filter, ArrowUpDown } from 'lucide-react';
import StatsCard from './StatsCard';
import TransactionList from './TransactionList';
import TransactionForm from './TransactionForm';
import CalendarView from './CalendarView';
import ReportCard from './ReportCard';
import { useFinance } from '../context/FinanceContext';
// Import SCOPES as INCOME from constants, but we actually need to import SCOPES to use SCOPES.INCOME
import { SCOPES, TRANSACTION_TYPES } from '../utils/constants';

const IncomeView = () => {
    const { stats, transactions } = useFinance();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAll, setShowAll] = useState(false);

    // Filter & Sort States
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    // Time Range State
    const [timeRange, setTimeRange] = useState('month'); // Default to month for income usually
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Filter transactions to only be INCOME/CREDIT types from Daily/Income scopes
    // Actually we decided shared storage, so we filter by Type = CREDIT and Scope = DAILY (which Income also uses)
    const incomeTransactions = useMemo(() => {
        return transactions.filter(t =>
            (t.scope === SCOPES.DAILY || t.scope === SCOPES.INCOME) &&
            t.type === TRANSACTION_TYPES.CREDIT
        );
    }, [transactions]);

    // Dynamic Categories from Data
    const availableCategories = useMemo(() => {
        const cats = new Set(incomeTransactions.map(t => t.category).filter(Boolean));
        return Array.from(cats).sort();
    }, [incomeTransactions]);

    // Calculate Income based on Time Range
    const timeRangeIncome = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Helper to reset time to midnight
        const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const todayDate = stripTime(now);

        return incomeTransactions.reduce((sum, t) => {
            const tDate = stripTime(new Date(t.date));
            const diffTime = todayDate - tDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let include = false;

            switch (timeRange) {
                case 'today':
                    include = diffDays === 0;
                    break;
                case 'yesterday':
                    include = diffDays === 1;
                    break;
                case 'week': // This Week (Sunday to Today)
                    const dayOfWeek = now.getDay(); // 0 is Sunday
                    include = diffDays <= dayOfWeek;
                    break;
                case 'month': // This Month
                    include = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
                    break;
                case 'year': // This Year
                    include = tDate.getFullYear() === now.getFullYear();
                    break;
                case 'last10':
                    include = diffDays >= 0 && diffDays < 10;
                    break;
                case 'last20':
                    include = diffDays >= 0 && diffDays < 20;
                    break;
                case 'custom':
                    if (startDate && endDate) {
                        const s = new Date(startDate);
                        const e = new Date(endDate);
                        include = tDate >= s && tDate <= e;
                    } else if (startDate) {
                        const s = new Date(startDate);
                        include = tDate >= s;
                    }
                    break;
                default:
                    include = false;
            }

            return include ? sum + (t.amount || 0) : sum;
        }, 0);
    }, [incomeTransactions, timeRange, startDate, endDate]);

    // Filter & Sort Logic for List
    const processedTransactions = useMemo(() => {
        let result = incomeTransactions.filter(t => {
            const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter ? t.category === categoryFilter : true;
            return matchesSearch && matchesCategory;
        });

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
            if (sortBy === 'oldest') return new Date(a.date) - new Date(b.date);
            if (sortBy === 'highest') return b.amount - a.amount;
            if (sortBy === 'lowest') return a.amount - b.amount;
            return 0;
        });

        return result;
    }, [incomeTransactions, searchTerm, categoryFilter, sortBy]);

    const rangeLabels = {
        today: 'Earned Today',
        yesterday: 'Earned Yesterday',
        week: 'Earned This Week',
        month: 'Earned This Month',
        year: 'Earned This Year',
        last10: 'Earned Last 10 Days',
        last20: 'Earned Last 20 Days'
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <div>
                    <h2 className="text-2xl font-bold text-white">Income Tracker</h2>
                    <p className="text-slate-400 text-sm">Track salary, sales, and other earnings</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex-1 md:flex-none"
                    >
                        <Plus className="w-5 h-5" />
                        Add Income
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatsCard
                    title="Total Income (All Time)"
                    amount={incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)}
                    icon={Wallet}
                    type="income"
                />

                {/* Time Range Stats Card */}
                <StatsCard
                    title={
                        <div className="flex items-center gap-2">
                            <span>Income</span>
                            <div className="relative group/select">
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="bg-transparent border-none text-sm font-bold text-blue-400 focus:ring-0 focus:outline-none cursor-pointer py-0 pr-6 hover:text-blue-300 transition-colors appearance-none"
                                >
                                    <option className="bg-slate-900 text-slate-300" value="today">Today</option>
                                    <option className="bg-slate-900 text-slate-300" value="yesterday">Yesterday</option>
                                    <option className="bg-slate-900 text-slate-300" value="week">This Week</option>
                                    <option className="bg-slate-900 text-slate-300" value="month">This Month</option>
                                    <option className="bg-slate-900 text-slate-300" value="year">This Year</option>
                                    <option className="bg-slate-900 text-slate-300" value="last10">Last 10 Days</option>
                                    <option className="bg-slate-900 text-slate-300" value="last20">Last 20 Days</option>
                                    <option className="bg-slate-900 text-slate-300 font-bold text-orange-400" value="custom">Custom Range</option>
                                </select>
                                <ArrowUpDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-400 pointer-events-none opacity-50 group-hover/select:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    }
                    amount={timeRangeIncome}
                    icon={TrendingUp}
                    type="income"
                />

                {/* Custom Date Inputs (Only show if Custom is selected) */}
                {timeRange === 'custom' && (
                    <div className="md:col-span-2 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4">
                        <div className="flex-1 w-full">
                            <label className="text-xs text-slate-500 font-bold mb-1 block">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="text-xs text-slate-500 font-bold mb-1 block">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Filter & Sort Bar */}
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search income..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="relative w-full sm:w-48">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                                >
                                    <option value="">All Categories</option>
                                    {availableCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort By */}
                            <div className="relative w-full sm:w-48">
                                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="highest">Highest Amount</option>
                                    <option value="lowest">Lowest Amount</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">
                            {showAll || searchTerm || categoryFilter ? 'Filtered List' : 'Recent Income'}
                        </h3>
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-sm text-blue-400 hover:text-blue-300"
                        >
                            {(searchTerm || categoryFilter) ? `Found ${processedTransactions.length} items` : (showAll ? 'Show Less' : 'View All')}
                        </button>
                    </div>

                    <TransactionList
                        customData={(showAll || searchTerm || categoryFilter) ? processedTransactions : processedTransactions.slice(0, 10)}
                        scope={SCOPES.INCOME} // Pass Income Scope so List might style it if needed (but it mostly relies on type)
                    />
                </div>

                <div className="h-fit">
                    <CalendarView scope={SCOPES.INCOME} />
                </div>
            </div>

            {/* Add Transaction Modal */}
            {
                showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative w-full max-w-lg">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white bg-white/10 rounded-full backdrop-blur-md transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <TransactionForm
                                onClose={() => setShowAddModal(false)}
                                scope={SCOPES.INCOME}
                                initialData={{ type: TRANSACTION_TYPES.CREDIT }} // Force Credit Type
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default IncomeView;
