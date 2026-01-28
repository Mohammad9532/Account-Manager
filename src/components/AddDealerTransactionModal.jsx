"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    X,
    ArrowRightLeft,
    Calculator,
    Banknote,
    RefreshCcw,
    UserPlus,
    ArrowRight,
    Wallet,
    Receipt,
} from "lucide-react";

const AddDealerTransactionModal = ({
    isOpen,
    onClose,
    dealer,
    onAddTransaction,
}) => {
    // ... (rest of component until handleSubmit)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (activeTab === "trade") {
                // ... (trade logic)
                // 1. Dealer Transaction (Buy / Cost)
                const dealerTxn = {
                    date,
                    type: "buy", // We owe dealer
                    foreignCurrency,
                    foreignAmount: parseFloat(calc.foreignAmount.toFixed(2)),
                    exchangeRate: parseFloat(dealerRate),
                    localAmount: parseFloat(calc.dealerCost.toFixed(2)), // Our Cost
                    description:
                        description ||
                        `Trade - Cust: ${customers.find((c) => c._id === selectedCustomerId)?.name || newCustomerName}`,
                };

                await onAddTransaction(dealerTxn);

                // 2. Customer Transaction (Sell / Revenue)
                let custId = selectedCustomerId;
                if (showNewCustomerInput && newCustomerName) {
                    const newCustRes = await fetch("/api/currency-customers", {
                        method: "POST",
                        body: JSON.stringify({ name: newCustomerName }),
                        headers: { "Content-Type": "application/json" },
                    });
                    if (newCustRes.ok) {
                        const newCust = await newCustRes.json();
                        custId = newCust._id;
                    }
                }

                if (custId) {
                    const customerTxn = {
                        date,
                        type: "sell", // Customer owes us
                        foreignCurrency,
                        foreignAmount: parseFloat(
                            calc.foreignAmount.toFixed(2),
                        ),
                        exchangeRate: parseFloat(customerRate),
                        localAmount: parseFloat(collectionAmount), // Revenue
                        description: `Trade via ${dealer.name}`,
                        dealerReferenceId: dealer._id,
                    };

                    await fetch(`/api/currency-customers/${custId}`, {
                        method: "PUT",
                        body: JSON.stringify({
                            $push: { transactions: customerTxn },
                        }),
                        headers: { "Content-Type": "application/json" },
                    });

                    // 3. Instant Receipt (if any)
                    if (
                        instantReceiptAmount &&
                        parseFloat(instantReceiptAmount) > 0
                    ) {
                        const receiptTxn = {
                            date,
                            type: "receipt", // Customer paid us
                            localAmount: parseFloat(instantReceiptAmount),
                            description: `Instant payment for trade via ${dealer.name}`,
                        };
                        await fetch(`/api/currency-customers/${custId}`, {
                            method: "PUT",
                            body: JSON.stringify({
                                $push: { transactions: receiptTxn },
                            }),
                            headers: { "Content-Type": "application/json" },
                        });
                    }
                }
            } else {
                // Payment or Receipt (Cash logic)
                // Just simple transaction on Dealer
                await onAddTransaction({
                    date,
                    type: activeTab, // 'payment' or 'receipt'
                    localAmount: parseFloat(paymentAmount),
                    description: description,
                });
            }

            onClose();
            toast.success("Transaction recorded successfully");
            // Reset
            setCollectionAmount("");
            setForeignAmountInput("");
            setCustomerRate("");
            setDealerRate("");
            setPaymentAmount("");
            setDescription("");
            setDescription("");
            setSelectedCustomerId("");
            setNewCustomerName("");
            setInstantReceiptAmount("");
            setSelectedCustomerBalance(0);
        } catch (error) {
            console.error(error);
            toast.error("Failed to record transaction");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {activeTab === "trade" && (
                                <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                            )}
                            {activeTab === "payment" && (
                                <Wallet className="w-5 h-5 text-rose-400" />
                            )}
                            {activeTab === "receipt" && (
                                <Receipt className="w-5 h-5 text-blue-400" />
                            )}
                            {activeTab === "trade"
                                ? "Sell to Customer"
                                : activeTab === "payment"
                                  ? "Make Payment"
                                  : "Receive Money"}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Dealer: {dealer?.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Tabs */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-800 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setActiveTab("trade")}
                            className={`py-3 text-sm font-bold rounded-lg transition-all ${activeTab === "trade" ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
                        >
                            Sell to Customer
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("payment")}
                            className={`py-3 text-sm font-bold rounded-lg transition-all ${activeTab === "payment" ? "bg-rose-500 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
                        >
                            Payment
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("receipt")}
                            className={`py-3 text-sm font-bold rounded-lg transition-all ${activeTab === "receipt" ? "bg-blue-500 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
                        >
                            Receipt
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Date
                        </label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-slate-800 border-slate-700 text-white px-4 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                        />
                    </div>

                    {activeTab === "trade" && (
                        <div className="space-y-5 animate-in slide-in-from-bottom-2">
                            {/* Mode Toggle */}
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                                    Logic:{" "}
                                    {rateType === "inverse"
                                        ? "AED x Rate = FC"
                                        : "AED / Rate = FC"}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setRateType((prev) =>
                                            prev === "direct"
                                                ? "inverse"
                                                : "direct",
                                        )
                                    }
                                    className="text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                                >
                                    <RefreshCcw className="w-3 h-3" /> Swap
                                </button>
                            </div>

                            {/* Customer Select */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Customer
                                </label>
                                {!showNewCustomerInput ? (
                                    <div className="flex gap-2">
                                        <select
                                            required={activeTab === "trade"}
                                            value={selectedCustomerId}
                                            onChange={(e) => {
                                                const cw = customers.find(
                                                    (c) =>
                                                        c._id ===
                                                        e.target.value,
                                                );
                                                setSelectedCustomerId(
                                                    e.target.value,
                                                );
                                                setSelectedCustomerBalance(
                                                    cw ? cw.balance : 0,
                                                );
                                            }}
                                            className="flex-1 bg-slate-800 border-slate-700 text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">
                                                Select Customer...
                                            </option>
                                            {customers.map((c) => (
                                                <option
                                                    key={c._id}
                                                    value={c._id}
                                                >
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowNewCustomerInput(true)
                                            }
                                            className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white"
                                        >
                                            <UserPlus className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCustomerName}
                                            onChange={(e) =>
                                                setNewCustomerName(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Enter new customer name"
                                            className="flex-1 bg-slate-800 border-emerald-500 text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowNewCustomerInput(false)
                                            }
                                            className="p-2.5 text-slate-400 hover:text-white"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Collection & Customer Rate */}
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-emerald-400">
                                        Collection Amount (from Customer)
                                    </label>
                                    <div className="relative">
                                        <Banknote className="absolute left-3 top-2.5 w-5 h-5 text-emerald-500" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={collectionAmount}
                                            onChange={(e) =>
                                                handleCollectionChange(
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full bg-slate-900 border-emerald-500/30 text-emerald-300 font-bold pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                            placeholder="e.g. 1000 AED"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">
                                        Customer Rate (Selling)
                                    </label>
                                    <div className="relative">
                                        <Calculator className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                                        <input
                                            type="number"
                                            step="0.0001"
                                            required
                                            value={customerRate}
                                            onChange={(e) =>
                                                handleRateChange(e.target.value)
                                            }
                                            className="w-full bg-slate-900 border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="e.g. 22.80"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-emerald-400">
                                        Foreign Amount (Sending)
                                    </label>
                                    <div className="relative">
                                        <Banknote className="absolute left-3 top-2.5 w-5 h-5 text-emerald-500" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={foreignAmountInput}
                                            onChange={(e) =>
                                                handleForeignChange(
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full bg-slate-900 border-emerald-500/30 text-emerald-300 font-bold pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                            placeholder={`e.g. 22000 ${foreignCurrency}`}
                                        />
                                        <span className="absolute right-4 top-2.5 text-xs text-slate-500 font-mono font-bold pt-1">
                                            {foreignCurrency}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Balance & Total Due */}
                            {(selectedCustomerId || showNewCustomerInput) && (
                                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">
                                            Previous Balance
                                        </span>
                                        <span
                                            className={`font-mono font-bold ${selectedCustomerBalance > 0 ? "text-emerald-400" : "text-slate-500"}`}
                                        >
                                            {selectedCustomerBalance?.toFixed(
                                                2,
                                            )}{" "}
                                            AED
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">
                                            + This Trade
                                        </span>
                                        <span className="font-mono font-bold text-white">
                                            {collectionAmount
                                                ? parseFloat(
                                                      collectionAmount,
                                                  ).toFixed(2)
                                                : "0.00"}{" "}
                                            AED
                                        </span>
                                    </div>
                                    <div className="h-px bg-slate-700" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-bold">
                                            Total Due
                                        </span>
                                        <span className="font-mono font-bold text-lg text-emerald-400">
                                            {(
                                                (parseFloat(
                                                    selectedCustomerBalance,
                                                ) || 0) +
                                                (parseFloat(collectionAmount) ||
                                                    0)
                                            ).toFixed(2)}{" "}
                                            AED
                                        </span>
                                    </div>

                                    <div className="pt-2">
                                        <label className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1 block">
                                            Amount He Is Paying Now
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={instantReceiptAmount}
                                            onChange={(e) =>
                                                setInstantReceiptAmount(
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full bg-slate-900 border-emerald-500/50 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Enter amount if paying now..."
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center text-slate-500">
                                <ArrowRight className="w-5 h-5 rotate-90" />
                            </div>

                            {/* Dealer Cost */}
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-rose-300">
                                        Dealer Rate (Cost)
                                    </label>
                                    <div className="relative">
                                        <Calculator className="absolute left-3 top-2.5 w-5 h-5 text-rose-500/50" />
                                        <input
                                            type="number"
                                            step="0.0001"
                                            required
                                            value={dealerRate}
                                            onChange={(e) =>
                                                setDealerRate(e.target.value)
                                            }
                                            className="w-full bg-slate-900 border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-rose-500/50"
                                            placeholder="e.g. 23.00"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                                    <span className="text-xs text-slate-500">
                                        Pay to Dealer
                                    </span>
                                    <span className="font-mono text-rose-400 font-bold">
                                        {calc.dealerCost.toFixed(2)} AED
                                    </span>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                <span className="text-slate-400">
                                    Net Profit
                                </span>
                                <span
                                    className={`text-xl font-bold font-mono ${calc.profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                                >
                                    {calc.profit.toFixed(2)} AED
                                </span>
                            </div>
                        </div>
                    )}

                    {(activeTab === "payment" || activeTab === "receipt") && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-white">
                                    {activeTab === "payment"
                                        ? "Payment Amount (AED)"
                                        : "Receipt Amount (AED)"}
                                </label>
                                <div className="relative">
                                    <Banknote
                                        className={`absolute left-3 top-2.5 w-5 h-5 ${activeTab === "payment" ? "text-rose-500" : "text-blue-500"}`}
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={paymentAmount}
                                        onChange={(e) =>
                                            setPaymentAmount(e.target.value)
                                        }
                                        className="w-full bg-slate-800 border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Description
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-800 border-slate-700 text-white px-4 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500/50"
                            placeholder="Optional notes..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] mt-4 
                        ${activeTab === "trade" ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" : ""}
                        ${activeTab === "payment" ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20" : ""}
                        ${activeTab === "receipt" ? "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20" : ""}`}
                    >
                        {loading ? "Processing..." : "Confirm Transaction"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddDealerTransactionModal;
