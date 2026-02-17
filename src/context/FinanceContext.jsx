"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { TRANSACTION_TYPES, SCOPES } from "../utils/constants";

const FinanceContext = createContext();

export const CURRENCIES = {
    INR: { code: "INR", symbol: "₹", locale: "en-IN", name: "India (Rupee)" },
    AED: { code: "AED", symbol: "AED", locale: "en-AE", name: "UAE (Dirham)" },
    USD: { code: "USD", symbol: "$", locale: "en-US", name: "USA (Dollar)" },
    GBP: { code: "GBP", symbol: "£", locale: "en-GB", name: "UK (Pound)" },
};

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]); // Fetched from API
    const [loading, setLoading] = useState(true);
    const [currency, setCurrencyState] = useState(CURRENCIES.INR);
    const [isCurrencySet, setIsCurrencySet] = useState(true); // Start HIDDEN to prevent blink
    const [theme, setThemeState] = useState("dark"); // Default to dark

    useEffect(() => {
        // Run only on client mount
        try {
            // Theme setup
            const savedTheme = localStorage.getItem("beingreal_theme") || "dark";
            setThemeState(savedTheme);
            if (savedTheme === "dark") {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }

            // Currency setup
            const saved = localStorage.getItem("beingreal_currency");
            if (saved && CURRENCIES[saved]) {
                setCurrencyState(CURRENCIES[saved]);
                // Already true, no update needed
            } else {
                // Only if missing do we show the modal
                setIsCurrencySet(false);
            }
        } catch (error) {
            console.warn("Storage access error:", error);
            setIsCurrencySet(false); // detailed failsafe
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setThemeState(newTheme);
        localStorage.setItem("beingreal_theme", newTheme);
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    const setCurrency = (code) => {
        if (CURRENCIES[code]) {
            setCurrencyState(CURRENCIES[code]);
            try {
                localStorage.setItem("beingreal_currency", code);
            } catch (e) {
                console.warn("Failed to save currency preference:", e);
            }
            setIsCurrencySet(true);
        }
    };

    const formatCurrency = (amount) => {
        // Convert cents back to float/decimal for display
        const val = parseFloat(amount || 0) / 100;
        return new Intl.NumberFormat(currency.locale, {
            style: "currency",
            currency: currency.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    };

    // Initial stats structure
    const [stats, setStats] = useState({
        [SCOPES.MANAGER]: { totalIncome: 0, totalExpense: 0, balance: 0 },
        [SCOPES.DAILY]: { totalIncome: 0, totalExpense: 0, balance: 0 },
    });

    // Fetch just accounts
    const fetchAccounts = async () => {
        try {
            const accountsRes = await fetch("/api/accounts", {
                cache: "no-store",
            });
            const accountsData = accountsRes.ok ? await accountsRes.json() : [];
            setAccounts(accountsData);
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    };

    // Fetch from API
    const fetchTransactions = async () => {
        try {
            const start = Date.now();
            setLoading(true);

            const res = await fetch("/api/hydrate", { cache: "no-store" });
            if (!res.ok) throw new Error("Hydration failed");

            const data = await res.json();

            // 1. Process Accounts
            setAccounts(data.accounts || []);

            // 2. Process Transactions (Apply scope mapping)
            const ledgers = (data.transactions || []).map((t) => ({
                ...t,
                scope: t.scope || SCOPES.MANAGER,
            }));
            const dailies = (data.dailyExpenses || []).map((t) => ({
                ...t,
                scope: SCOPES.DAILY,
            }));

            // 3. Combine and Sort (Newest First)
            const allData = [...ledgers, ...dailies].sort((a, b) => {
                return (
                    new Date(b.date) - new Date(a.date) ||
                    (b._id || "").localeCompare(a._id || "")
                );
            });

            setTransactions(allData);
            console.log(`[FinanceContext] Hydrated in ${Date.now() - start}ms`);
        } catch (error) {
            console.error("Error fetching data:", error);
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
            [SCOPES.DAILY]: { totalIncome: 0, totalExpense: 0, balance: 0 },
        };

        // Identify Shared Accounts to exclude from personal stats
        const sharedAccountIds = new Set(
            accounts.filter((a) => a.isShared).map((a) => String(a._id)),
        );

        transactions.forEach((curr) => {
            // Note: curr.amount is now an INTEGER (cents)
            const amount = parseFloat(curr.amount);
            const scope = curr.scope || SCOPES.MANAGER;

            // Exclude shared transactions from Personal Stats
            if (curr.accountId && sharedAccountIds.has(String(curr.accountId)))
                return;
            if (
                curr.linkedAccountId &&
                sharedAccountIds.has(String(curr.linkedAccountId))
            )
                return;

            if (!newStats[scope])
                newStats[scope] = {
                    totalIncome: 0,
                    totalExpense: 0,
                    balance: 0,
                };

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
        const previousTransactions = [...transactions];
        const previousAccounts = [...accounts];

        try {
            const scope = transaction.scope || SCOPES.MANAGER;
            const endpoint =
                scope === SCOPES.DAILY || scope === SCOPES.INCOME
                    ? "/api/daily-expenses"
                    : "/api/transactions";

            // Optimistic Update
            const tempId = "temp-" + Date.now();
            const optimisticTx = {
                ...transaction,
                amount: Math.round(parseFloat(transaction.amount) * 100),
                _id: tempId,
                date: transaction.date || new Date().toISOString(),
            };
            setTransactions((prev) => [optimisticTx, ...prev]);

            // Optimistic Account Balance Update
            const impact =
                (transaction.type === "Money In" ? 1 : -1) *
                Math.round(parseFloat(transaction.amount) * 100);
            if (transaction.accountId) {
                setAccounts((prev) =>
                    prev.map((a) =>
                        a._id === transaction.accountId
                            ? { ...a, balance: (a.balance || 0) + impact }
                            : a,
                    ),
                );
            }

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transaction),
            });

            if (res.ok) {
                const saved = await res.json();
                setTransactions((prev) =>
                    prev.map((t) =>
                        t._id === tempId ? { ...saved, scope } : t,
                    ),
                );
                fetchAccounts(); // Final sync
            } else {
                throw new Error("Failed to add transaction");
            }
        } catch (error) {
            console.error("Error adding transaction:", error);
            setTransactions(previousTransactions);
            setAccounts(previousAccounts);
            throw error; // Re-throw so the caller knows it failed
        }
    };

    const updateTransaction = async (id, data) => {
        const previousTransactions = [...transactions];
        const previousAccounts = [...accounts];

        try {
            const current = transactions.find((t) => t._id === id);
            const scope = current?.scope || data.scope || SCOPES.MANAGER;
            const endpoint =
                scope === SCOPES.DAILY || scope === SCOPES.INCOME
                    ? `/api/daily-expenses/${id}`
                    : `/api/transactions/${id}`;

            // Optimistic Update
            const updatedData = { ...data };
            if (data.amount !== undefined) {
                updatedData.amount = Math.round(parseFloat(data.amount) * 100);
            }

            setTransactions((prev) =>
                prev.map((t) => (t._id === id ? { ...t, ...updatedData } : t)),
            );

            // Optimistic Account Balance Adjustment
            if (current && current.accountId) {
                // current.amount is an integer from DB
                const oldImpact =
                    (current.type === "Money In" ? 1 : -1) *
                    parseFloat(current.amount);

                // data.amount is a float from user input
                const newAmount =
                    data.amount !== undefined
                        ? Math.round(parseFloat(data.amount) * 100)
                        : current.amount;
                const newType = data.type || current.type;
                const newImpact = (newType === "Money In" ? 1 : -1) * newAmount;
                const diff = newImpact - oldImpact;

                setAccounts((prev) =>
                    prev.map((a) =>
                        a._id === current.accountId
                            ? { ...a, balance: (a.balance || 0) + diff }
                            : a,
                    ),
                );
            }

            const res = await fetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const updated = await res.json();
                setTransactions((prev) =>
                    prev.map((t) => (t._id === id ? { ...updated, scope } : t)),
                );
                fetchAccounts();
            } else {
                throw new Error("Update failed");
            }
        } catch (error) {
            console.error("Error updating transaction:", error);
            setTransactions(previousTransactions);
            setAccounts(previousAccounts);
            throw error; // Re-throw so the caller knows it failed
        }
    };

    const deleteTransaction = async (id, passedScope = null) => {
        const previousTransactions = [...transactions];
        const previousAccounts = [...accounts];

        const current = transactions.find((t) => String(t._id) === String(id));
        const scope = passedScope || current?.scope || SCOPES.MANAGER;

        // Optimistic Update
        setTransactions((prev) =>
            prev.filter((t) => String(t._id) !== String(id)),
        );
        if (current && current.accountId) {
            // current.amount is already an integer
            const impact =
                (current.type === "Money In" ? 1 : -1) *
                parseFloat(current.amount);
            setAccounts((prev) =>
                prev.map((a) =>
                    a._id === current.accountId
                        ? { ...a, balance: (a.balance || 0) - impact }
                        : a,
                ),
            );
        }

        try {
            let endpoint =
                scope === SCOPES.DAILY || scope === SCOPES.INCOME
                    ? `/api/daily-expenses/${id}`
                    : `/api/transactions/${id}`;
            let res = await fetch(endpoint, { method: "DELETE" });

            if (res.status === 404) {
                const altEndpoint = endpoint.includes("daily-expenses")
                    ? `/api/transactions/${id}`
                    : `/api/daily-expenses/${id}`;
                res = await fetch(altEndpoint, { method: "DELETE" });
            }

            if (!res.ok) throw new Error("Delete failed");
            fetchAccounts();
            toast.success("Transaction deleted successfully");
        } catch (error) {
            console.error("Error deleting transaction:", error);
            setTransactions(previousTransactions);
            setAccounts(previousAccounts);
            toast.error("Failed to delete transaction.");
        }
    };

    const bulkAddTransactions = async (newTransactions) => {
        try {
            const ledgers = newTransactions.filter(
                (t) => (t.scope || SCOPES.MANAGER) === SCOPES.MANAGER,
            );
            const dailies = newTransactions.filter(
                (t) => t.scope === SCOPES.DAILY || t.scope === SCOPES.INCOME,
            );

            const promises = [];

            if (ledgers.length > 0) {
                promises.push(
                    fetch("/api/transactions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(ledgers),
                    }).then((res) =>
                        res.ok
                            ? res.json()
                            : Promise.reject("Ledger bulk failed"),
                    ),
                );
            }

            if (dailies.length > 0) {
                promises.push(
                    fetch("/api/daily-expenses", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(dailies),
                    }).then((res) =>
                        res.ok
                            ? res.json()
                            : Promise.reject("Daily bulk failed"),
                    ),
                );
            }

            if (promises.length > 0) {
                const results = await Promise.all(promises);
                const savedItems = results.flat();

                setTransactions((prev) => {
                    const merged = [...savedItems, ...prev];
                    return merged.sort(
                        (a, b) => new Date(b.date) - new Date(a.date),
                    );
                });

                // Refresh accounts
                fetchAccounts();
                toast.success(
                    `Successfully imported ${newTransactions.length} transactions`,
                );
            }
        } catch (error) {
            console.error("Error bulk adding transactions:", error);
            toast.error(
                "Some items failed to import. Please check your data and try again.",
            );
        }
    };

    const bulkDeleteTransactions = async (ids) => {
        // Optimistic Update
        const previousTransactions = [...transactions];
        setTransactions((prev) => prev.filter((t) => !ids.includes(t._id)));

        try {
            // Split IDs by Scope because they are in different collections
            const ledgerIds = [];
            const dailyIds = [];

            ids.forEach((id) => {
                const t = previousTransactions.find(
                    (tx) => String(tx._id) === String(id),
                );
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
                    fetch("/api/transactions/bulk-delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids: ledgerIds }),
                    }),
                );
            }

            if (dailyIds.length > 0) {
                promises.push(
                    fetch("/api/daily-expenses/bulk-delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids: dailyIds }),
                    }),
                );
            }

            const results = await Promise.all(promises);

            // Check if any failed
            const failed = results.some((res) => !res.ok);
            if (failed) {
                throw new Error("One or more bulk delete requests failed");
            }
            toast.success("Transactions deleted successfully");
        } catch (error) {
            console.error("Error bulk deleting:", error);
            // Revert
            setTransactions(previousTransactions);
            console.warn("One or more items failed to delete.");
            toast.error(
                "Failed to delete items. Please refresh and try again.",
            );
        }
    };

    const createAccount = async (accountData) => {
        try {
            const res = await fetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(accountData),
            });
            if (res.ok) {
                const newAccount = await res.json();
                setAccounts((prev) => [...prev, newAccount]);
                toast.success("Account created successfully");
                return newAccount;
            } else {
                throw new Error("Failed to create account");
            }
        } catch (error) {
            console.error("Error creating account:", error);
            toast.error("Failed to create account");
            throw error;
        }
    };

    const getStatsByScope = (scope) => stats[scope] || stats[SCOPES.MANAGER];

    const clearData = () => {
        // Placeholder for future implementation or safety check
    };

    // Calculate Dynamic Account Balances (Lightweight now)
    const accountsWithBalance = React.useMemo(() => {
        return accounts.map((account) => {
            const accId = String(account._id);

            // Still show transaction count & last date for the detail view context
            const accTxs = transactions.filter(
                (t) =>
                    String(t.accountId) === accId ||
                    String(t.linkedAccountId) === accId,
            );

            const lastTxDate =
                accTxs.length > 0
                    ? accTxs.reduce(
                        (latest, t) =>
                            new Date(t.date) > new Date(latest)
                                ? t.date
                                : latest,
                        accTxs[0].date,
                    )
                    : account.updatedAt || new Date().toISOString();

            return {
                ...account,
                transactionCount: accTxs.length,
                lastTransactionDate: lastTxDate,
                availableCredit: account.creditLimit
                    ? account.creditLimit + account.balance
                    : null,
            };
        });
    }, [accounts, transactions]);

    const deleteAccount = async (id) => {
        try {
            const res = await fetch(`/api/accounts/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setAccounts((prev) => prev.filter((a) => a._id !== id));
                toast.success("Account deleted successfully");
                return true;
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to delete account");
                return false;
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            toast.error("Error deleting account. Please try again.");
            return false;
        }
    };

    const updateAccount = async (id, data) => {
        try {
            const res = await fetch(`/api/accounts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const updated = await res.json();
                setAccounts((prev) =>
                    prev.map((a) => (a._id === id ? updated : a)),
                );
                toast.success("Account updated successfully");
                return updated;
            } else {
                const err = await res.json();
                console.error("Account update failed:", err);
                const errorMsg = `Failed to update account: ${err.error || "Unknown error"}`;
                toast.error(errorMsg);
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error("Error updating account:", error);
            // Avoid double toast if it was thrown from above else block
            if (!error.message.startsWith("Failed to update account")) {
                toast.error(
                    "Error updating account. Please check your connection.",
                );
            }
            throw error;
        }
    };

    return (
        <FinanceContext.Provider
            value={{
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
                loading,
                currency,
                setCurrency,
                isCurrencySet,
                formatCurrency,
                CURRENCIES,
                theme,
                toggleTheme,
            }}
        >
            {children}
        </FinanceContext.Provider>
    );
};
