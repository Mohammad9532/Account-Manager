'use client';

import React, { useState } from 'react';
import { Book, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { SCOPES, TRANSACTION_TYPES } from '../utils/constants';

const LedgerForm = ({ onClose }) => {
    const { addTransaction } = useFinance();
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        addTransaction({
            description: name, // The Ledger Name
            amount: 0,         // Initialize with 0
            type: TRANSACTION_TYPES.CREDIT, // Default (placeholder)
            category: 'Ledger',
            scope: SCOPES.MANAGER
        });

        if (onClose) onClose();
        else setName('');
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl max-w-sm w-full relative">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                    <Book className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">New Ledger</h2>
                    <p className="text-xs text-slate-400">Create a new account/party</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                        Ledger Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 font-medium"
                        placeholder="e.g. Rafey, HDFC, Salary..."
                        autoFocus
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                >
                    Create Ledger
                </button>
            </div>
        </form>
    );
};

export default LedgerForm;
