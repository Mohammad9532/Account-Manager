'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Plus, X, Trash2, Download, Upload, FileJson, Check, AlertCircle, Pencil } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TRANSACTION_TYPES, CATEGORY_COLORS, SCOPES } from '../utils/constants';
import TransactionForm from './TransactionForm';
import ReportCard from './ReportCard';

const LedgerDetailView = ({ ledgerName, onBack }) => {
    const { transactions, deleteTransaction, bulkAddTransactions, bulkDeleteTransactions } = useFinance();
    const [showAddModal, setShowAddModal] = useState(false);
    const [importPreviewData, setImportPreviewData] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterCategory, setFilterCategory] = useState('All'); // Assuming this state exists
    const [sortBy, setSortBy] = useState('newest'); // Assuming this state exists
    const [selectedIds, setSelectedIds] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Get unique categories for filtering
    const availableCategories = useMemo(() => {
        if (!transactions || transactions.length === 0) return ['All'];
        const cats = transactions
            .filter(t => t.description && t.description.toLowerCase() === (ledgerName || '').toLowerCase())
            .map(t => t.category);
        return ['All', ...new Set(cats)];
    }, [transactions, ledgerName]);

    // Filter and Sort transactions for this specific ledger name
    const ledgerTransactions = useMemo(() => {
        if (!transactions) return [];

        let filtered = transactions.filter(t =>
            (t.scope === SCOPES.MANAGER) &&
            (t.description || '').toLowerCase() === (ledgerName || '').toLowerCase()
        );

        // Apply Category Filter
        if (filterCategory !== 'All') {
            filtered = filtered.filter(t => t.category === filterCategory);
        }

        // Apply Date Range Filter
        if (startDate) {
            filtered = filtered.filter(t => new Date(t.date) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(t => new Date(t.date) <= new Date(endDate));
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
    }, [transactions, ledgerName, sortBy, filterCategory, startDate, endDate]);

    // Share Handler (Image/PDF)
    const reportRef = React.useRef(null);
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        if (!reportRef.current) return;
        setIsSharing(true);

        try {
            const html2canvas = (await import('html2canvas')).default;

            // Wait for render
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(reportRef.current, {
                backgroundColor: '#0B1121',
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true,
            });

            canvas.toBlob(async (blob) => {
                if (!blob || blob.size < 100) {
                    setIsSharing(false);
                    alert('Generated image was empty. Please try again.');
                    return;
                }

                const filename = `Statement_${ledgerName.replace(/\s+/g, '_')}.png`;
                const file = new File([blob], filename, { type: 'image/png' });

                const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

                if (isMobileDevice && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: `Statement: ${ledgerName}`,
                            text: `Statement for ${ledgerName}`
                        });
                    } catch (err) {
                        console.log('Share failed/cancelled', err);
                    }
                } else {
                    // Desktop: Force Download
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);
                }
                setIsSharing(false);
            }, 'image/png');
        } catch (err) {
            console.error('Error generating image:', err);
            alert('Error generating report. Please try again.');
            setIsSharing(false);
        }
    };

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
            {/* Hidden Report Card */}
            <div className="absolute left-[-9999px] top-0">
                <ReportCard
                    ref={reportRef}
                    title={ledgerName}
                    subtitle="Ledger Statement"
                    dateRange={`${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} - ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`}
                    type="ledger"
                    stats={{
                        credit: ledgerTransactions.reduce((sum, t) => sum + (t.type === TRANSACTION_TYPES.CREDIT ? parseFloat(t.amount) : 0), 0),
                        debit: ledgerTransactions.reduce((sum, t) => sum + (t.type === TRANSACTION_TYPES.DEBIT ? parseFloat(t.amount) : 0), 0)
                    }}
                />
            </div>

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
                            onClick={handleShare}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-xl text-sm transition-all shadow-lg shadow-green-500/20 active:scale-95"
                            title="Share on WhatsApp"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            <span className="hidden lg:inline">{isSharing ? 'Generating...' : 'Share'}</span>
                        </button>
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
                        <p className="text-xs text-slate-500 uppercase font-bold">Current Status</p>
                        <p className={`text-xl font-bold ${stats.balance >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            ₹{Math.abs(stats.balance).toLocaleString('en-IN')}
                            <span className="text-xs ml-1 opacity-80 uppercase tracking-tighter">
                                {stats.balance >= 0 ? '(Payable)' : '(Receivable)'}
                            </span>
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

