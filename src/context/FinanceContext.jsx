'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSACTION_TYPES, SCOPES } from '../utils/constants';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial stats structure
    const [stats, setStats] = useState({
        [SCOPES.MANAGER]: { totalIncome: 0, totalExpense: 0, balance: 0 },
        [SCOPES.DAILY]: { totalIncome: 0, totalExpense: 0, balance: 0 }
    });

    // Fetch from API
    const fetchTransactions = async () => {
        try {
            // Fetch Ledgers
            const ledgersRes = await fetch('/api/transactions', { cache: 'no-store' });
            const ledgersData = ledgersRes.ok ? await ledgersRes.json() : [];
            const ledgers = Array.isArray(ledgersData) ? ledgersData.map(t => ({ ...t, scope: t.scope || SCOPES.MANAGER })) : [];

            // Fetch Daily Expenses
            const dailyRes = await fetch('/api/daily-expenses', { cache: 'no-store' });
            const dailyData = dailyRes.ok ? await dailyRes.json() : [];
            const dailies = Array.isArray(dailyData) ? dailyData.map(t => ({ ...t, scope: SCOPES.DAILY })) : [];

            // Combine
            const allData = [...ledgers, ...dailies];
            // console.log(`[FinanceContext] Fetched ${ledgers.length} ledger items and ${dailies.length} daily items.`);

            // Sort by Date Descending (Newest First)
            allData.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                if (dateB !== dateA) return dateB - dateA;
                return (b._id || '').localeCompare(a._id || '');
            });
            setTransactions(allData);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // Recalculate stats whenever transactions change
    useEffect(() => {
        const newStats = {
            [SCOPES.MANAGER]: { totalIncome: 0, totalExpense: 0, balance: 0 },
            [SCOPES.DAILY]: { totalIncome: 0, totalExpense: 0, balance: 0 }
        };

        transactions.forEach(curr => {
            const amount = parseFloat(curr.amount);
            const scope = curr.scope || SCOPES.MANAGER;

            if (!newStats[scope]) newStats[scope] = { totalIncome: 0, totalExpense: 0, balance: 0 };

            if (curr.type === TRANSACTION_TYPES.CREDIT) {
                newStats[scope].totalIncome += amount;
                newStats[scope].balance += amount;
            } else {
                newStats[scope].totalExpense += amount;
                newStats[scope].balance -= amount;
            }
        });

        setStats(newStats);
    }, [transactions]);

    const addTransaction = async (transaction) => {
        try {
            const scope = transaction.scope || SCOPES.MANAGER;
            const endpoint = scope === SCOPES.DAILY ? '/api/daily-expenses' : '/api/transactions';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction)
            });
            if (res.ok) {
                const saved = await res.json();
                const savedWithScope = { ...saved, scope };
                setTransactions(prev => [savedWithScope, ...prev]);
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
        }
    };

    const updateTransaction = async (id, data) => {
        try {
            const current = transactions.find(t => t._id === id);
            const scope = current?.scope || data.scope || SCOPES.MANAGER;
            // Note: PUT needs to be implemented in daily-expenses route for full editing support
            const endpoint = scope === SCOPES.DAILY ? `/api/daily-expenses/${id}` : `/api/transactions/${id}`;

            const res = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updated = await res.json();
                const updatedWithScope = { ...updated, scope };
                setTransactions(prev => prev.map(t => t._id === id ? updatedWithScope : t));
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
        }
    };

    const deleteTransaction = async (id) => {
        // Optimistic Update: Remove immediately
        const previousTransactions = [...transactions];
        const current = transactions.find(t => t._id === id);
        setTransactions(prev => prev.filter(t => t._id !== id));

        try {
            const scope = current?.scope || SCOPES.MANAGER;
            const endpoint = scope === SCOPES.DAILY ? `/api/daily-expenses/${id}` : `/api/transactions/${id}`;

            const res = await fetch(endpoint, { method: 'DELETE' });

            if (!res.ok) {
                // Rollback if failed
                throw new Error('Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            // Revert state
            setTransactions(previousTransactions);
            alert("Failed to delete transaction. Please try again.");
        }
    };

    const bulkAddTransactions = async (newTransactions) => {
        // Bulk add is primarily for Manager Scope (Ledgers)
        try {
            const ledgers = newTransactions.filter(t => (t.scope || SCOPES.MANAGER) === SCOPES.MANAGER);

            if (ledgers.length > 0) {
                const res = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ledgers)
                });

                if (res.ok) {
                    const saved = await res.json();
                    const savedArray = Array.isArray(saved) ? saved : [saved];
                    const savedWithScope = savedArray.map(t => ({ ...t, scope: SCOPES.MANAGER }));

                    setTransactions(prev => {
                        const merged = [...savedWithScope, ...prev];
                        return merged.sort((a, b) => new Date(b.date) - new Date(a.date));
                    });
                }
            }
        } catch (error) {
            console.error('Error bulk adding transactions:', error);
        }
    };

    const bulkDeleteTransactions = async (ids) => {
        // Optimistic Update
        const previousTransactions = [...transactions];
        setTransactions(prev => prev.filter(t => !ids.includes(t._id)));

        try {
            // Split IDs by Scope because they are in different collections
            const ledgerIds = [];
            const dailyIds = [];

            ids.forEach(id => {
                const t = previousTransactions.find(tx => tx._id === id);
                const scope = t?.scope || SCOPES.MANAGER;
                if (scope === SCOPES.DAILY) {
                    dailyIds.push(id);
                } else {
                    ledgerIds.push(id);
                }
            });

            const promises = [];

            if (ledgerIds.length > 0) {
                promises.push(
                    fetch('/api/transactions/bulk-delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: ledgerIds })
                    })
                );
            }

            if (dailyIds.length > 0) {
                promises.push(
                    fetch('/api/daily-expenses/bulk-delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: dailyIds })
                    })
                );
            }

            const results = await Promise.all(promises);

            // Check if any failed
            const failed = results.some(res => !res.ok);
            if (failed) {
                throw new Error('One or more bulk delete requests failed');
            }

        } catch (error) {
            console.error('Error bulk deleting:', error);
            // Revert
            setTransactions(previousTransactions);
            console.warn("One or more items failed to delete.");
            alert("Failed to delete items. Please refresh and try again.");
        }
    };

    const getStatsByScope = (scope) => stats[scope] || stats[SCOPES.MANAGER];

    const clearData = () => {
        // Placeholder for future implementation or safety check
        console.log('Clear Data triggered - currently restricted.');
    };

    return (
        <FinanceContext.Provider value={{
            transactions,
            stats: getStatsByScope,
            addTransaction,
            updateTransaction,
            bulkAddTransactions,
            deleteTransaction,
            bulkDeleteTransactions,
            clearData,
            loading
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
