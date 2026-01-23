'use client';

import React, { useState, useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Download, TrendingUp, PieChart as PieIcon, ListChecks, CheckCircle, AlertTriangle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { SCOPES } from '../utils/constants';

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const ReportsView = () => {
    const { transactions, getCashCheckHistory, formatCurrency } = useFinance();
    const [activeTab, setActiveTab] = useState('expenses'); // expenses | cash
    const [cashHistory, setCashHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Load Cash History when tab changes
    React.useEffect(() => {
        if (activeTab === 'cash' && cashHistory.length === 0) {
            setLoadingHistory(true);
            getCashCheckHistory()
                .then(data => setCashHistory(data))
                .catch(err => console.error(err))
                .finally(() => setLoadingHistory(false));
        }
    }, [activeTab]);

    // 1. Process Data for Category Pie Chart (Daily Expenses Only)
    const categoryData = useMemo(() => {
        const dailyTxns = transactions.filter(t => (t.scope || 'manager') === SCOPES.DAILY);
        const catMap = {};

        dailyTxns.forEach(t => {
            if (t.type === 'Money Out') {
                let cat = t.category || 'Uncategorized';

                // --- FRONTEND NORMALIZATION ---
                // Force all medical-related terms to "Medical Expense"
                const medicalKeywords = /medicin|medical|pharmacy|doctor|dr\.|hospital|clinic|chemist|lab|test|scan|x-ray|blood|health|checkup|consult|tablet|syrup|injection|bandage/i;

                if (medicalKeywords.test(cat) || medicalKeywords.test(t.description)) {
                    cat = 'Medical Expense';
                }
                // -----------------------------

                catMap[cat] = (catMap[cat] || 0) + (t.amount || 0);
            }
        });

        const sorted = Object.entries(catMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Group into Top 5 + Others
        if (sorted.length > 5) {
            const top5 = sorted.slice(0, 5);
            const othersValue = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
            return [...top5, { name: 'Others', value: othersValue }];
        }

        return sorted;
    }, [transactions]);

    // 2. Process Data for Monthly Trends (Last 6 Months)
    const trendData = useMemo(() => {
        const dailyTxns = transactions.filter(t => (t.scope || 'manager') === SCOPES.DAILY && t.type === 'Money Out');
        const monthMap = {};

        // Init last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            monthMap[key] = 0;
        }

        dailyTxns.forEach(t => {
            const d = new Date(t.date);
            const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (monthMap.hasOwnProperty(key)) {
                monthMap[key] += t.amount || 0;
            }
        });

        return Object.entries(monthMap).map(([name, amount]) => ({ name, amount }));
    }, [transactions]);

    // 3. Export to CSV Handler
    const handleExportCSV = () => {
        const headers = ['Date', 'Category', 'Description', 'Type', 'Amount', 'Scope'];
        const rows = transactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.category || '',
            `"${(t.description || '').replace(/"/g, '""')}"`, // Escape quotes
            t.type,
            t.amount,
            t.scope || 'manager'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl">
                    <p className="text-slate-300 text-xs font-medium mb-1">{label || payload[0].name}</p>
                    <p className="text-white text-lg font-bold">
                        ₹{payload[0].value.toLocaleString('en-IN')}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300 pb-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Financial Reports</h2>
                    <p className="text-slate-400 text-sm">Visual insights & audit logs</p>
                </div>
                <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'expenses' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Expenses
                    </button>
                    <button
                        onClick={() => setActiveTab('cash')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'cash' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Cash Checks
                    </button>
                </div>
            </div>

            {activeTab === 'expenses' && (
                <>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all border border-slate-700 active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Category Pie Chart */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                                    <PieIcon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Expense Breakdown</h3>
                            </div>

                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Legend
                                            layout="vertical"
                                            verticalAlign="middle"
                                            align="right"
                                            wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Monthly Trend Bar Chart */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white">6-Month Trend</h3>
                            </div>

                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 10 }}
                                            tickFormatter={(value) => `₹${value / 1000}k`}
                                        />
                                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                        <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        {categoryData.slice(0, 4).map((cat, idx) => (
                            <div key={cat.name} className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <p className="text-slate-400 text-xs truncate">{cat.name}</p>
                                </div>
                                <p className="text-white font-bold">₹{cat.value.toLocaleString('en-IN')}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'cash' && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                    {loadingHistory ? (
                        <div className="p-12 text-center text-slate-500">Loading history...</div>
                    ) : cashHistory.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No daily checks recorded yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700/50">
                                    <tr>
                                        <th className="py-4 px-6 font-semibold">Date</th>
                                        <th className="py-4 px-6 font-semibold">Account</th>
                                        <th className="py-4 px-6 font-semibold text-right">Expected</th>
                                        <th className="py-4 px-6 font-semibold text-right">Actual</th>
                                        <th className="py-4 px-6 font-semibold text-center">Status</th>
                                        <th className="py-4 px-6 font-semibold">Note / Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {cashHistory.map((check) => (
                                        <tr key={check._id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-6 text-slate-300">
                                                {new Date(check.date).toLocaleDateString()}
                                                <span className="block text-xs text-slate-500">{new Date(check.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-300 font-medium">
                                                {check.accountId?.name || 'Cash'}
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono text-slate-400">
                                                {formatCurrency(check.expectedBalance)}
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono font-bold text-white">
                                                {formatCurrency(check.actualBalance)}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${check.status === 'Matched' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    check.status === 'Short' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                    {check.status === 'Matched' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                    {check.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-400 max-w-xs truncate">
                                                {check.note || check.reason || '-'}
                                                {Math.abs(check.difference) > 0 && <span className="block text-xs opacity-60">Diff: {formatCurrency(check.difference)}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReportsView;
