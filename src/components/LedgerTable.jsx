'use client';

import React, { useState, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { SCOPES, TRANSACTION_TYPES } from '../utils/constants';

const LedgerTable = ({ limit, scope = SCOPES.MANAGER, onRowClick, accountsOverride, includeLegacy = true }) => {
    const { transactions, accounts: contextAccounts, loading } = useFinance(); // Fetch accounts too

    // Group transactions by Description (Particulars) or Account
    const aggregatedLedger = useMemo(() => {
        const groups = {};
        if (loading) return [];

        // Allow overriding accounts list (e.g. for Shared Tab)
        const sourceAccounts = accountsOverride || contextAccounts;

        const safeTransactions = Array.isArray(transactions) ? transactions : [];

        // 1. Process Accounts (Type: Other) - These are the new "Ledgers"
        const validAccounts = Array.isArray(sourceAccounts) ? sourceAccounts.filter(a => a && a.type === 'Other') : [];
        validAccounts.forEach(acc => {
            const key = acc.name.toLowerCase();
            groups[key] = {
                id: acc._id, // Real Account ID
                name: acc.name,
                // Calculate balance dynamically from transactions to be always up to date
                netBalance: safeTransactions.reduce((sum, t) => {
                    if (!t) return sum;
                    const tAccountId = t.accountId ? String(t.accountId) : null;
                    const tLinkedId = t.linkedAccountId ? String(t.linkedAccountId) : null;
                    const accId = String(acc._id);

                    if (tAccountId === accId || tLinkedId === accId) {
                        const amount = parseFloat(t.amount);
                        return t.type === TRANSACTION_TYPES.CREDIT ? sum + amount : sum - amount;
                    }
                    return sum;
                }, 0), // Match LedgerDetailView stats logic (pure transaction sum)
                lastDate: acc.updatedAt || new Date().toISOString(),
                count: acc.transactionCount || 0,
                isAccount: true
            };
        });

        // 2. Process Transactions (Legacy Ledgers & New Transactions not yet linked?? No, new ones are linked)
        // We iterate transactions to:
        // a) Create entries for Legacy Ledgers (description-based)
        // b) Update lastDate for Account Ledgers

        if (includeLegacy) {
            safeTransactions.forEach(t => {
                // Filter by scope
                if ((t.scope || SCOPES.MANAGER) !== scope) return;

                // If this transaction belongs to an Account (Other), we already summed it above.
                // Just need to update lastDate.
                if (t.accountId) {
                    // Find if we have a group for this account
                    // Warning: We keyed by name. If multiple accounts have same name?? Rare.
                    // Better to key by ID if isAccount, but legacy is by Name. 
                    // Let's stick to Name key for mixing. 
                    // Wait, if t.accountId is set, we identify the account.
                    // We shouldn't rely on 'description' for these transactions.

                    // Optimization: The loop above (1) handled summation.
                    // Here we just want to update metadata or handle Legacy transactions.

                    // Find account group by checking validAccounts
                    const acc = validAccounts.find(a => a._id === t.accountId);
                    if (acc) {
                        const key = acc.name.toLowerCase();
                        if (groups[key]) {
                            if (new Date(t.date) > new Date(groups[key].lastDate)) {
                                groups[key].lastDate = t.date;
                            }
                            // We already summed the balance above.
                        }
                        return; // Skip legacy logic for this transaction
                    }
                }

                // Legacy Logic: No accountId or accountId not in 'Other' list (e.g. Bank tx)
                // But if it's Bank tx, we don't show it here unless it's a Manager entry.
                // LedgerTable shows "Manager" entries.

                // If it has accountId (e.g. Bank), we don't want to show "Bank" as a ledger here.
                // So we only process if !t.accountId OR t.accountId refers to something not in validAccounts?
                // "Ledgers" view usually shows Virtual Ledgers or 'Other' Accounts.
                // If I pay from Bank (accountId=BankID), does it appear here? 
                // In legacy, we tracked `description`. 

                if (t.accountId) return; // Skip non-legacy account transactions

                const name = (t.description || 'Unknown').trim();
                const key = name.toLowerCase();

                if (!groups[key]) {
                    groups[key] = {
                        name,
                        netBalance: 0,
                        lastDate: t.date,
                        count: 0,
                        isAccount: false
                    };
                }

                if (groups[key].isAccount) {
                    // Name collision with an account, but no accountId. 
                    // Treat as part of that account? verify? 
                    // For safety to avoid double counting if logic changes, we skip or sum?
                    // Current legacy: Sum it.
                } else {
                    const amount = parseFloat(t.amount);
                    if (t.type === TRANSACTION_TYPES.CREDIT) {
                        groups[key].netBalance += amount;
                    } else {
                        groups[key].netBalance -= amount;
                    }
                    if (new Date(t.date) > new Date(groups[key].lastDate)) {
                        groups[key].lastDate = t.date;
                    }
                }
            });
        }

        const result = Object.values(groups).sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
        return limit ? result.slice(0, limit) : result;

    }, [transactions, accounts, scope, limit]);

    if (loading) {
        return (
            <div className="flex justify-center p-8 text-slate-500">
                Loading Ledger...
            </div>
        );
    }

    if (aggregatedLedger.length === 0) {
        return (
            <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                No active ledgers found.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-xl">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-900/80 text-slate-400 text-xs md:text-sm uppercase tracking-wider">
                        <th className="p-3 md:p-4 border-b border-slate-800 w-12 md:w-16 text-center hidden md:table-cell">S.No</th>
                        <th className="p-3 md:p-4 border-b border-slate-800">Particulars</th>
                        <th className="p-3 md:p-4 border-b border-slate-800 text-right text-emerald-500 text-xs md:text-sm">Credit</th>
                        <th className="p-3 md:p-4 border-b border-slate-800 text-right text-rose-500 text-xs md:text-sm">Debit</th>
                        <th className="p-3 md:p-4 border-b border-slate-800 w-10 text-center"></th>
                    </tr>
                </thead>
                <tbody className="bg-slate-900/30 divide-y divide-slate-800/50">
                    {aggregatedLedger.map((row, index) => {
                        const isCredit = row.netBalance >= 0;
                        const absBalance = Math.abs(row.netBalance);

                        // Reconstruct a transaction-like object for the click handler
                        const mockTransaction = row.isAccount
                            ? { description: row.name, accountId: row.id, _id: row.id } // Pass accountId if it's an account
                            : { description: row.name };

                        return (
                            <tr key={index} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => onRowClick && onRowClick(mockTransaction)}>
                                <td className="p-3 md:p-4 text-center text-slate-500 font-mono text-xs md:text-sm hidden md:table-cell">
                                    {index + 1}
                                </td>
                                <td className="p-3 md:p-4 max-w-[120px] md:max-w-none">
                                    <div className="font-medium text-slate-200 hover:text-blue-400 text-sm md:text-lg truncate">
                                        {row.name}
                                    </div>
                                    <div className="text-[10px] md:text-xs text-slate-500">
                                        {new Date(row.lastDate).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="p-3 md:p-4 text-right font-mono font-bold text-emerald-400 text-sm md:text-lg whitespace-nowrap">
                                    {isCredit && absBalance > 0 ? `₹${absBalance.toLocaleString()}` : '-'}
                                </td>
                                <td className="p-3 md:p-4 text-right font-mono font-bold text-rose-400 text-sm md:text-lg whitespace-nowrap">
                                    {!isCredit && absBalance > 0 ? `₹${absBalance.toLocaleString()}` : '-'}
                                </td>
                                <td className="p-3 md:p-4 text-center text-slate-600">
                                    <ArrowRight className="w-4 h-4 md:opacity-0 group-hover:opacity-100 transition-opacity" />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default LedgerTable;
