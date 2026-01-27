'use client';

import React, { useState } from 'react';
import { Plus, X, Search, Book, Download, Upload, FileJson, Check, AlertCircle, Clock } from 'lucide-react';
import LedgerTable from './LedgerTable';
import LedgerForm from './LedgerForm';
import LedgerDetailView from './LedgerDetailView';
import { SCOPES } from '../utils/constants';

import { useFinance } from '../context/FinanceContext';
import { exportToExcel, parseExcelFile, normalizeExcelDate } from '../utils/excelHelper';
import { TRANSACTION_TYPES } from '../utils/constants';

// Helper wrapper to provide account details if available
const LedgerDetailViewWithContext = ({ ledgerName, accountId, onBack }) => {
    const { accounts } = useFinance();
    const accountDetails = accountId ? accounts.find(a => a._id === accountId) : null;

    // If it's an account, we pass accountDetails so LedgerDetailView treats it as one
    return (
        <LedgerDetailView
            ledgerName={ledgerName}
            accountId={accountId}
            accountDetails={accountDetails} // key for enabling account features like Sharing
            onBack={onBack}
        />
    );
};

const LedgerBookView = () => {
    const { accounts, transactions, bulkAddTransactions } = useFinance();
    const [showAddModal, setShowAddModal] = useState(false);
    const [importPreviewData, setImportPreviewData] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [selectedLedgerName, setSelectedLedgerName] = useState(null);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'shared'

    // Filter Shared Accounts
    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    const sharedAccounts = React.useMemo(() => safeAccounts.filter(a => a && a.isShared), [safeAccounts]);
    // For Personal, we rely on LedgerTable's default behavior which pulls from context + legacy transactions.
    // However, if we want to be strict that "My Ledgers" ONLY shows my stuff, we might want to exclude Shared accounts from the default view too?
    // LedgerTable by default uses "validAccounts" = all accounts type 'Other'.
    // If "Shared" accounts are type 'Other', they will appear in "My Ledgers" unless I override them there too!
    // Yes, I should filter OUT shared accounts for the Personal Tab.
    const personalAccounts = React.useMemo(() => safeAccounts.filter(a => a && !a.isShared), [safeAccounts]);

    const handleRowClick = (transaction) => {
        setSelectedLedgerName(transaction.description);
        setSelectedAccountId(transaction.accountId || null);
        setViewMode('detail');
    };

    const handleBack = () => {
        setViewMode('list');
        setSelectedLedgerName(null);
        setSelectedAccountId(null);
    };

    const handleExportSummary = () => {
        // We'll let the user export the summary of all ledgers
        // Since we don't have the table data easily accessible here without repeating logic, 
        // we can either move the calculation to a shared hook or just repeat the map logic.
        // For simplicity and to avoid interference as requested, I'll repeat the basic mapping.

        const personalAccounts = safeAccounts.filter(a => a && !a.isShared && a.type === 'Other');
        const data = personalAccounts.map(acc => ({
            Name: acc.name,
            Balance: acc.balance || 0,
            Type: (acc.balance || 0) >= 0 ? 'Credit' : 'Debit'
        }));

        exportToExcel(data, `Ledger_Summary_${new Date().toISOString().split('T')[0]}`, 'Summary', [
            { wch: 30 }, { wch: 15 }, { wch: 12 }
        ]);
    };

    const handleImportGlobal = async (e) => {
        try {
            const data = await parseExcelFile(e);
            const newTxns = data.flatMap((row, index) => {
                const amount = parseFloat(row.Credit || row.Debit || row.Amount || 0);
                if (amount <= 0) return [];

                const particulars = row.Particulars || row.Name || row.Description || 'Unknown Ledger';
                const type = (row.Credit > 0 || row.Type === TRANSACTION_TYPES.CREDIT) ? TRANSACTION_TYPES.CREDIT : TRANSACTION_TYPES.DEBIT;

                const baseDate = normalizeExcelDate(row.Date);
                const parsedDate = new Date(baseDate.getTime() + (index * 1000));

                return [{
                    description: particulars,
                    amount: amount,
                    type: type,
                    category: row.Category || 'Bulk Import',
                    date: parsedDate,
                    scope: SCOPES.MANAGER
                }];
            });

            if (newTxns.length > 0) {
                setImportPreviewData(newTxns);
            } else {
                alert("No valid transactions found.");
            }
        } catch (err) {
            console.error("Import error:", err);
            alert("Error parsing Excel file.");
        }
        e.target.value = '';
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

    if (viewMode === 'detail' && selectedLedgerName) {
        return <LedgerDetailViewWithContext ledgerName={selectedLedgerName} accountId={selectedAccountId} onBack={handleBack} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <div>
                    <h2 className="text-2xl font-bold text-white">Ledger Book</h2>
                    <p className="text-slate-400 text-sm">Manage all your ledger entries</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* Import/Export */}
                    <div className="flex border border-slate-700 rounded-xl overflow-hidden bg-slate-900/50">
                        <label className="flex items-center justify-center p-2.5 hover:bg-slate-800 text-slate-400 cursor-pointer border-r border-slate-700 transition-colors" title="Global Import (Links by Name)">
                            <Upload className="w-5 h-5" />
                            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImportGlobal} />
                        </label>
                        <button
                            onClick={handleExportSummary}
                            className="flex items-center justify-center p-2.5 hover:bg-slate-800 text-slate-400 transition-colors"
                            title="Export Summary"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex-1 md:flex-none"
                    >
                        <Plus className="w-5 h-5" />
                        Add Ledger
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl w-fit border border-slate-800">
                <button
                    onClick={() => setActiveTab('personal')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'personal'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    My Ledgers
                </button>
                {sharedAccounts.length > 0 && (
                    <button
                        onClick={() => setActiveTab('shared')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'shared'
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Shared with you
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'shared' ? 'bg-indigo-400/30' : 'bg-slate-700'}`}>
                            {sharedAccounts.length}
                        </span>
                    </button>
                )}
            </div>

            {/* Ledger Table Section */}
            <div className="space-y-6">
                {activeTab === 'personal' ? (
                    <LedgerTable
                        scope={SCOPES.MANAGER}
                        onRowClick={handleRowClick}
                        accountsOverride={personalAccounts} // Explicitly showing ONLY Personal
                        includeLegacy={true} // Include legacy transactions for personal view
                    />
                ) : (
                    <LedgerTable
                        scope={SCOPES.MANAGER}
                        onRowClick={handleRowClick}
                        accountsOverride={sharedAccounts} // Explicitly showing ONLY Shared
                        includeLegacy={false} // Exclude legacy transactions for shared view
                    />
                )}
            </div>

            {/* Add Ledger Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white bg-white/10 rounded-full backdrop-blur-md transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <LedgerForm onClose={() => setShowAddModal(false)} />
                    </div>
                </div>
            )}
            {/* Import Preview Modal */}
            {importPreviewData && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <FileJson className="w-6 h-6 text-blue-400" />
                                <h3 className="text-xl font-bold text-white">Global Import ({importPreviewData.length})</h3>
                            </div>
                            <button onClick={() => setImportPreviewData(null)} className="p-2 text-slate-500 hover:text-white rounded-full">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-4">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-900 text-slate-400 text-xs uppercase z-10">
                                    <tr>
                                        <th className="p-3 border-b border-slate-800 font-bold">Ledger</th>
                                        <th className="p-3 border-b border-slate-800 font-bold">Date</th>
                                        <th className="p-3 border-b border-slate-800 font-bold text-right">Credit</th>
                                        <th className="p-3 border-b border-slate-800 text-right font-bold">Debit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 text-sm">
                                    {importPreviewData.map((t, idx) => (
                                        <tr key={idx} className="hover:bg-white/5">
                                            <td className="p-3 text-slate-200 font-bold">{t.description}</td>
                                            <td className="p-3 text-slate-400 font-mono">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="p-3 text-right text-emerald-400 font-mono">{t.type === TRANSACTION_TYPES.CREDIT ? t.amount.toLocaleString() : '-'}</td>
                                            <td className="p-3 text-right text-rose-400 font-mono">{t.type === TRANSACTION_TYPES.DEBIT ? t.amount.toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-400 text-xs">
                                <AlertCircle className="w-4 h-4" />
                                <span>Transactions will be linked to ledgers by name</span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setImportPreviewData(null)} className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-medium">Cancel</button>
                                <button
                                    onClick={confirmImport}
                                    disabled={isImporting}
                                    className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                                >
                                    {isImporting ? <Clock className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    Confirm Import
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LedgerBookView;
