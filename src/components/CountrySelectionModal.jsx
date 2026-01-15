'use client';

import React from 'react';
import { useFinance, CURRENCIES } from '../context/FinanceContext';
import { Globe, Check } from 'lucide-react';

const CountrySelectionModal = () => {
    const { isCurrencySet, setCurrency, currency } = useFinance();

    if (isCurrencySet) return null;

    const countries = [
        { code: 'INR', flag: '🇮🇳', name: 'India' },
        { code: 'AED', flag: '🇦🇪', name: 'UAE' },
        { code: 'USD', flag: '🇺🇸', name: 'USA' },
        { code: 'GBP', flag: '🇬🇧', name: 'UK' },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-finance-card border border-finance-border rounded-2xl w-full max-w-lg p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">

                <div className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <img src="/mint-logo.png" alt="Mint Accounts" className="w-full h-full object-contain rounded-2xl shadow-2xl shadow-emerald-900/50" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to MintAccounts</h2>
                    <p className="text-slate-400">Choose your country to set up your currency.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {countries.map((c) => (
                        <button
                            key={c.code}
                            onClick={() => setCurrency(c.code)}
                            className="flex items-center gap-4 p-4 rounded-xl border border-finance-border bg-finance-bg/50 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all group"
                        >
                            <span className="text-4xl">{c.flag}</span>
                            <div className="text-left">
                                <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">{c.name}</p>
                                <p className="text-xs text-slate-500 font-mono">{CURRENCIES[c.code].code} ({CURRENCIES[c.code].symbol})</p>
                            </div>
                            {/* Visual indicator handled by click, no selection state needed normally as it closes matches */}
                        </button>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-600">You can change this later in settings.</p>
                </div>
            </div>
        </div>
    );
};

export default CountrySelectionModal;
