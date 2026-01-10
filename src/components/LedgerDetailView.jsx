import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Plus, X, Trash2, Download, Upload, FileJson, Check, AlertCircle, Pencil } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TRANSACTION_TYPES, CATEGORY_COLORS, SCOPES } from '../utils/constants';
import TransactionForm from './TransactionForm';

const LedgerDetailView = ({ ledgerName, onBack }) => {
    const { transactions, deleteTransaction, bulkAddTransactions, bulkDeleteTransactions } = useFinance();
    const [showAddModal, setShowAddModal] = useState(false);
    const [importPreviewData, setImportPreviewData] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Sorting and Filtering State
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'
    const [filterCategory, setFilterCategory] = useState('All');

    // Filter transactions for this specific ledger name
    // Filter and Sort transactions for this specific ledger name
    const ledgerTransactions = useMemo(() => {
        let filtered = transactions.filter(t =>
            t.scope === SCOPES.MANAGER &&
            t.description.toLowerCase() === ledgerName.toLowerCase()
        );

        // Apply Category Filter
        if (filterCategory !== 'All') {
            filtered = filtered.filter(t => t.category === filterCategory);
        }

        // Apply Sorting
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return new Date(a.date) - new Date(b.date);
                case 'highest':
                    return b.amount - a.amount;
                case 'lowest':
                    return a.amount - b.amount;
                case 'newest':
                default:
                    const dateDiff = new Date(b.date) - new Date(a.date);
                    if (dateDiff !== 0) return dateDiff;
                    // Secondary sort for stable order
                    return (b._id || '').localeCompare(a._id || '');
            }
        });
    }, [transactions, ledgerName, sortBy, filterCategory]);

    // Get unique categories for filtering
    const availableCategories = useMemo(() => {
        const cats = transactions
            .filter(t => t.description.toLowerCase() === ledgerName.toLowerCase())
            .map(t => t.category);
        return ['All', ...new Set(cats)];
    }, [transactions, ledgerName]);

    // Template Download Logic
    const handleDownloadTemplate = () => {
        const templateData = [
            { Date: new Date().toLocaleDateString(), Category: 'Payment Received', Credit: 1000, Debit: 0 },
            { Date: new Date().toLocaleDateString(), Category: 'Payment Given', Credit: 0, Debit: 500 }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

        // Set column widths
        const wscols = [{ wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 12 }];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `Ledger_Import_Template.xlsx`);
    };

    // Excel Export Logic
    const handleExportExcel = () => {
        const data = ledgerTransactions.map(t => ({
            Date: new Date(t.date).toLocaleDateString(),
            Category: t.category,
            Credit: t.type === TRANSACTION_TYPES.CREDIT ? t.amount : 0,
            Debit: t.type === TRANSACTION_TYPES.DEBIT ? t.amount : 0,
            Type: t.type
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");

        const wscols = [{ wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `${ledgerName}_Ledger.xlsx`);
    };

    // Excel Import Logic (Updated for Preview and fixes)
    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const bstr = event.target.result;
                // Add cellDates: true to handle Excel date objects
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Helper to normalize dates from Excel (can be Date object or serial number)
                const normalizeDate = (val) => {
                    if (val instanceof Date && !isNaN(val)) return val;
                    if (typeof val === 'number') {
                        // Excel serial date to JS Date
                        return new Date(Math.round((val - 25569) * 86400 * 1000));
                    }
                    if (typeof val === 'string') {
                        const parsed = new Date(val);
                        return !isNaN(parsed) ? parsed : new Date();
                    }
                    return new Date();
                };

                // Use flatMap to allow one row to produce multiple transaction entries
                const newTxns = data.flatMap(row => {
                    const credit = parseFloat(row.Credit || 0);
                    const debit = parseFloat(row.Debit || 0);
                    const parsedDate = normalizeDate(row.Date);
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
        reader.readAsBinaryString(file);
    };

    const confirmImport = async () => {
        if (importPreviewData) {
            setIsImporting(true);
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

    // Calculate stats for this ledger
    const stats = useMemo(() => {
        return ledgerTransactions.reduce((acc, t) => {
            const amount = parseFloat(t.amount);
            if (t.type === TRANSACTION_TYPES.CREDIT) {
                acc.totalCredit += amount;
                acc.balance += amount;
            } else {
                acc.totalDebit += amount;
                acc.balance -= amount;
            }
            return acc;
        }, { totalCredit: 0, totalDebit: 0, balance: 0 });
    }, [ledgerTransactions]);

    const statusColor = stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white">{ledgerName}</h2>
                    <p className="text-slate-400 text-sm">Ledger Details</p>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    {/* Bulk Actions */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 mr-4 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl animate-in zoom-in-95 duration-200">
                            <span className="text-rose-400 text-sm font-bold">{selectedIds.length} Selected</span>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg text-sm font-bold transition-all active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    )}

                    {/* Template and Excel Actions */}
                    <div className="flex items-center gap-2 mr-4 border-r border-slate-800 pr-4">
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
                    </div>

                    <div className="text-right hidden sm:block mr-2">
                        <p className="text-xs text-slate-500 uppercase font-bold">Net Balance</p>
                        <p className={`text-xl font-mono font-bold ${statusColor}`}>
                            {stats.balance >= 0 ? '+' : ''}₹{stats.balance.toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Add Entry</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards (Mini) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-xs uppercase font-bold mb-1">Total Credit</div>
                    <div className="text-lg font-mono font-bold text-emerald-400">₹{stats.totalCredit.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-xs uppercase font-bold mb-1">Total Debit</div>
                    <div className="text-lg font-mono font-bold text-rose-400">₹{stats.totalDebit.toLocaleString()}</div>
                </div>

                {/* Sorting and Filtering UI */}
                <div className="col-span-2 flex items-center gap-3">
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

            {/* Transaction History Table */}
            <div className="bg-slate-900/30 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 w-12 text-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/20"
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
                            const isCredit = t.type === TRANSACTION_TYPES.CREDIT;
                            const isSelected = selectedIds.includes(t._id || t.id);
                            return (
                                <tr key={t._id || t.id} className={`hover:bg-white/5 transition-colors group ${isSelected ? 'bg-blue-500/5' : ''}`}>
                                    <td className="p-4 text-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/20"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(t._id || t.id)}
                                        />
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm font-mono">
                                        {new Date(t.date).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-slate-300 text-sm">
                                        {t.category}
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
                                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                title="Edit Entry"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteTransaction(t._id || t.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                                title="Delete Entry"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {ledgerTransactions.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-500 italic">
                                    No additional transactions found for {ledgerName}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Entry Modal */}
            {(showAddModal || editingTransaction) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg">
                        <button
                            onClick={() => {
                                setShowAddModal(false);
                                setEditingTransaction(null);
                            }}
                            className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white bg-white/10 rounded-full backdrop-blur-md transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <TransactionForm
                            onClose={() => {
                                setShowAddModal(false);
                                setEditingTransaction(null);
                            }}
                            scope={SCOPES.MANAGER}
                            initialData={editingTransaction ? {
                                ...editingTransaction,
                                date: new Date(editingTransaction.date).toISOString().split('T')[0]
                            } : { description: ledgerName }}
                        />
                    </div>
                </div>
            )}

            {/* Import Preview Modal */}
            {importPreviewData && (
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

                        {/* Modal Content - Scrollable Table */}
                        <div className="flex-1 overflow-auto p-6">
                            <table className="w-full text-left border-collapse">
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
            )}
        </div>
    );
};

export default LedgerDetailView;

