'use client';

import React, { useState } from 'react';
import { Plus, X, Search, Book } from 'lucide-react';
import LedgerTable from './LedgerTable';
import LedgerForm from './LedgerForm';
import LedgerDetailView from './LedgerDetailView';
import { SCOPES } from '../utils/constants';

import { useFinance } from '../context/FinanceContext';

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
    const { accounts } = useFinance();
    const [showAddModal, setShowAddModal] = useState(false);
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
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 active:scale-95 w-full md:w-auto"
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
        </div>
    );
};

export default LedgerBookView;
