'use client';

import React, { useMemo } from 'react';
import { Users, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { SCOPES, TRANSACTION_TYPES } from '../utils/constants';
import { useFinance } from '../context/FinanceContext';

const TopExposures = ({ transactions }) => {
    const exposures = useMemo(() => {
        const groups = {};

        transactions.forEach(t => {
            if ((t.scope || SCOPES.MANAGER) !== SCOPES.MANAGER) return;
            const name = (t.description || 'Unknown').trim();
            const key = name.toLowerCase();
            const amt = parseFloat(t.amount);
            const isCredit = t.type === TRANSACTION_TYPES.CREDIT;
            const signedAmt = isCredit ? amt : -amt; // Credit (+) I received, Debit (-) I paid/gave

            if (!groups[key]) groups[key] = { name: t.description, balance: 0 };
            groups[key].balance += signedAmt;
        });

        // Convert to array
        const list = Object.values(groups).map(g => ({
            name: g.name,
            balance: g.balance,
            absBalance: Math.abs(g.balance)
        }));

        // Filter out zero or near-zero balances
        const active = list.filter(i => i.absBalance > 1);

        // Sort by magnitude (highest exposure first)
        active.sort((a, b) => b.absBalance - a.absBalance);

        // Take top 4
        return active.slice(0, 4);
    }, [transactions]);

    if (exposures.length === 0) return null;

    return (
        <div className="bg-finance-card rounded-2xl border border-finance-border overflow-hidden shadow-xl mb-6">
            <div className="p-4 border-b border-finance-border flex justify-between items-center bg-finance-card/50 backdrop-blur-sm">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    Top Exposures
                </h3>
                <span className="text-xs text-slate-400 font-mono">WHO IS HOLDING MONEY?</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700">
                {exposures.map((item, i) => {
                    // Logic: 
                    // Balance < 0: I paid more than received -> They owe me (Receivable) -> Green/Asset?
                    // User said: "Rafey owes ₹____" (Receivable). "HDFC credit used" (Payable).
                    // Let's stick to: Negative = They Owe Me (Asset). Positive = I Owe Them (Liability).
                    // Wait, standard accounting: 
                    // Debit (gave money) -> Balance decreases? 
                    // Let's re-verify FinanceContext logic.
                    // Credit (+), Debit (-). 
                    // If I give 1000 (Debit -1000), Balance is -1000. 
                    // If they give back 0, Balance is -1000. They owe me 1000. 
                    // So Negative = Receivable.

                    const isReceivable = item.balance < 0;

                    return (
                        <div key={i} className="p-4 flex justify-between items-center hover:bg-slate-700/30 transition-colors">
                            <div>
                                <p className="text-white font-bold truncate max-w-[150px]">{item.name}</p>
                                <p className={`text-xs ${isReceivable ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isReceivable ? 'Owes you' : 'You owe'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className={`font-mono font-bold text-lg ${isReceivable ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatCurrency(item.absBalance)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TopExposures;
