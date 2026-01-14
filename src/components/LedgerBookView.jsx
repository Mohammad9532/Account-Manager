'use client';

import React, { useState } from 'react';
import { Plus, X, Search, Book } from 'lucide-react';
import LedgerTable from './LedgerTable';
import LedgerForm from './LedgerForm';
import LedgerDetailView from './LedgerDetailView';
import { SCOPES } from '../utils/constants';

const LedgerBookView = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [selectedLedgerName, setSelectedLedgerName] = useState(null);

    const handleRowClick = (transaction) => {
        setSelectedLedgerName(transaction.description);
        setViewMode('detail');
    };

    const handleBack = () => {
        setViewMode('list');
        setSelectedLedgerName(null);
    };

    // Render Detail View
    if (viewMode === 'detail' && selectedLedgerName) {
        return <LedgerDetailView ledgerName={selectedLedgerName} onBack={handleBack} />;
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
