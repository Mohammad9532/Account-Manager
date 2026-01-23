
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Calculator, ArrowRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const DailyCashCheckModal = ({ isOpen, onClose }) => {
    const { accounts, getDailyCashStatus, submitDailyCashCheck, formatCurrency } = useFinance();

    const [step, setStep] = useState('select'); // select | verify | success
    const [selectedAccount, setSelectedAccount] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkData, setCheckData] = useState(null);
    const [actualBalance, setActualBalance] = useState('');
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [autoAdjust, setAutoAdjust] = useState(true);

    // Filter for Cash accounts only
    const cashAccounts = accounts.filter(a => a.type === 'Cash' || a.type === 'Cash (Office)');

    useEffect(() => {
        if (isOpen) {
            setStep('select');
            setCheckData(null);
            setActualBalance('');
            setReason('');
            setNote('');
            setAutoAdjust(true);

            // Auto-select if only one cash account
            if (cashAccounts.length === 1) {
                handleAccountSelect(cashAccounts[0]._id);
            } else if (cashAccounts.length > 0) {
                // Pre-select first but stay on select screen
                setSelectedAccount(cashAccounts[0]._id);
            }
        }
    }, [isOpen]);

    const handleAccountSelect = async (accountId) => {
        setSelectedAccount(accountId);
        setLoading(true);
        try {
            const data = await getDailyCashStatus(accountId);
            setCheckData(data);
            setStep('verify');
        } catch (error) {
            console.error(error);
            alert("Failed to load cash status.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                accountId: selectedAccount,
                date: new Date(), // Today
                openingBalance: checkData.openingBalance,
                totalIn: checkData.totalIn,
                totalOut: checkData.totalOut,
                expectedBalance: checkData.expectedBalance,
                actualBalance: parseFloat(actualBalance),
                reason,
                note,
                autoAdjust
            };

            await submitDailyCashCheck(payload);
            setStep('success');
        } catch (error) {
            console.error(error);
            alert("Failed to submit check.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const difference = checkData ? (parseFloat(actualBalance || 0) - checkData.expectedBalance) : 0;
    const isMatch = Math.abs(difference) < 0.01;
    const isShort = difference < -0.01;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg p-0 relative shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-600" />
                        Daily Cash Check
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'select' && (
                        <div className="space-y-4">
                            <p className="text-slate-600">Select cash account to verify:</p>
                            <div className="grid gap-3">
                                {cashAccounts.length === 0 ? (
                                    <p className="text-amber-600 text-sm">No Cash accounts found. Please add a Cash account first.</p>
                                ) : (
                                    cashAccounts.map(acc => (
                                        <button
                                            key={acc._id}
                                            onClick={() => handleAccountSelect(acc._id)}
                                            disabled={loading}
                                            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
                                        >
                                            <div>
                                                <span className="font-bold text-slate-900 block">{acc.name}</span>
                                                <span className="text-sm text-slate-500">Current: {formatCurrency(acc.balance)}</span>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'verify' && checkData && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-slate-500 block text-xs uppercase font-bold">Opening Balance</span>
                                    <span className="font-mono text-slate-900 font-bold">{formatCurrency(checkData.openingBalance)}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-slate-500 block text-xs uppercase font-bold">System Closing</span>
                                    <span className="font-mono text-slate-900 font-bold">{formatCurrency(checkData.expectedBalance)}</span>
                                </div>
                                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                    <span className="text-emerald-600 block text-xs uppercase font-bold">Total In</span>
                                    <span className="font-mono text-emerald-700 font-bold">+{formatCurrency(checkData.totalIn)}</span>
                                </div>
                                <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                                    <span className="text-rose-600 block text-xs uppercase font-bold">Total Out</span>
                                    <span className="font-mono text-rose-700 font-bold">-{formatCurrency(checkData.totalOut)}</span>
                                </div>
                            </div>

                            {/* Actual Check Input */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Count your physical cash
                                </label>
                                <div className="relative max-w-xs mx-auto">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">₹</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={actualBalance}
                                        onChange={(e) => setActualBalance(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 text-2xl font-bold font-mono text-center rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Difference Calculation */}
                            {actualBalance !== '' && (
                                <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${isMatch
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                        : 'bg-amber-50 border-amber-200 text-amber-800'
                                    }`}>
                                    {isMatch ? <CheckCircle className="w-6 h-6 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-6 h-6 shrink-0 text-amber-600" />}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold">{isMatch ? 'Perfect Match!' : (isShort ? 'Cash Shortage' : 'Excess Cash')}</span>
                                            <span className="font-mono font-bold text-lg">{difference > 0 ? '+' : ''}{difference.toLocaleString()}</span>
                                        </div>
                                        {!isMatch && <p className="text-xs opacity-90">Please specify a reason below.</p>}
                                    </div>
                                </div>
                            )}

                            {/* Mismatch Handling */}
                            {!isMatch && actualBalance !== '' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                                        <select
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700"
                                            required={!isMatch}
                                        >
                                            <option value="">Select Reason...</option>
                                            <option value="Small Expenses">Small expenses not recorded (Tea/Snacks)</option>
                                            <option value="Rounding">Rounding / Change issue</option>
                                            <option value="Profit Taken">Profit Taken</option>
                                            <option value="Counting Error">Counting Error (Will recheck)</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
                                        <input
                                            type="text"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className="w-full p-2.5 rounded-lg border border-slate-300"
                                            placeholder="Details..."
                                        />
                                    </div>
                                    <div className="flex items-start gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="autoAdjust"
                                            checked={autoAdjust}
                                            onChange={(e) => setAutoAdjust(e.target.checked)}
                                            className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                        />
                                        <label htmlFor="autoAdjust" className="text-sm text-slate-600">
                                            <span className="font-medium text-slate-900 block">Auto-create adjustment entry</span>
                                            This will add a transaction to fix the balance.
                                        </label>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || (actualBalance === '')}
                                className="w-full py-4 text-white font-bold text-lg rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-200"
                            >
                                {loading ? 'Saving...' : 'Submit Daily Check'}
                            </button>
                        </form>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Cash Check Saved!</h2>
                            <p className="text-slate-600 mb-8">
                                Your verified balance has been recorded for today.
                            </p>
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyCashCheckModal;
