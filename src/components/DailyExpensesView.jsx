'use client';

import React, { useState, useMemo } from 'react';
import { Coffee, TrendingDown, Plus, X, Calendar, Search, Filter, ArrowUpDown, Clock } from 'lucide-react';
import StatsCard from './StatsCard';
import TransactionList from './TransactionList';
import TransactionForm from './TransactionForm';
import CalendarView from './CalendarView';
import { useFinance } from '../context/FinanceContext';
import { SCOPES } from '../utils/constants';

const DailyExpensesView = () => {
    const { stats, transactions } = useFinance();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAll, setShowAll] = useState(false);

    // Filter & Sort States
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    // Time Range State
    const [timeRange, setTimeRange] = useState('today');

    const dailyStats = stats(SCOPES.DAILY);

    // DEBUGGING: Log to chrome console
    // console.log("All Transactions:", transactions);
    // console.log("Daily Scoped:", transactions.filter(t => (t.scope || 'manager') === SCOPES.DAILY));

    // Dynamic Categories from Data
    const availableCategories = useMemo(() => {
        const dailyTxns = transactions.filter(t => (t.scope || 'manager') === SCOPES.DAILY);
        const cats = new Set(dailyTxns.map(t => t.category).filter(Boolean));
        return Array.from(cats).sort();
    }, [transactions]);

    // Calculate Spend based on Time Range
    const timeRangeSpend = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Helper to reset time to midnight
        const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const todayDate = stripTime(now);

        const dailyTxns = transactions.filter(t => (t.scope || 'manager') === SCOPES.DAILY);

        return dailyTxns.reduce((sum, t) => {
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
                default:
                    include = false;
            }

            return include ? sum + (t.amount || 0) : sum;
        }, 0);
    }, [transactions, timeRange]);

    // Filter & Sort Logic for List
    const processedTransactions = useMemo(() => {
        let result = transactions.filter(t => {
            const isDaily = (t.scope || 'manager') === SCOPES.DAILY;
            const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter ? t.category === categoryFilter : true;
            return isDaily && matchesSearch && matchesCategory;
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
    }, [transactions, searchTerm, categoryFilter, sortBy]);

    const rangeLabels = {
        today: 'Spent Today',
        yesterday: 'Spent Yesterday',
        week: 'Spent This Week',
        month: 'Spent This Month',
        year: 'Spent This Year',
        last10: 'Spent Last 10 Days',
        last20: 'Spent Last 20 Days'
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <div>
                    <h2 className="text-2xl font-bold text-white">Daily Expenses</h2>
                    <p className="text-slate-400 text-sm">Track day-to-day spending</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-orange-500/20 active:scale-95 w-full md:w-auto"
                >
                    <Plus className="w-5 h-5" />
                    Add Expense
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatsCard
                    title="Total Spend (All Time)"
                    amount={dailyStats.totalExpense}
                    icon={Coffee}
                    type="expense"
                />

                {/* Time Range Stats Card */}
                <StatsCard
                    title={
                        <div className="flex items-center gap-2">
                            <span>Spent</span>
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
                                </select>
                                <ArrowUpDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-400 pointer-events-none opacity-50 group-hover/select:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    }
                    amount={timeRangeSpend}
                    icon={TrendingDown}
                    type="expense"
                />
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
                                    placeholder="Search expenses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="relative w-full sm:w-48">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 appearance-none cursor-pointer"
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
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 appearance-none cursor-pointer"
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
                            {showAll || searchTerm || categoryFilter ? 'Filtered List' : 'Recent Daily Items'}
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
                        scope={SCOPES.DAILY}
                    />
                </div>

                <div className="h-fit">
                    <CalendarView />
                </div>
            </div>

            {/* Add Transaction Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white bg-white/10 rounded-full backdrop-blur-md transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <TransactionForm onClose={() => setShowAddModal(false)} scope={SCOPES.DAILY} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyExpensesView;
