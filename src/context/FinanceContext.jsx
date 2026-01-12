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
            const res = await fetch('/api/transactions');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            console.log(`[FinanceContext] Fetched ${data.length} transactions`);

            // Sort by Date Descending (Newest First)
            data.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                if (dateB !== dateA) return dateB - dateA;
                // Tie-breaker: Newest ID first
                return (b._id || '').localeCompare(a._id || '');
            });
            setTransactions(data);
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
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction)
            });
            if (res.ok) {
                const saved = await res.json();
                setTransactions(prev => [saved, ...prev]);
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
        }
    };

    const updateTransaction = async (id, data) => {
        try {
            const res = await fetch(`/api/transactions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updated = await res.json();
                setTransactions(prev => prev.map(t => t._id === id ? updated : t));
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
        }
    };

    const deleteTransaction = async (id) => {
        try {
            await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
            setTransactions(prev => prev.filter(t => t._id !== id)); // Mongo uses _id
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    const bulkAddTransactions = async (newTransactions) => {
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTransactions)
            });

            if (res.ok) {
                const savedTransactions = await res.json();

                // Sort the new transactions to match our UI expectations before merging
                const sortedNew = [...savedTransactions].sort((a, b) => {
                    const dateDiff = new Date(b.date) - new Date(a.date);
                    if (dateDiff !== 0) return dateDiff;
                    return (b._id || '').localeCompare(a._id || '');
                });

                setTransactions(prev => {
                    const merged = [...sortedNew, ...prev];
                    // Final safety sort
                    return merged.sort((a, b) => {
                        const dateDiff = new Date(b.date) - new Date(a.date);
                        if (dateDiff !== 0) return dateDiff;
                        return (b._id || '').localeCompare(a._id || '');
                    });
                });
            } else {
                console.error('Failed to bulk add transactions');
            }
        } catch (error) {
            console.error('Error bulk adding transactions:', error);
        }
    };

    const bulkDeleteTransactions = async (ids) => {
        try {
            await Promise.all(ids.map(id =>
                fetch(`/api/transactions/${id}`, { method: 'DELETE' })
            ));
            setTransactions(prev => prev.filter(t => !ids.includes(t._id)));
        } catch (error) {
            console.error('Error bulk deleting transactions:', error);
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
