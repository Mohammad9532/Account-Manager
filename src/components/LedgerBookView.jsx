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
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [selectedLedgerName, setSelectedLedgerName] = useState(null);
    const [selectedAccountId, setSelectedAccountId] = useState(null); // Store Account ID if available

    const handleRowClick = (transaction) => {
        setSelectedLedgerName(transaction.description);
        setSelectedAccountId(transaction.accountId || null); // Capture Account ID
        setViewMode('detail');
    };

    const handleBack = () => {
        setViewMode('list');
        setSelectedLedgerName(null);
        setSelectedAccountId(null);
    };

    // Render Detail View
    if (viewMode === 'detail' && selectedLedgerName) {
        // We'll pass accountDetails implicitly via accountId if it exists
        // But LedgerDetailView might expect the full account object for some logic.
        // However, looking at LedgerDetailView.jsx, it seems to expect `accountDetails` prop or `accountId`.
        // Let's pass what we have. If it's an account, LedgerDetailView should probably fetch it or we pass it from context?
        // Wait, LedgerDetailView relies on `accountDetails` prop being passed in `LedgerDetailView.jsx` line 18.
        // But LedgerBookView doesn't have the full account object readily available to pass unless we fetch it.
        // Actually, LedgerTable passed `transaction` which we mocked.
        // We should probably find the account in context here if we have an ID.
        // But LedgerBookView doesn't useFinance context yet. It should.
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

            {/* Ledger Table Section */}
            <div className="space-y-6">
                {/* Full width ledger table */}
                <LedgerTable scope={SCOPES.MANAGER} onRowClick={handleRowClick} />
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
