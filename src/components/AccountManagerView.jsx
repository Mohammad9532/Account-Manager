'use client';

import React, { useState, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, X } from 'lucide-react';
import StatsCard from './StatsCard';
import AccountsSection from './AccountsSection';
import LedgerTable from './LedgerTable';
import LedgerForm from './LedgerForm';
import LedgerDetailView from './LedgerDetailView';
import { useFinance } from '../context/FinanceContext';
import { SCOPES, TRANSACTION_TYPES } from '../utils/constants';

const AccountManagerView = () => {
    const { transactions, accounts, stats } = useFinance(); // Get raw transactions to aggregate
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [selectedLedgerName, setSelectedLedgerName] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);

    // 1. Calculate Ledger Book Stats & Trends
    const ledgerStats = useMemo(() => {
        const groups = {};

        // --- Trend Calculation Helpers ---
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const endOfLastMonth = new Date(lastMonthYear, lastMonth + 1, 0);

        // --- Aggregation Variables ---
        // Current Totals
        let netBalance = 0;
        let totalReceivables = 0; // Negative balances
        let totalPayables = 0;    // Positive balances

        // Last Month Totals (Snapshot)
        const groupsLastMonth = {};

        transactions.forEach(t => {
            if ((t.scope || SCOPES.MANAGER) !== SCOPES.MANAGER) return;

            const name = (t.description || 'Unknown').trim();
            const key = name.toLowerCase();
            const amt = parseFloat(t.amount);
            const isCredit = t.type === TRANSACTION_TYPES.CREDIT;
            const signedAmt = isCredit ? amt : -amt;
            const tDate = new Date(t.date);

            // 1. Current Aggregation
            if (!groups[key]) groups[key] = { balance: 0 };
            groups[key].balance += signedAmt;

            // 2. Last Month Snapshot Aggregation (All txns up to end of last month)
            if (tDate <= endOfLastMonth) {
                if (!groupsLastMonth[key]) groupsLastMonth[key] = 0;
                groupsLastMonth[key] += signedAmt;
            }
        });

        // Finalize Current Totals from Groups
        Object.values(groups).forEach(group => {
            netBalance += group.balance;
            if (group.balance < 0) totalReceivables += Math.abs(group.balance);
            else totalPayables += group.balance;
        });

        // Finalize Last Month Totals
        let lastMonthNetBalance = 0;
        let lastMonthTotalReceivables = 0;
        let lastMonthTotalPayables = 0;

        Object.values(groupsLastMonth).forEach(bal => {
            lastMonthNetBalance += bal;
            if (bal < 0) lastMonthTotalReceivables += Math.abs(bal);
            else lastMonthTotalPayables += bal;
        });

        // Calculate Growth Percentage
        const calculateGrowth = (current, previous) => {
            if (previous === 0) return current === 0 ? 0 : 100;
            return Math.round(((current - previous) / previous) * 100);
        };

        return {
            balance: netBalance,
            totalReceivables,
            totalPayables,
            trends: {
                balance: calculateGrowth(netBalance, lastMonthNetBalance),
                payables: calculateGrowth(totalPayables, lastMonthTotalPayables),
                receivables: calculateGrowth(totalReceivables, lastMonthTotalReceivables)
            }
        };
    }, [transactions]);

    // 2. Calculate Account Stats (Bank/Cash/CC)
    const accountStats = useMemo(() => {
        let liquidFunds = 0;
        let ccDebt = 0;

        accounts.forEach(acc => {
            const bal = acc.balance || 0;
            if (['Bank', 'Cash'].includes(acc.type)) {
                liquidFunds += bal;
            } else if (acc.type === 'Credit Card') {
                // Credit Card balance is negative when used. Debt = -balance.
                // If balance is positive, it's a surplus (counts as liquid funds? Or just negative debt).
                // Usually CC balance is <= 0.
                if (bal < 0) {
                    ccDebt += Math.abs(bal);
                } else {
                    // Surplus payment to CC
                    liquidFunds += bal;
                }
            }
        });

        return { liquidFunds, ccDebt };
    }, [accounts]);

    const handleRowClick = (transaction) => {
        setSelectedLedgerName(transaction.description);
        setViewMode('detail');
    };

    const handleAccountClick = (account) => {
        setSelectedAccount(account);
        setViewMode('account');
    };

    const handleBack = () => {
        setViewMode('list');
        setSelectedLedgerName(null);
        setSelectedAccount(null);
    };

    // Render Detail View
    if (viewMode === 'detail' && selectedLedgerName) {
        return <LedgerDetailView ledgerName={selectedLedgerName} onBack={handleBack} />;
    }

    if (viewMode === 'account' && selectedAccount) {
        // Find the latest version of the account (with updated balance) from the context
        const liveAccount = accounts.find(a => a._id === selectedAccount._id) || selectedAccount;
        return (
            <LedgerDetailView
                ledgerName={liveAccount.name}
                accountId={liveAccount._id}
                accountDetails={liveAccount}
                onBack={handleBack}
            />
        );
    }

    // 3. Calculate Net Position (Net Worth)
    const totalPayables = ledgerStats.totalPayables + accountStats.ccDebt;
    const netPosition = (accountStats.liquidFunds + ledgerStats.totalReceivables) - totalPayables;
    const isAsset = netPosition >= 0;

    // Render Main Dashboard
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-300">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <div>
                    <h2 className="text-2xl font-bold text-white">Account Manager</h2>
                    <p className="text-slate-400 text-sm">Track salaries, loans, and major funds</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95 w-full md:w-auto"
                >
                    <Plus className="w-5 h-5" />
                    Add Ledger
                </button>
            </div>

            {/* Accounts Section */}
            <AccountsSection onAccountClick={handleAccountClick} />

            {/* Stats Grid - Using calculated ledgerStats + accountStats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title={isAsset ? "Net Asset (Surplus)" : "Net Liability (Deficit)"}
                    amount={Math.abs(netPosition)}
                    icon={isAsset ? TrendingUp : TrendingDown}
                    type={isAsset ? "income" : "expense"}
                    trend={0}
                />
                <StatsCard
                    title="Available Funds (Cash + Bank)"
                    amount={accountStats.liquidFunds}
                    icon={Wallet}
                    type="neutral"
                    trend={0}
                />
                <StatsCard
                    title="Total Payables (We Owe)"
                    amount={totalPayables}
                    icon={TrendingUp}
                    type="expense"
                    trend={ledgerStats.trends.payables}
                />
                <StatsCard
                    title="Total Receivables (Owed to Us)"
                    amount={ledgerStats.totalReceivables}
                    icon={TrendingDown}
                    type="income"
                    trend={ledgerStats.trends.receivables}
                />
            </div>

            {/* Ledger Table Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Ledger Book</h3>
                    <button className="text-sm text-blue-400 hover:text-blue-300">View All</button>
                </div>
                {/* Full width ledger table */}
                <LedgerTable scope={SCOPES.MANAGER} onRowClick={handleRowClick} />
            </div>

            {/* Add Ledger Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white bg-white/10 rounded-full backdrop-blur-md transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <LedgerForm onClose={() => setShowAddModal(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountManagerView;
