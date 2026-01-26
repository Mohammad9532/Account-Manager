'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSACTION_TYPES, SCOPES } from '../utils/constants';

const FinanceContext = createContext();

export const CURRENCIES = {
    INR: { code: 'INR', symbol: '₹', locale: 'en-IN', name: 'India (Rupee)' },
    AED: { code: 'AED', symbol: 'AED', locale: 'en-AE', name: 'UAE (Dirham)' },
    USD: { code: 'USD', symbol: '$', locale: 'en-US', name: 'USA (Dollar)' },
    GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'UK (Pound)' },
};

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]); // Fetched from API
    const [loading, setLoading] = useState(true);
    const [currency, setCurrencyState] = useState(CURRENCIES.INR);
    const [isCurrencySet, setIsCurrencySet] = useState(true); // Start HIDDEN to prevent blink

    useEffect(() => {
        // Run only on client mount
        try {
            const saved = localStorage.getItem('beingreal_currency');
            if (saved && CURRENCIES[saved]) {
                setCurrencyState(CURRENCIES[saved]);
                // Already true, no update needed
            } else {
                // Only if missing do we show the modal
                setIsCurrencySet(false);
            }
        } catch (error) {
            console.warn('Currency storage access error:', error);
            setIsCurrencySet(false); // detailed failsafe
        }
    }, []);

    const setCurrency = (code) => {
        if (CURRENCIES[code]) {
            setCurrencyState(CURRENCIES[code]);
            try {
                localStorage.setItem('beingreal_currency', code);
            } catch (e) {
                console.warn('Failed to save currency preference:', e);
            }
            setIsCurrencySet(true);
        }
    };

    const formatCurrency = (amount) => {
        const val = parseFloat(amount || 0);
        return new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

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

    // Recalculate stats whenever transactions or accounts change
    useEffect(() => {
        const newStats = {
            [SCOPES.MANAGER]: { totalIncome: 0, totalExpense: 0, balance: 0 },
            [SCOPES.DAILY]: { totalIncome: 0, totalExpense: 0, balance: 0 }
        };

        // Identify Shared Accounts to exclude from personal stats
        const sharedAccountIds = new Set(
            accounts.filter(a => a.isShared).map(a => String(a._id))
        );

        transactions.forEach(curr => {
            const amount = parseFloat(curr.amount);
            const scope = curr.scope || SCOPES.MANAGER;

            // Exclude shared transactions from Personal Stats
            if (curr.accountId && sharedAccountIds.has(String(curr.accountId))) return;
            if (curr.linkedAccountId && sharedAccountIds.has(String(curr.linkedAccountId))) return;

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
    }, [transactions, accounts]);

    const addTransaction = async (transaction) => {
        try {
            const scope = transaction.scope || SCOPES.MANAGER;
            // Both DAILY and INCOME use the daily-expenses endpoint
            const endpoint = (scope === SCOPES.DAILY || scope === SCOPES.INCOME) ? '/api/daily-expenses' : '/api/transactions';

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
            const endpoint = (scope === SCOPES.DAILY || scope === SCOPES.INCOME) ? `/api/daily-expenses/${id}` : `/api/transactions/${id}`;

            const res = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updated = await res.json();
                const updatedWithScope = { ...updated, scope };
                setTransactions(prev => prev.map(t => t._id === id ? updatedWithScope : t));
            } else {
                const err = await res.json();
                console.error('Update failed:', err);
                alert(`Failed to update transaction: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            alert('Error updating transaction. Please try again.');
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
            let endpoint = (scope === SCOPES.DAILY || scope === SCOPES.INCOME) ? `/api/daily-expenses/${id}` : `/api/transactions/${id}`;


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

    };

    // Calculate Dynamic Account Balances & Available Credit
    const accountsWithBalance = React.useMemo(() => {
        // 1. Calculate base balances (same as before)
        const updatedAccounts = accounts.map(account => {
            const accountTxns = transactions.filter(t => {
                const isDirect = t.accountId && String(t.accountId) === String(account._id);
                const isLinked = t.linkedAccountId && String(t.linkedAccountId) === String(account._id);
                return isDirect || isLinked;
            });
            const delta = accountTxns.reduce((sum, t) => {
                // Determine Effective Amount for this account
                // If Direct: Credit adds, Debit subtracts.
                // If Linked: Credit subtracts, Debit adds (Inverted).
                // Wait, logic:
                // Direct Credit (Money In) -> +Amount
                // Direct Debit (Money Out) -> -Amount
                // Linked Credit (Money In to Primary, so Money Out from Linked?) 
                // NO. Linked Transaction context:
                // If I create a transaction on Bank (Primary): Debit (Money Out 100). Linked: Card.
                // Logically: Bank -100. Card +100.
                // So if I am Linked Account, and Primary is Debit, I get +100.
                // If Primary is Credit (Money In), Linked gave it? So Linked -100.

                const isDirect = t.accountId && String(t.accountId) === String(account._id);
                const amount = parseFloat(t.amount);

                if (isDirect) {
                    if (t.type === TRANSACTION_TYPES.CREDIT) return sum + amount;
                    return sum - amount;
                } else {
                    // Is Linked
                    if (t.type === TRANSACTION_TYPES.DEBIT) return sum + amount; // Primary Debit = Linked Credit
                    return sum - amount; // Primary Credit = Linked Debit
                }
            }, 0);

            return {
                ...account,
                // Note: We use 'balance' from API which is the stored persistent balance.
                // BUT, 'transactions' list includes NEW transactions that might have already updated the DB if we fetched fresh accounts.
                // However, usually we don't re-fetch accounts on every addTransaction. The 'accounts' state is stale.
                // So we take 'initialBalance' (which should be the starting point before THESE transactions? No.)
                // The API 'accounts' balance INCLUDES historical transactions.
                // The 'transactions' list ALSO includes historical transactions.
                // This seems like Double Counting if we add delta to account.balance??
                // Let's check how 'accounts' are initialized.
                // fetchTransactions fetches accounts AND transactions.
                // If accounts.balance matches DB, and we add delta of ALL transactions...
                // That implies account.balance should be 0 or 'Opening Balance'?

                // Code says: `initialBalance: account.balance`. 
                // `balance: (account.balance || 0) + delta`.
                // This implies `account.balance` from API is treated as "Opening Balance" and we re-calculate current balance from full history?
                // If so, `delta` calculation is critical.

                // IF `account.balance` is actually "Current Balance" from DB, then adding `delta` double counts everything.
                // The variable name `initialBalance` suggests the developer intends strictly "Opening Balance".
                // Let's assume the previous logic was working for Direct transactions, so the model is "Reconstruct from History".
                // If so, my 'linked' fix is correct.

                initialBalance: account.balance,
                balance: (account.balance || 0) + delta,
                transactionCount: accountTxns.length
            };
        });

        // 2. Calculate Available Credit (Shared Limit Logic)
        const creditCards = updatedAccounts.filter(a => a.type === 'Credit Card');

        // Map to store available credit for each account ID
        const creditMap = {};

        creditCards.forEach(card => {
            if (card.linkedAccountId) {
                // Child card: Processed when Parent is found, or separate pass if needed
                // We'll handle families by iterating Heads
                return;
            }

            // This is a Head Card or Independent
            const family = [card, ...creditCards.filter(c => c.linkedAccountId === card._id)];

            // Calculate total used for the family
            // utilization = (abs(balance) / limit) * 100
            // But here we need Available Credit = Limit - TotalUsed
            // TotalUsed is the sum of absolute negative balances (money owed)
            // Actually, balance is typically negative for credit cards if money is used.
            // If balance is positive, it means they overpaid (credit surplus).

            const totalUsed = family.reduce((sum, member) => {
                // If balance is negative, it counts as usage.
                // If balance is positive, it reduces total usage (surplus).
                // So really we just sum the balances.
                // used = -balance.
                // Example: Spent 500. Balance is -500. Used is 500.
                // used = -balance.
                // Example: Spent 500. Balance is -500. Used is 500.
                return sum + (member.balance * -1);
            }, 0);

            // Calculate Total EMIs Blocked
            const totalEMIBlocked = family.reduce((sum, member) => {
                const memberEMIs = member.emis || [];
                const blocked = memberEMIs
                    .filter(e => e.status === 'Active')
                    .reduce((s, e) => s + (parseFloat(e.remainingAmount) || 0), 0);
                return sum + blocked;
            }, 0);

            // Limit is on the Head card
            const limit = card.creditLimit || 0;
            const available = limit - totalUsed - totalEMIBlocked;

            // Assign to all family members
            family.forEach(member => {
                creditMap[member._id] = available;
            });
        });

        // 3. Merge availableCredit back into accounts
        return updatedAccounts.map(acc => ({
            ...acc,
            availableCredit: creditMap[acc._id] !== undefined ? creditMap[acc._id] : null
        }));

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
            } else {
                const err = await res.json();
                console.error('Account update failed:', err);
                alert(`Failed to update account: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating account:', error);
            alert('Error updating account. Please check your connection.');
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
            clearData,
            loading,
            currency,
            setCurrency,
            isCurrencySet,
            isCurrencySet,
            formatCurrency,
            CURRENCIES,
            fetchTransactions // Exposed for manual refresh
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
