'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
// Dynamic imports used in handleShare
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Plus, X, Trash2, Download, Upload, FileJson, Check, AlertCircle, Pencil } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TRANSACTION_TYPES, CATEGORY_COLORS, SCOPES } from '../utils/constants';
import TransactionForm from './TransactionForm';
import ReportCard from './ReportCard';
import EditAccountModal from './EditAccountModal';
import ShareStatementModal from './ShareStatementModal';
import SettleCardModal from './SettleCardModal';
import { generateStatementPDF } from '../utils/pdfGenerator';
import { exportToExcel, parseExcelFile, normalizeExcelDate } from '../utils/excelHelper';

const LedgerDetailView = ({ ledgerName, accountId, accountDetails, onBack }) => {
    const { accounts, transactions, deleteTransaction, bulkAddTransactions, bulkDeleteTransactions, deleteAccount } = useFinance();
    const [showAddModal, setShowAddModal] = useState(false);
    const [importPreviewData, setImportPreviewData] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Get unique categories for filtering
    const availableCategories = useMemo(() => {
        if (!transactions || transactions.length === 0) return ['All'];
        const cats = transactions
            .filter(t => {
                if (accountId) return t.accountId === accountId;
                return t.description && t.description.toLowerCase() === (ledgerName || '').toLowerCase();
            })
            .map(t => t.category);
        return ['All', ...new Set(cats)];
    }, [transactions, ledgerName, accountId]);

    // Filter transactions for this specific ledger name
    const allTransactions = useMemo(() => {
        if (!transactions) return [];

        return transactions.filter(t => {
            const tDesc = (t.description || '').toLowerCase().trim();
            const lName = (ledgerName || '').toLowerCase().trim();

            if (accountId) {
                const isIdMatch = (t.accountId && String(t.accountId) === String(accountId)) ||
                    (t.linkedAccountId && String(t.linkedAccountId) === String(accountId));
                const isOrphanNameMatch = !t.linkedAccountId && tDesc === lName;
                return isIdMatch || isOrphanNameMatch;
            }
            return (t.scope === SCOPES.MANAGER) && tDesc === lName;
        });
    }, [transactions, ledgerName, accountId]);

    // Apply Filters and Sorting to ledgerTransactions
    const ledgerTransactions = useMemo(() => {
        let filtered = [...allTransactions];

        // Apply Category Filter
        if (filterCategory !== 'All') {
            filtered = filtered.filter(t => t.category === filterCategory);
        }

        // Apply Date Range Filter
        if (startDate) {
            filtered = filtered.filter(t => new Date(t.date) >= new Date(startDate));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(t => new Date(t.date) <= end);
        }

        // Apply Sorting
        return filtered.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);

            switch (sortBy) {
                case 'oldest':
                    return dateA - dateB;
                case 'highest':
                    return (b.amount || 0) - (a.amount || 0);
                case 'lowest':
                    return (a.amount || 0) - (b.amount || 0);
                case 'newest':
                default:
                    const dateDiff = dateB - dateA;
                    if (dateDiff !== 0) return dateDiff;
                    // Secondary sort for stable order
                    return (b._id || '').localeCompare(a._id || '');
            }
        });
    }, [allTransactions, sortBy, filterCategory, startDate, endDate]);

    // Share Handler
    const [isSharing, setIsSharing] = useState(false);
    const [showShareOptions, setShowShareOptions] = useState(false);

    const handleShare = async () => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Prepare Data for PDF
        const shareData = {
            title: ledgerName || 'Ledger',
            subtitle: isAccount ? `${accountDetails.type} Statement` : "Ledger Statement",
            dateRange: `${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} - ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`,
            stats: {
                credit: ledgerTransactions.reduce((sum, t) => {
                    const isLinked = t.linkedAccountId && String(t.linkedAccountId) === String(accountId);
                    const isCredit = isLinked ? t.type === TRANSACTION_TYPES.DEBIT : t.type === TRANSACTION_TYPES.CREDIT;
                    return sum + (isCredit ? parseFloat(t.amount) : 0);
                }, 0),
                debit: ledgerTransactions.reduce((sum, t) => {
                    const isLinked = t.linkedAccountId && String(t.linkedAccountId) === String(accountId);
                    const isDebit = isLinked ? t.type === TRANSACTION_TYPES.CREDIT : t.type === TRANSACTION_TYPES.DEBIT;
                    return sum + (isDebit ? parseFloat(t.amount) : 0);
                }, 0),
                balance: stats.balance // Use existing stats prop
            },
            transactions: ledgerTransactions
        };

        if (isMobile) {
            setIsSharing(true);
            try {
                // Generate PDF using central utility
                const doc = await generateStatementPDF(shareData);
                const filename = `Statement_${(ledgerName || 'Ledger').replace(/\s+/g, '_')}.pdf`;
                const pdfBlob = doc.output('blob');
                const file = new File([pdfBlob], filename, { type: 'application/pdf' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Statement: ${ledgerName}`,
                        text: `Statement for ${ledgerName}`
                    });
                } else {
                    doc.save(filename);
                }
            } catch (err) {
                console.error("Share Error:", err);
                alert("Share failed. Please try downloading from Desktop.");
            } finally {
                setIsSharing(false);
            }
        } else {
            setShowShareOptions(true);
        }
    };

    // Template Download Logic
    const handleDownloadTemplate = () => {
        const templateData = [
            { Date: new Date().toLocaleDateString(), Category: 'Payment Received', Credit: 1000, Debit: 0 },
            { Date: new Date().toLocaleDateString(), Category: 'Payment Given', Credit: 0, Debit: 500 }
        ];

        exportToExcel(templateData, 'Ledger_Import_Template', 'Template', [
            { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 12 }
        ]);
    };

    // Excel Export Logic
    const handleExportExcel = () => {
        const data = ledgerTransactions.map(t => {
            const isLinked = t.linkedAccountId && String(t.linkedAccountId) === String(accountId);
            const isCredit = isLinked ? t.type === TRANSACTION_TYPES.DEBIT : t.type === TRANSACTION_TYPES.CREDIT;

            return {
                Date: new Date(t.date).toLocaleDateString(),
                Category: t.category,
                Credit: isCredit ? t.amount : 0,
                Debit: !isCredit ? t.amount : 0,
                Type: isCredit ? TRANSACTION_TYPES.CREDIT : TRANSACTION_TYPES.DEBIT
            };
        });

        exportToExcel(data, `${ledgerName}_Ledger`, 'Ledger', [
            { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
        ]);
    };

    // Excel Import Logic (Updated for Preview and fixes)
    const handleImportExcel = async (e) => {
        try {
            const data = await parseExcelFile(e);

            // Use flatMap to allow one row to produce multiple transaction entries
            const newTxns = data.flatMap((row, index) => {
                const credit = parseFloat(row.Credit || 0);
                const debit = parseFloat(row.Debit || 0);

                // Add index-based milliseconds offset to preserve file order for same-day transactions
                const baseDate = normalizeExcelDate(row.Date);
                const parsedDate = new Date(baseDate.getTime() + (index * 1000));

                const entries = [];

                // Create Credit entry if exists
                if (credit > 0) {
                    entries.push({
                        description: ledgerName,
                        amount: credit,
                        type: TRANSACTION_TYPES.CREDIT,
                        category: row.Category || 'Payment Received',
                        date: parsedDate,
                        scope: SCOPES.MANAGER
                    });
                }

                // Create Debit entry if exists
                if (debit > 0) {
                    entries.push({
                        description: ledgerName,
                        amount: debit,
                        type: TRANSACTION_TYPES.DEBIT,
                        category: row.Category || 'Payment Given',
                        date: parsedDate,
                        scope: SCOPES.MANAGER
                    });
                }

                return entries;
            });

            if (newTxns.length > 0) {
                setImportPreviewData(newTxns);
            } else {
                alert("No valid transactions found in the file.");
            }
        } catch (err) {
            console.error("Import error:", err);
            alert("Error parsing Excel file. Please use the template.");
        }
        e.target.value = ''; // Reset input
    };

    const confirmImport = async () => {
        if (importPreviewData) {
            setIsImporting(true); // You need to confirm isImporting state exists or add it
            try {
                await bulkAddTransactions(importPreviewData);
                setImportPreviewData(null);
            } finally {
                setIsImporting(false);
            }
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(ledgerTransactions.map(t => t._id || t.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} transactions?`)) {
            await bulkDeleteTransactions(selectedIds);
            setSelectedIds([]);
        }
    };

    // Calculate reactive total balance (unaffected by filters)
    const finalBalance = useMemo(() => {
        const getEffectiveType = (t) => {
            if (!accountId) return t.type;
            const isPrimary = t.accountId && String(t.accountId) === String(accountId);
            const isLinked = t.linkedAccountId && String(t.linkedAccountId) === String(accountId);

            if (isPrimary) return t.type;
            if (isLinked) {
                const primaryAcc = accounts.find(a => String(a._id) === String(t.accountId));
                const linkedAcc = accounts.find(a => String(a._id) === String(t.linkedAccountId));
                const internalTypes = ['Bank', 'Cash', 'Credit Card'];

                const isInternalTransfer = primaryAcc && linkedAcc &&
                    internalTypes.includes(primaryAcc.type) &&
                    internalTypes.includes(linkedAcc.type);

                if (isInternalTransfer) {
                    return t.type === TRANSACTION_TYPES.CREDIT ? TRANSACTION_TYPES.DEBIT : TRANSACTION_TYPES.CREDIT;
                }
                return t.type; // Ledger payment: keep same type
            }
            return t.type;
        };

        const initial = parseFloat(accountDetails?.initialBalance || 0);

        // ONLY inclusive of MANAGER level transactions for the main Net Balance/Receivables calculation
        const managerTransactions = allTransactions.filter(t => (t.scope || SCOPES.MANAGER) === SCOPES.MANAGER);

        return managerTransactions.reduce((bal, t) => {
            const amount = parseFloat(t.amount);
            const effectiveType = getEffectiveType(t);
            return effectiveType === TRANSACTION_TYPES.CREDIT ? bal + amount : bal - amount;
        }, initial);
    }, [allTransactions, accountId, accountDetails?.initialBalance, accounts]);

    // Calculate stats for the CURRENT VIEW (affected by filters)
    const stats = useMemo(() => {
        const getEffectiveType = (t) => {
            if (!accountId) return t.type;
            const isPrimary = t.accountId && String(t.accountId) === String(accountId);
            const isLinked = t.linkedAccountId && String(t.linkedAccountId) === String(accountId);

            if (isPrimary) return t.type;
            if (isLinked) {
                const primaryAcc = accounts.find(a => String(a._id) === String(t.accountId));
                const linkedAcc = accounts.find(a => String(a._id) === String(t.linkedAccountId));
                const internalTypes = ['Bank', 'Cash', 'Credit Card'];

                const isInternalTransfer = primaryAcc && linkedAcc &&
                    internalTypes.includes(primaryAcc.type) &&
                    internalTypes.includes(linkedAcc.type);

                if (isInternalTransfer) {
                    return t.type === TRANSACTION_TYPES.CREDIT ? TRANSACTION_TYPES.DEBIT : TRANSACTION_TYPES.CREDIT;
                }
                return t.type;
            }
            return t.type;
        };

        return ledgerTransactions.reduce((acc, t) => {
            const amount = parseFloat(t.amount);
            const effectiveType = getEffectiveType(t);

            if (effectiveType === TRANSACTION_TYPES.CREDIT) {
                acc.totalCredit += amount;
            } else {
                acc.totalDebit += amount;
            }
            return acc;
        }, { totalCredit: 0, totalDebit: 0 });
    }, [ledgerTransactions, accountId, accounts]);

    const statusColor = finalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400';

    // Account Type Helpers
    const isAccount = !!accountDetails;
    const isCreditCard = accountDetails?.type === 'Credit Card';

    // --- Shared Limit Logic ---

    const sharedLimitStats = useMemo(() => {
        if (!isCreditCard) return null;

        let parentAccount = accountDetails;
        let isChild = false;

        // If this account is linked to another, find the parent
        if (accountDetails.linkedAccountId) {
            parentAccount = accounts.find(a => a._id === accountDetails.linkedAccountId);
            isChild = true;
        }

        if (!parentAccount) return null; // Should not happen if data consistent

        // Find all accounts in this "family" (Parent + all Children)
        const familyAccounts = accounts.filter(a =>
            a._id === parentAccount._id || a.linkedAccountId === parentAccount._id
        );

        // If no children and not a child, it's a normal independent card
        if (familyAccounts.length <= 1) return null;

        const sharedLimit = parentAccount.creditLimit || 0;

        // Calculate Total Used Balance across all cards
        // Note: We use account.balance from context which is up to date with transactions
        const totalUsed = familyAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

        const available = sharedLimit + totalUsed; // Balance is typically negative
        const utilization = sharedLimit > 0 ? (Math.abs(totalUsed) / sharedLimit) * 100 : 0;

        return {
            isShared: true,
            parentName: parentAccount.name,
            sharedLimit,
            totalUsed,
            available,
            utilization,
            familyCount: familyAccounts.length
        };

    }, [isCreditCard, accountDetails, accounts]);

    // Restore standard credit stats for non-shared or fallback use
    const creditLimit = accountDetails?.creditLimit || 0;
    const availableCredit = creditLimit + finalBalance;
    const utilization = creditLimit > 0 ? (Math.abs(finalBalance) / creditLimit) * 100 : 0;


    // --- Billing Cycle Logic for Credit Cards ---
    const billingStats = useMemo(() => {
        if (!isCreditCard || !accountDetails.billDay) return null;

        // ... (existing billing logic) ...
        // Note: Billing is typically per card even if limit is shared.
        // So we keep individual billing stats logic.

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const day = now.getDate();
        const billDay = parseInt(accountDetails.billDay);

        // Determine Last Statement Date
        // If today is 10th and billDay is 15th -> Last Statement was 15th of prev month
        // If today is 20th and billDay is 15th -> Last Statement was 15th of current month
        let lastStatementDate = new Date(currentYear, currentMonth, billDay);
        // Set time to end of day to include transactions on that day
        lastStatementDate.setHours(23, 59, 59, 999);

        if (day < billDay) {
            lastStatementDate.setMonth(lastStatementDate.getMonth() - 1);
        }

        // Calculate "Due Date" for the Current Bill
        // Usually Due Date is fixed day. If Bill is 15th Jan, Due is 30th Jan.
        // If Bill is 15th Dec, Due is 30th Dec.
        // Careful with month rollovers if Due Day < Bill Day (e.g. Bill 25th, Due 5th).
        let dueDate = new Date(lastStatementDate);
        if (accountDetails.dueDay) {
            const dueDay = parseInt(accountDetails.dueDay);
            dueDate.setDate(dueDay);
            // If Due Day is smaller than Bill Day, it's next month
            if (dueDay < billDay) {
                dueDate.setMonth(dueDate.getMonth() + 1);
            }
        } else {
            // Default 15 days grace if not set
            dueDate.setDate(dueDate.getDate() + 15);
        }

        let currentDue = 0;
        let unbilled = 0;
        let totalOutstanding = 0;

        // Start with Initial Balance (Assuming it belongs to historical/current due)
        // If Initial Balance is negative (debt/spent), it correctly starts our due calculation.
        currentDue = parseFloat(accountDetails.initialBalance || 0);

        const getEffectiveType = (t) => {
            if (!accountId) return t.type; // Shared ledgers use raw type
            const isPrimary = t.accountId && String(t.accountId) === String(accountId);
            const isLinked = t.linkedAccountId && String(t.linkedAccountId) === String(accountId);

            if (isPrimary) return t.type;
            if (isLinked) {
                const primaryAcc = accounts.find(a => String(a._id) === String(t.accountId));
                const linkedAcc = accounts.find(a => String(a._id) === String(t.linkedAccountId));
                const internalTypes = ['Bank', 'Cash', 'Credit Card'];

                const isInternalTransfer = primaryAcc && linkedAcc &&
                    internalTypes.includes(primaryAcc.type) &&
                    internalTypes.includes(linkedAcc.type);

                if (isInternalTransfer) {
                    return t.type === TRANSACTION_TYPES.CREDIT ? TRANSACTION_TYPES.DEBIT : TRANSACTION_TYPES.CREDIT;
                }
                return t.type;
            }
            return t.type; // Fallback for name-based matching
        };

        // Process Transactions
        // Process Transactions
        allTransactions.forEach(t => {
            const tDate = new Date(t.date);
            const amount = parseFloat(t.amount);
            const effectiveType = getEffectiveType(t);
            const isCredit = effectiveType === TRANSACTION_TYPES.CREDIT;

            if (isCredit) {
                // Payments always reduce the current Bill Due first in our UI
                currentDue += amount;
            } else {
                // Spending is split by statement date
                if (tDate <= lastStatementDate) {
                    currentDue -= amount;
                } else {
                    unbilled -= amount;
                }
            }
        });

        totalOutstanding = currentDue + unbilled;

        return {
            currentDue,
            unbilled,
            totalOutstanding,
            lastStatementDate,
            dueDate
        };
    }, [allTransactions, isCreditCard, accountDetails, accounts]);

    // --- Edit Account States ---
    const [isEditingAccount, setIsEditingAccount] = useState(false);

    // updateAccount is destructured from useFinance but not used directly here anymore (used in modal)
    // deleteAccount is used for deletion

    const handleEditClick = () => {
        setIsEditingAccount(true);
    };

    const [showSettleModal, setShowSettleModal] = useState(false);

    // --- Stats Display Selection ---
    // If billingStats is active, use it. Else use standard stats.
    const displayBalance = billingStats ? billingStats.totalOutstanding : finalBalance;
    const isCreditCardBill = !!billingStats;

    const router = require('next/navigation').useRouter ? require('next/navigation').useRouter() : null; // Safe check or just use onBack

    const handleDeleteAccount = async () => {
        if (window.confirm(`Are you sure you want to delete account "${ledgerName}"? This cannot be undone.`)) {
            await deleteAccount(accountId);
            onBack();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
            {/* ... ReportCard ... */}
            <div className="absolute left-[-9999px] top-0">
                {/* 
                <ReportCard
                    ref={reportRef}
                    title={ledgerName}
                    subtitle={isAccount ? `${accountDetails.type} Statement` : "Ledger Statement"}
                    dateRange={`${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} - ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`}
                    type="ledger"
                    transactions={ledgerTransactions}
                    stats={{
                        credit: ledgerTransactions.reduce((sum, t) => sum + (t.type === TRANSACTION_TYPES.CREDIT ? parseFloat(t.amount) : 0), 0),
                        debit: ledgerTransactions.reduce((sum, t) => sum + (t.type === TRANSACTION_TYPES.DEBIT ? parseFloat(t.amount) : 0), 0)
                    }}
                /> 
                */}
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-white leading-none">{ledgerName}</h2>
                            {isCreditCard && (
                                <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    Credit Card
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">
                            {isAccount ? `${accountDetails.currency} • ${accountDetails.type}` : "Ledger Details"}
                            {sharedLimitStats && (
                                <span className="ml-2 text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                                    Shared Limit ({sharedLimitStats.parentName})
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="md:ml-auto flex flex-wrap items-center gap-2">
                    {/* ... Bulk Actions ... */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl animate-in zoom-in-95 duration-200">
                            <span className="text-rose-400 text-sm font-bold">{selectedIds.length} Selected</span>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg text-sm font-bold transition-all active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Desktop Actions */}
                    <div className="flex items-center gap-2 border-r border-slate-800 pr-4 mr-2">
                        {/* Edit Account Button */}
                        {isAccount && (
                            <button
                                onClick={handleEditClick}
                                className="flex items-center justify-center p-2.5 md:px-3 md:py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-xl text-sm transition-all active:scale-95 mr-2"
                                title="Edit Account"
                            >
                                <Pencil className="w-5 h-5 md:w-4 md:h-4" />
                                <span className="hidden md:inline ml-2">Edit</span>
                            </button>
                        )}
                        {/* Delete Account Button */}
                        {isAccount && (
                            (accountDetails.type === 'Other') ||
                            (accountDetails.transactionCount === 0 || !['Cash', 'Credit Card'].includes(accountDetails.type))
                        ) && (
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex items-center justify-center p-2.5 md:px-3 md:py-2 bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 border border-rose-500/20 rounded-xl text-sm transition-all active:scale-95 mr-2"
                                    title="Delete Account"
                                >
                                    <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                                    <span className="hidden md:inline ml-2">Delete</span>
                                </button>
                            )}

                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center p-2.5 md:px-3 md:py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm transition-all shadow-lg shadow-green-500/20 active:scale-95"
                            title="Share on WhatsApp/PDF"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-4 md:h-4">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            <span className="hidden md:inline ml-2">{isSharing ? 'Generating...' : 'Share'}</span>
                        </button>

                        {/* Settle Card Button for Credit Cards */}
                        {isCreditCard && (
                            <button
                                onClick={() => setShowSettleModal(true)}
                                className="flex items-center justify-center p-2.5 md:px-3 md:py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                                title="Settle Card"
                            >
                                <Check className="w-5 h-5 md:w-4 md:h-4 text-white" />
                                <span className="hidden md:inline ml-2">Settle Card</span>
                            </button>
                        )}

                        {/* Hidden on mobile to save space, maybe move to a "More" menu later if needed */}
                        <div className="hidden md:flex gap-2">
                            {!isAccount && (
                                <>
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-sm transition-all border border-slate-700"
                                        title="Download Template"
                                    >
                                        <FileJson className="w-4 h-4" />
                                        <span className="hidden lg:inline">Template</span>
                                    </button>
                                    <label className="cursor-pointer flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-sm transition-all border border-slate-700">
                                        <Upload className="w-4 h-4" />
                                        <span>Import</span>
                                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
                                    </label>
                                    <button
                                        onClick={handleExportExcel}
                                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-sm transition-all border border-slate-700"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Export</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Mobile Import Access - Hide for Accounts as well */}
                        {!isAccount && (
                            <label className="md:hidden cursor-pointer flex items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all border border-slate-700">
                                <Upload className="w-5 h-5" />
                                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
                            </label>
                        )}
                    </div>

                    <div className="text-right hidden sm:block mr-2">
                        {isCreditCardBill ? (
                            <div className="flex flex-col items-end">
                                <p className="text-xs text-slate-500 uppercase font-bold">Current Bill Due</p>
                                <p className="text-xl font-bold text-rose-400">
                                    ₹{Math.abs(billingStats.currentDue).toLocaleString('en-IN')}
                                </p>
                                <div className="text-[10px] text-slate-400 mt-1">
                                    Unbilled: ₹{Math.abs(billingStats.unbilled).toLocaleString('en-IN')}
                                </div>
                            </div>
                        ) : isCreditCard ? (
                            <div className="flex flex-col items-end">
                                <p className="text-xs text-slate-500 uppercase font-bold">Unbilled / Current Due</p>
                                <p className="text-xl font-bold text-rose-400">
                                    ₹{Math.abs(finalBalance).toLocaleString('en-IN')}
                                </p>
                                <div className="text-[10px] text-slate-400 mt-1">
                                    {sharedLimitStats ? (
                                        <span>Shared Avail: ₹{sharedLimitStats.available.toLocaleString('en-IN')}</span>
                                    ) : (
                                        <span>Avail: ₹{(accountDetails.availableCredit).toLocaleString('en-IN')} / ₹{creditLimit.toLocaleString('en-IN')}</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Current Balance</p>
                                <p className={`text-xl font-bold ${isAccount ? (finalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400') : (finalBalance >= 0 ? 'text-rose-400' : 'text-emerald-400')}`}>
                                    ₹{Math.abs(finalBalance).toLocaleString('en-IN')}
                                    {isAccount ? (
                                        <span className="text-xs ml-1 opacity-80 uppercase tracking-tighter">
                                            {finalBalance >= 0 ? '(Cr)' : '(Dr)'}
                                        </span>
                                    ) : (
                                        <span className="text-xs ml-1 opacity-80 uppercase tracking-tighter">
                                            {finalBalance >= 0 ? '(Payable)' : '(Receivable)'}
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Desktop Add Entry Button - Only for Ledgers */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Add Entry</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards (Mini) */}
            {/* Stats Cards (Mini) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {isCreditCardBill ? (
                    <>
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                            <div className="text-slate-500 text-xs uppercase font-bold mb-1">Due Date</div>
                            <div className="text-lg font-mono font-bold text-amber-400">
                                {billingStats.dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                            <div className="text-slate-500 text-xs uppercase font-bold mb-1">Current Bill</div>
                            <div className="text-lg font-mono font-bold text-rose-400">
                                ₹{Math.abs(billingStats.currentDue).toLocaleString()}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                            <div className="text-slate-500 text-xs uppercase font-bold mb-1">Unbilled</div>
                            <div className="text-lg font-mono font-bold text-slate-300">
                                ₹{Math.abs(billingStats.unbilled).toLocaleString()}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                            <div className="text-slate-500 text-xs uppercase font-bold mb-1">Available</div>
                            <div className="text-lg font-mono font-bold text-emerald-400">
                                ₹{accountDetails.availableCredit.toLocaleString()}
                            </div>
                        </div>
                    </>
                ) : isCreditCard ? (
                    <>
                        {sharedLimitStats ? (
                            <>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-blue-500/20 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    </div>
                                    <div className="text-blue-400 text-xs uppercase font-bold mb-1">Shared Used</div>
                                    <div className="text-lg font-mono font-bold text-rose-400">
                                        {sharedLimitStats.utilization.toFixed(1)}%
                                        <span className="text-xs text-slate-500 ml-1 font-normal">of ₹{(sharedLimitStats.sharedLimit / 1000).toFixed(0)}k</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                    <div className="text-slate-500 text-xs uppercase font-bold mb-1">Shared Available</div>
                                    <div className="text-lg font-mono font-bold text-emerald-400">
                                        ₹{sharedLimitStats.available.toLocaleString()}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                <div className="text-slate-500 text-xs uppercase font-bold mb-1">Used Limit</div>
                                <div className="text-lg font-mono font-bold text-rose-400">
                                    {((creditLimit > 0 ? (Math.abs(finalBalance) / creditLimit) * 100 : 0)).toFixed(1)}%
                                    <span className="text-xs text-slate-500 ml-1 font-normal">of ₹{(creditLimit / 1000).toFixed(0)}k</span>
                                </div>
                            </div>
                        )}
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                            <div className="text-slate-500 text-xs uppercase font-bold mb-1">Next Bill</div>
                            <div className="text-lg font-mono font-bold text-white">
                                {accountDetails.billDay ? `Day ${accountDetails.billDay}` : 'Set Bill Day'}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Standard Stats */}
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                            <div className="text-slate-500 text-xs uppercase font-bold mb-1">{isAccount ? 'Total Inflow' : 'Total Credit'}</div>
                            <div className="text-lg font-mono font-bold text-emerald-400">₹{stats.totalCredit.toLocaleString()}</div>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                            <div className="text-slate-500 text-xs uppercase font-bold mb-1">{isAccount ? 'Total Outflow' : 'Total Debit'}</div>
                            <div className="text-lg font-mono font-bold text-rose-400">₹{stats.totalDebit.toLocaleString()}</div>
                        </div>
                    </>
                )}

                {/* Sorting and Filtering UI */}
                <div className="col-span-2 flex flex-col gap-3">
                    {/* Date Filters */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 mb-1 block">From</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 mb-1 block">To</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 mb-1 block">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="highest">Highest Amount</option>
                                <option value="lowest">Lowest Amount</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 mb-1 block">Category</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            >
                                {availableCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Floating Action Button - Only for Ledgers */}
            {
                !isAccount && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="md:hidden fixed bottom-24 right-4 z-40 w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                )
            }

            {/* Desktop Table View */}
            <div className="hidden md:block bg-slate-900/30 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 w-12 text-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600"
                                    onChange={handleSelectAll}
                                    checked={selectedIds.length === ledgerTransactions.length && ledgerTransactions.length > 0}
                                />
                            </th>
                            <th className="p-4 w-32">Date</th>
                            <th className="p-4">Type</th>
                            <th className="p-4 text-right">Credit</th>
                            <th className="p-4 text-right">Debit</th>
                            <th className="p-4 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {ledgerTransactions.map((t) => {
                            const isLinked = t.linkedAccountId && String(t.linkedAccountId) === String(accountId);

                            let effectiveType = t.type;
                            if (isLinked) {
                                const primaryAcc = accounts.find(a => String(a._id) === String(t.accountId));
                                const linkedAcc = accounts.find(a => String(a._id) === String(t.linkedAccountId));
                                const internalTypes = ['Bank', 'Cash', 'Credit Card'];

                                const isInternalTransfer = primaryAcc && linkedAcc &&
                                    internalTypes.includes(primaryAcc.type) &&
                                    internalTypes.includes(linkedAcc.type);

                                if (isInternalTransfer) {
                                    effectiveType = (t.type === TRANSACTION_TYPES.CREDIT ? TRANSACTION_TYPES.DEBIT : TRANSACTION_TYPES.CREDIT);
                                }
                            }

                            const isCredit = effectiveType === TRANSACTION_TYPES.CREDIT;
                            const isSelected = selectedIds.includes(t._id || t.id);
                            return (
                                <tr key={t._id || t.id} className={`hover:bg-white/5 transition-colors group ${isSelected ? 'bg-blue-500/5' : ''}`}>
                                    <td className="p-4 text-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(t._id || t.id)}
                                        />
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm font-mono">
                                        {new Date(t.date).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-slate-300 text-sm">
                                        {t.category}
                                        {t.description && t.description !== ledgerName && (
                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{t.description}</div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-mono font-medium text-emerald-400">
                                        {isCredit ? `₹${t.amount.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="p-4 text-right font-mono font-medium text-rose-400">
                                        {!isCredit ? `₹${t.amount.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => setEditingTransaction(t)}
                                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Delete this transaction?')) deleteTransaction(t._id || t.id, t.scope);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {ledgerTransactions.length === 0 && (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">No transactions found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden space-y-3 pb-20">
                {ledgerTransactions.map((t) => {
                    const isLinked = t.linkedAccountId && String(t.linkedAccountId) === String(accountId);

                    let effectiveType = t.type;
                    if (isLinked) {
                        const primaryAcc = accounts.find(a => String(a._id) === String(t.accountId));
                        const linkedAcc = accounts.find(a => String(a._id) === String(t.linkedAccountId));
                        const internalTypes = ['Bank', 'Cash', 'Credit Card'];

                        const isInternalTransfer = primaryAcc && linkedAcc &&
                            internalTypes.includes(primaryAcc.type) &&
                            internalTypes.includes(linkedAcc.type);

                        if (isInternalTransfer) {
                            effectiveType = (t.type === TRANSACTION_TYPES.CREDIT ? TRANSACTION_TYPES.DEBIT : TRANSACTION_TYPES.CREDIT);
                        }
                    }

                    const isCredit = effectiveType === TRANSACTION_TYPES.CREDIT;
                    const isSelected = selectedIds.includes(t._id || t.id);
                    return (
                        <div
                            key={t._id || t.id}
                            onClick={() => setEditingTransaction(t)}
                            className={`p-4 rounded-xl border ${isSelected ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 bg-slate-900/50'} active:scale-[0.98] transition-all`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600"
                                        checked={isSelected}
                                        onClick={(e) => { e.stopPropagation(); toggleSelect(t._id || t.id); }}
                                        onChange={() => { }}
                                    />
                                    <div>
                                        <span className="text-xs text-slate-500 font-mono block">{new Date(t.date).toLocaleDateString()}</span>
                                        <h4 className="font-bold text-slate-200">{t.category}</h4>
                                    </div>
                                </div>
                                <div className={`text-right font-mono font-bold ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isCredit ? '+' : '-'}₹{t.amount.toLocaleString()}
                                </div>
                            </div>
                            {t.description && t.description !== ledgerName && (
                                <p className="text-sm text-slate-400 pl-8 mb-2 border-l-2 border-slate-800 ml-1">{t.description}</p>
                            )}
                        </div>
                    );
                })}
                {ledgerTransactions.length === 0 && (
                    <div className="p-8 text-center text-slate-500 italic">No transactions found.</div>
                )}
            </div>

            {/* Add/Edit Entry Modal - Responsive Container */}
            {
                (showAddModal || editingTransaction) && (
                    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative w-full h-[100dvh] md:h-auto md:max-w-lg">
                            {/* Desktop Close Button - Mobile has internal close button */}
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingTransaction(null);
                                }}
                                className="hidden md:block absolute -top-12 right-0 p-2 text-white/50 hover:text-white bg-white/10 rounded-full backdrop-blur-md transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <TransactionForm
                                onClose={() => {
                                    setShowAddModal(false);
                                    setEditingTransaction(null);
                                }}
                                scope={SCOPES.MANAGER}
                                ledgerAccountId={accountId}
                                initialData={editingTransaction ? {
                                    ...editingTransaction,
                                    date: new Date(editingTransaction.date).toISOString().split('T')[0]
                                } : { description: !accountId ? ledgerName : '', accountId: accountId }}
                            />
                        </div>
                    </div>
                )
            }

            {/* Import Preview Modal */}
            {
                importPreviewData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                                        <FileJson className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Verify Import Details</h3>
                                        <p className="text-slate-400 text-sm">Review {importPreviewData.length} records before adding to {ledgerName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setImportPreviewData(null)}
                                    className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Content - Scrollable Table/List */}
                            <div className="flex-1 overflow-auto p-4 md:p-6">
                                {/* Desktop Table View */}
                                <table className="hidden md:table w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-900 text-slate-400 text-xs uppercase tracking-wider z-10">
                                        <tr>
                                            <th className="p-3 border-b border-slate-800">Date</th>
                                            <th className="p-3 border-b border-slate-800">Category</th>
                                            <th className="p-3 border-b border-slate-800 text-right">Credit</th>
                                            <th className="p-3 border-b border-slate-800 text-right">Debit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {importPreviewData.map((t, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="p-3 text-slate-400 text-sm font-mono">
                                                    {new Date(t.date).toLocaleDateString()}
                                                </td>
                                                <td className="p-3 text-slate-300 text-sm">{t.category}</td>
                                                <td className="p-3 text-right font-mono text-emerald-400">
                                                    {t.type === TRANSACTION_TYPES.CREDIT ? `₹${t.amount.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="p-3 text-right font-mono text-rose-400">
                                                    {t.type === TRANSACTION_TYPES.DEBIT ? `₹${t.amount.toLocaleString()}` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Mobile Card List View */}
                                <div className="md:hidden space-y-3">
                                    {importPreviewData.map((t, idx) => (
                                        <div key={idx} className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex justify-between items-center">
                                            <div>
                                                <div className="text-xs text-slate-500 font-mono mb-1">{new Date(t.date).toLocaleDateString()}</div>
                                                <div className="text-slate-200 font-medium">{t.category}</div>
                                            </div>
                                            <div className={`font-mono font-bold text-lg ${t.type === TRANSACTION_TYPES.CREDIT ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {t.type === TRANSACTION_TYPES.CREDIT ? '+' : '-'}₹{t.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-400/10 px-4 py-2 rounded-xl border border-amber-400/20">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Double check dates and amounts</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setImportPreviewData(null)}
                                        className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmImport}
                                        disabled={isImporting}
                                        className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${isImporting
                                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                                            }`}
                                    >
                                        {isImporting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Confirm & Import
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Account Modal */}
            {
                isEditingAccount && (
                    <EditAccountModal
                        account={accountDetails}
                        onClose={() => setIsEditingAccount(false)}
                    />
                )
            }

            {/* Settle Card Modal */}
            {showSettleModal && (
                <SettleCardModal
                    account={{ _id: accountId, name: ledgerName }}
                    initialAmount={Math.abs(billingStats?.currentDue || finalBalance)}
                    onClose={() => setShowSettleModal(false)}
                />
            )}

            <ShareStatementModal
                isOpen={showShareOptions}
                onClose={() => setShowShareOptions(false)}
                data={{
                    title: ledgerName || 'Ledger',
                    subtitle: isAccount ? `${accountDetails.type} Statement` : "Ledger Statement",
                    dateRange: `${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} - ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`,
                    stats: {
                        credit: stats.totalCredit,
                        debit: stats.totalDebit,
                        balance: stats.totalCredit - stats.totalDebit
                    },
                    transactions: ledgerTransactions
                }}
            />
        </div >
    );
};

export default LedgerDetailView;
