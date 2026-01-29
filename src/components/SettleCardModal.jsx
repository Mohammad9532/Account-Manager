"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import {
    X,
    Check,
    Wallet,
    Landmark,
    Banknote,
    AlertCircle,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { TRANSACTION_TYPES, SCOPES } from "../utils/constants";

const SettleCardModal = ({ account, initialAmount, onClose }) => {
    const { accounts, addTransaction, formatCurrency } = useFinance();
    const [sourceAccountId, setSourceAccountId] = useState("");
    const [amount, setAmount] = useState(initialAmount || "");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const sourceAccounts = accounts.filter((a) =>
        ["Bank", "Cash"].includes(a.type),
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!sourceAccountId || !amount) return;

        setIsSubmitting(true);
        try {
            const sourceAccount = accounts.find(
                (a) => a._id === sourceAccountId,
            );

            await addTransaction({
                accountId: sourceAccountId,
                amount: parseFloat(amount),
                type: TRANSACTION_TYPES.DEBIT, // Debit from Source (Bank/Cash)
                category: "CC Settlement",
                description: `Settlement to ${account.name}`,
                date: new Date(date),
                linkedAccountId: account._id,
                scope: SCOPES.MANAGER,
            });
            onClose();
            toast.success("Card settled successfully!");
        } catch (error) {
            console.error("Settlement failed:", error);
            toast.error("Settlement failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-finance-bg border border-finance-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-finance-border flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                    <div>
                        <h3 className="text-xl font-bold text-finance-text leading-tight">
                            Settle {account.name}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 uppercase tracking-wider font-semibold">
                            Credit Card Settlement
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Source Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
                            Pay From
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {sourceAccounts.map((acc) => (
                                <button
                                    key={acc._id}
                                    type="button"
                                    onClick={() => setSourceAccountId(acc._id)}
                                    className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${sourceAccountId === acc._id
                                            ? "bg-blue-600/20 border-blue-500 ring-1 ring-blue-500 shadow-lg shadow-blue-500/10"
                                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                        }`}
                                >
                                    <div
                                        className={`p-2 rounded-xl mb-2 ${sourceAccountId === acc._id ? "bg-blue-500 text-white" : "bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-400"}`}
                                    >
                                        {acc.type === "Bank" ? (
                                            <Landmark className="w-5 h-5" />
                                        ) : (
                                            <Wallet className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs font-bold truncate w-full text-center ${sourceAccountId === acc._id ? "text-blue-600 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
                                    >
                                        {acc.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
                            Settlement Amount
                        </label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xl">
                                ₹
                            </span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-finance-text rounded-2xl py-4 pl-10 pr-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-2xl font-bold"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 px-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Pre-filled with current outstanding balance.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !sourceAccountId}
                        className={`w-full py-4 rounded-2xl font-bold transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${isSubmitting || !sourceAccountId
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20"
                            }`}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Confirm Settlement
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SettleCardModal;
