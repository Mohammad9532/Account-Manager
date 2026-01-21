'use client';

import React, { useState } from 'react';
import { Book, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { SCOPES, TRANSACTION_TYPES } from '../utils/constants';

const LedgerForm = ({ onClose }) => {
    const { createAccount } = useFinance(); // Use createAccount instead of addTransaction
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await createAccount({
                name: name,
                type: 'Other', // 'Other' type for generic Ledgers
                balance: 0,
                isCredit: false // Default
            });
            if (onClose) onClose();
            else setName('');
        } catch (error) {
            console.error("Failed to create ledger account:", error);
            alert("Failed to create ledger. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl max-w-sm w-full relative">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
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
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 font-medium"
                        placeholder="e.g. Rafey, HDFC, Salary..."
                        autoFocus
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                    Create Ledger
                </button>
            </div>
        </form>
    );
};

export default LedgerForm;
