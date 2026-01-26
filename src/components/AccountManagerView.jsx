import React, { useState, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, X } from 'lucide-react';
import AccountsSection from './AccountsSection';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';
import TopExposures from './TopExposures';
import LedgerDetailView from './LedgerDetailView';
import CountrySelectionModal from './CountrySelectionModal';
import { useFinance } from '../context/FinanceContext';
import { SCOPES, TRANSACTION_TYPES } from '../utils/constants';

const AccountManagerView = () => {
    const { transactions, accounts, stats } = useFinance(); // Get raw transactions to aggregate
    const [viewMode, setViewMode] = useState('list');
    const [selectedAccount, setSelectedAccount] = useState(null);

    // --- Filter out Shared Ledgers/Accounts from Personal Dashboard Stats ---
    const personalAccounts = useMemo(() => {
        const accs = accounts.filter(a => !a.isShared);
        // Dynamically recalculate balance for 'Other' accounts (Ledgers) to ensure consistency with Ledger Book.
        // For Bank/Cash/CC, we trust the DB balance (or should we recalculate all?
        // LedgerTable calculates dynamically. LedgerDetailView calculates dynamically for 'Other'.
        // To be safe and consistent, let's recalculate for 'Other' accounts here too.

        return accs.map(acc => {
            if (acc.type === 'Other') {
                const calculatedBalance = transactions.reduce((sum, t) => {
                    // Match Account ID or Linked Account ID
                    const tAccountId = t.accountId ? String(t.accountId) : null;
                    const tLinkedId = t.linkedAccountId ? String(t.linkedAccountId) : null;
                    const accId = String(acc._id);

                    if (tAccountId === accId || tLinkedId === accId) {
                        const amount = parseFloat(t.amount);
                        return t.type === TRANSACTION_TYPES.CREDIT ? sum + amount : sum - amount;
                    }
                    return sum;
                }, 0);
                return { ...acc, balance: calculatedBalance };
            }
            return acc;
        });
    }, [accounts, transactions]);

    const personalTransactions = useMemo(() => {
        const sharedAccountIds = new Set(accounts.filter(a => a.isShared).map(a => String(a._id)));
        return transactions.filter(t => {
            if (t.accountId && sharedAccountIds.has(String(t.accountId))) return false;
            if (t.linkedAccountId && sharedAccountIds.has(String(t.linkedAccountId))) return false;
            return true;
        });
    }, [transactions, accounts]);

    // 1. Calculate Ledger Book Stats & Trends
    // 1. Calculate Ledger Book Stats & Trends
    const ledgerStats = useMemo(() => {
        const groups = {}; // Current Balances
        const groupsLastMonth = {}; // Last Month Balances

        // --- Trend Calculation Helpers ---
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const endOfLastMonth = new Date(lastMonthYear, lastMonth + 1, 0);

        // 1. Initialize Groups with CONFIRMED Accounts (Type: Other)
        // This ensures main stats match the Ledger Book exactly.
        if (Array.isArray(personalAccounts)) {
            personalAccounts.forEach(acc => {
                if (acc.type === 'Other') {
                    groups[acc._id] = {
                        balance: acc.balance || 0, // This is the dynamic balance we calculated earlier
                        isAccount: true,
                        name: acc.name || 'Unknown' // Defensive check
                    };
                    // Initialize Last Month baseline if possible?
                    // No, we must calculate Last Month from transactions purely.
                    // But we can key by ID to match.
                    groupsLastMonth[acc._id] = 0;
                }
            });
        }

        // 2. Process Transactions (Logic: Add Legacy/Orphans to Current, Build Last Month for All)
        personalTransactions.forEach(t => {
            if ((t.scope || SCOPES.MANAGER) !== SCOPES.MANAGER) return;

            const name = (t.description || 'Unknown').trim();
            const key = name.toLowerCase();
            const amt = parseFloat(t.amount);
            const isCredit = t.type === TRANSACTION_TYPES.CREDIT;
            const signedAmt = isCredit ? amt : -amt;
            const tDate = new Date(t.date);

            // --- A. Current Balance Aggregation (For Legacy/Orphans ONLY) ---
            // If transaction is linked to a known Account, we ALREADY included it via personalAccounts iteration above.
            // CAUTION: The 'acc.balance' in personalAccounts is the CURRENT TOTAL.
            // We do NOT need to add t.amount to groups[accId].balance again.

            // FIX: If transaction has a linkedAccountId, it is a Transfer (Internal or to a Ledger).
            // 1. If to a Ledger (Other), that Ledger is in 'personalAccounts' and already calculated.
            // 2. If to a Bank/Card (Internal), it should NOT appear in Ledger Stats (Receivables/Payables).
            // Therefore, if linkedAccountId exists, we MUST skip it here to avoid treating it as an Orphan.
            if (t.linkedAccountId) return;

            // So we only look for ORPHANS here.
            let isLinked = false;

            // Check direct link (Account ID)
            if (t.accountId && groups[t.accountId]) {
                isLinked = true;
            }
            // Check name collision (Legacy acting as Account)
            else {
                // Defensive check for g.name
                const existingAccount = Object.values(groups).find(g => (g.name || '').toLowerCase() === key && g.isAccount);
                if (existingAccount) isLinked = true;
            }

            if (!isLinked) {
                // It's a true orphan/legacy transaction. Add to groups.
                if (!groups[key]) groups[key] = { balance: 0, isAccount: false };
                groups[key].balance += signedAmt;
            }

            // --- B. Last Month Snapshot Aggregation (For EVERYONE) ---
            // We must rebuild history for Accounts too, since we don't store "Balance at Date X" in DB.
            if (tDate <= endOfLastMonth) {
                // If linked to Account, add to that Account's Last Month Bucket
                if (t.accountId && groupsLastMonth[t.accountId] !== undefined) {
                    groupsLastMonth[t.accountId] += signedAmt;
                } else if (!t.accountId && isLinked) {
                    // Name collision link? Harder to map back to ID without search.
                    // But strictly speaking, if it's name collision, it SHOULD have been linked.
                    // Just try to find the account by name for Last Month stats?
                    // Optimization: Use a name-to-id map if needed. For now, we might miss legacy-to-account trends.
                    const acc = personalAccounts.find(a => a.name.toLowerCase() === key && a.type === 'Other');
                    if (acc) {
                        // Found the account this legacy tx belongs to
                        if (groupsLastMonth[acc._id] === undefined) groupsLastMonth[acc._id] = 0;
                        groupsLastMonth[acc._id] += signedAmt;
                    }
                } else if (!isLinked) {
                    // Orphan
                    if (!groupsLastMonth[key]) groupsLastMonth[key] = 0;
                    groupsLastMonth[key] += signedAmt;
                }
            }
        });

        // 3. Finalize Totals
        let netBalance = 0;
        let totalReceivables = 0;
        let totalPayables = 0;

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
    }, [personalTransactions, personalAccounts]);

    // 2. Calculate Account Stats (Bank/Cash/CC)
    const accountStats = useMemo(() => {
        let liquidFunds = 0;
        let ccDebt = 0;

        personalAccounts.forEach(acc => { // UPDATED: Use filtered accounts
            const bal = acc.balance || 0;
            if (['Bank', 'Cash'].includes(acc.type)) {
                liquidFunds += bal;
            } else if (acc.type === 'Credit Card') {
                if (bal < 0) {
                    ccDebt += Math.abs(bal);
                } else {
                    liquidFunds += bal;
                }
            }
        });

        return { liquidFunds, ccDebt };
    }, [personalAccounts]); // UPDATED dependency

    const handleAccountClick = (account) => {
        setSelectedAccount(account);
        setViewMode('account');
    };

    const handleBack = () => {
        setViewMode('list');
        setSelectedAccount(null);
    };

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
                    <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                    <p className="text-slate-400 text-sm">Overview of your financial health</p>
                </div>
            </div>

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
                    title="Payables (Holdings)"
                    amount={totalPayables}
                    icon={TrendingUp}
                    type="expense"
                    trend={ledgerStats.trends.payables}
                />
                <StatsCard
                    title="Receivables (Customers)"
                    amount={ledgerStats.totalReceivables}
                    icon={TrendingDown}
                    type="income"
                    trend={ledgerStats.trends.receivables}
                />
            </div>

            {/* Top Exposures (Who is holding money?) */}
            <TopExposures transactions={personalTransactions} accounts={personalAccounts} />

            {/* Live Transactions Feed */}
            <RecentActivity transactions={personalTransactions} accounts={accounts} />

            {/* Money Sources Section */}
            <AccountsSection onAccountClick={handleAccountClick} accounts={personalAccounts} />

            <CountrySelectionModal />
        </div>
    );
};

export default AccountManagerView;
