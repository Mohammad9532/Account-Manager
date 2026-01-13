'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSACTION_TYPES, SCOPES } from '../utils/constants';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]); // Fetched from API
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

            // Fetch Accounts
            const accountsRes = await fetch('/api/accounts', { cache: 'no-store' });
            const accountsData = accountsRes.ok ? await accountsRes.json() : [];
            setAccounts(accountsData);

            // Combine
            const allData = [...ledgers, ...dailies];

            // Sort by Date Descending (Newest First)
            allData.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                if (dateB !== dateA) return dateB - dateA;
                return (b._id || '').localeCompare(a._id || '');
            });
            setTransactions(allData);
        } catch (error) {
            console.error('Error fetching data:', error);
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

    const deleteTransaction = async (id, passedScope = null) => {
        // Optimistic Update: Remove immediately
        const previousTransactions = [...transactions];

        // Find transaction to determine scope if not passed
        const current = transactions.find(t => String(t._id) === String(id));

        // Robust Scope Determination: Passed > Found > Default
        const scope = passedScope || current?.scope || SCOPES.MANAGER;

        setTransactions(prev => prev.filter(t => String(t._id) !== String(id)));

        try {
            let endpoint = scope === SCOPES.DAILY ? `/api/daily-expenses/${id}` : `/api/transactions/${id}`;
            console.log(`[FinanceContext] Deleting ${id} via ${endpoint}. verifiedScope: ${!!passedScope || !!current?.scope}`);

            let res = await fetch(endpoint, { method: 'DELETE' });

            // Fallback: If 404, try the other scope regardless of what we thought it was
            if (res.status === 404) {
                const altEndpoint = endpoint.includes('daily-expenses') ? `/api/transactions/${id}` : `/api/daily-expenses/${id}`;
                console.warn(`[FinanceContext] 404 on ${endpoint}, trying fallback ${altEndpoint}`);
                res = await fetch(altEndpoint, { method: 'DELETE' });
            }

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || `Failed to delete from ${endpoint}`);
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
                const t = previousTransactions.find(tx => String(tx._id) === String(id));
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

    const createAccount = async (accountData) => {
        try {
            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(accountData)
            });
            if (res.ok) {
                const newAccount = await res.json();
                setAccounts(prev => [...prev, newAccount]);
                return newAccount;
            }
        } catch (error) {
            console.error('Error creating account:', error);
        }
    };

    const getStatsByScope = (scope) => stats[scope] || stats[SCOPES.MANAGER];

    const clearData = () => {
        // Placeholder for future implementation or safety check
        console.log('Clear Data triggered - currently restricted.');
    };

    // Calculate Dynamic Account Balances
    const accountsWithBalance = React.useMemo(() => {
        return accounts.map(account => {
            const accountTxns = transactions.filter(t => {
                // Use String comparison to handle ObjectId vs String mismatch
                const match = t.accountId && String(t.accountId) === String(account._id);
                return match;
            });
            const delta = accountTxns.reduce((sum, t) => {
                if (t.type === TRANSACTION_TYPES.CREDIT) return sum + parseFloat(t.amount);
                return sum - parseFloat(t.amount);
            }, 0);

            return {
                ...account,
                initialBalance: account.balance, // Keep original initial balance ref
                balance: (account.balance || 0) + delta, // Overwrite with live balance
                transactionCount: accountTxns.length
            };
        });
    }, [accounts, transactions]);

    const deleteAccount = async (id) => {
        try {
            const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setAccounts(prev => prev.filter(a => a._id !== id));
                return true;
            } else {
                const err = await res.json();
                alert(err.error || "Failed to delete account");
                return false;
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert("Error deleting account. Please try again.");
            return false;
        }
    };

    const updateAccount = async (id, data) => {
        try {
            const res = await fetch(`/api/accounts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updated = await res.json();
                setAccounts(prev => prev.map(a => a._id === id ? updated : a));
            }
        } catch (error) {
            console.error('Error updating account:', error);
        }
    };

    return (
        <FinanceContext.Provider value={{
            transactions,
            accounts: accountsWithBalance,
            stats: getStatsByScope,
            addTransaction,
            updateTransaction,
            bulkAddTransactions,
            deleteTransaction,
            bulkDeleteTransactions,
            createAccount,
            updateAccount,
            deleteAccount,
            clearData,
            loading
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
