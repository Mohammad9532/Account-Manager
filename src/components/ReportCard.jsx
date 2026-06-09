import React, { forwardRef } from 'react';

const ReportCard = forwardRef(({
    title,
    subtitle,
    dateRange,
    stats,
    type = 'ledger', // 'ledger' or 'expense'
    transactions = [],
    formatCurrency = (val) => `₹${(val / 100).toLocaleString('en-IN')}` // Fallback if not injected, though it should be
}, ref) => {
    const isLedger = type === 'ledger';
    const isPositive = isLedger
        ? (stats.credit - stats.debit) >= 0
        : true; // Expense report usually doesn't have positive/negative balance concept in same way

    return (
        <div
            ref={ref}
            className="w-[600px] bg-[#0B1121] p-0 overflow-hidden relative font-sans text-slate-100"
            style={{
                fontFamily: "'Inter', sans-serif",
                backgroundImage: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)'
            }}
        >
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            {/* Header */}
            <div className="p-8 border-b border-slate-800 relative z-10 flex justify-between items-start">
                <div>
                    {/* Fixed: Removed bg-clip-text which fails in html2canvas */}
                    <h1 className="text-3xl font-bold text-emerald-400">
                        BeingReal Accounts
                    </h1>
                    <p className="text-slate-400 text-sm tracking-wider uppercase mt-1">
                        Financial Statement
                    </p>
                </div>
                <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700" suppressHydrationWarning>
                        <span className="text-xs text-slate-400 font-mono">
                            {new Date().toLocaleDateString('en-IN', {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-8 space-y-8 relative z-10">
                {/* Title Section */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
                    {subtitle && <p className="text-slate-400">{subtitle}</p>}
                    <div className="flex items-center gap-2 mt-4 text-sm text-slate-300 bg-slate-800/50 w-fit px-3 py-1.5 rounded-lg border border-slate-700/50">
                        <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {dateRange}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {isLedger ? (
                        <>
                            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                                <p className="text-xs text-emerald-400 font-bold uppercase mb-1">Total Credit</p>
                                <p className="text-2xl font-bold text-emerald-300">{formatCurrency(stats.credit)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20">
                                <p className="text-xs text-rose-400 font-bold uppercase mb-1">Total Debit</p>
                                <p className="text-2xl font-bold text-rose-300">{formatCurrency(stats.debit)}</p>
                            </div>
                            <div className={`col-span-2 p-6 rounded-2xl border ${isPositive ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-1">Net Balance</p>
                                        <p className={`text-4xl font-bold ${isPositive ? 'text-blue-400' : 'text-orange-400'}`}>
                                            {formatCurrency(Math.abs(stats.credit - stats.debit))}
                                        </p>
                                    </div>
                                    <div className={`text-right px-4 py-2 rounded-lg ${isPositive ? 'bg-blue-500/20 text-blue-300' : 'bg-orange-500/20 text-orange-300'}`}>
                                        <p className="font-bold text-sm">
                                            {stats.credit - stats.debit >= 0 ? 'YOU OWE' : 'OWES YOU'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Expense View Stats
                        <>
                            <div className="col-span-2 p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-orange-200/70 uppercase font-bold tracking-wider mb-1">Total Expenses</p>
                                        <p className="text-4xl font-bold text-orange-400">
                                            {formatCurrency(stats.total)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-white/20">{stats.count}</p>
                                        <p className="text-xs text-slate-500 uppercase">Transactions</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Recent Transactions List */}
                {transactions && transactions.length > 0 && (
                    <div className="mt-8">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-4 px-1">Recent Transactions</p>
                        <div className="bg-slate-800/30 rounded-2xl overflow-hidden border border-slate-700/50">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700/50">
                                    <tr>
                                        <th className="py-4 px-6 font-semibold uppercase text-xs tracking-wider">Date</th>
                                        <th className="py-4 px-6 font-semibold uppercase text-xs tracking-wider">Details</th>
                                        <th className="py-4 px-6 font-semibold uppercase text-xs tracking-wider text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {transactions.slice(0, 10).map((t, i) => (
                                        <tr key={i} className="text-slate-200">
                                            <td className="py-4 px-6 align-top text-slate-400 text-xs font-mono whitespace-nowrap">
                                                {new Date(t.date).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-6 align-top">
                                                <div className="font-semibold text-white mb-1">{t.category || t.description || 'Transaction'}</div>
                                                {t.description && t.description !== t.category && (
                                                    <div className="text-xs text-slate-400 leading-relaxed break-words opacity-80">
                                                        {t.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className={`py-4 px-6 align-top text-right font-mono font-bold ${t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="pt-8 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">
                        This is a computer generated document. No signature required.
                    </p>
                    <div className="mt-2 flex justify-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                    </div>
                </div>
            </div>
        </div>
    );
});

ReportCard.displayName = 'ReportCard';

export default ReportCard;
