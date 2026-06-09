"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import {
    X,
    Plus,
    Trash2,
    Calendar,
    Percent,
    Receipt,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { TRANSACTION_TYPES, SCOPES } from "../utils/constants";

const ManageEMIsModal = ({ account, onClose }) => {
    const { accounts, updateAccount, addTransaction, formatCurrency } =
        useFinance();
    const liveAccount = accounts.find((a) => a._id === account._id) || account;

    const [activeTab, setActiveTab] = useState("list"); // 'list' or 'add'
    const [newEMI, setNewEMI] = useState({
        name: "",
        totalAmount: "",
        tenureMonths: "12",
        interestRate: "",
        gst: "",
        startDate: new Date().toISOString().split("T")[0],
    });

    // Billing confirmation state
    const [billingEMI, setBillingEMI] = useState(null);
    const [billDetails, setBillDetails] = useState({
        amount: "",
        interest: "",
        gst: "",
        date: new Date().toISOString().split("T")[0],
    });

    // Tenure Options
    const tenureOptions = [3, 6, 9, 12, 18, 24];

    const [loading, setLoading] = useState(false);

    // EMIs
    const allEMIs = liveAccount.emis || [];
    const activeEMIs = allEMIs.filter((e) => e.status !== "Closed");

    const handleAddEMI = async (e) => {
        e.preventDefault();
        if (!newEMI.name || !newEMI.totalAmount) return;

        setLoading(true);
        try {
            const principal = parseFloat(newEMI.totalAmount) || 0;
            const rate = parseFloat(newEMI.interestRate) || 0;
            const months = parseInt(newEMI.tenureMonths) || 1;
            const gstRate = parseFloat(newEMI.gst) || 0;

            const emiData = {
                ...newEMI,
                totalAmount: principal,
                remainingAmount: principal, // Initially, full amount is blocked
                interestRate: rate,
                gst: gstRate,
                monthlyPayment: 0, // Optional: User can edit if needed
                status: "Active",
            };

            const updatedEMIs = [...(liveAccount.emis || []), emiData];

            await updateAccount(liveAccount._id, { emis: updatedEMIs });
            setActiveTab("list");
            setNewEMI({
                name: "",
                totalAmount: "",
                tenureMonths: "",
                interestRate: "",
                gst: "",
                startDate: new Date().toISOString().split("T")[0],
            });
            // Context handles success toast for updateAccount
        } catch (error) {
            console.error("Failed to add EMI", error);
            // Context handles error toast for updateAccount
        } finally {
            setLoading(false);
        }
    };

    const handleCloseEMI = async (index) => {
        if (
            !confirm(
                "Are you sure you want to close this EMI? It will no longer block your limit.",
            )
        )
            return;

        try {
            const updatedEMIs = [...(liveAccount.emis || [])];
            updatedEMIs[index].status = "Closed";
            updatedEMIs[index].remainingAmount = 0; // Release limit

            await updateAccount(liveAccount._id, { emis: updatedEMIs });
        } catch (error) {
            console.error("Failed to close EMI", error);
        }
    };

    const handleBillClick = (emi, index) => {
        const monthlyPrincipal = emi.totalAmount / emi.tenureMonths;
        // Default Rates from EMI definition
        const iRate = emi.interestRate || 0;
        const gRate = emi.gst || 0;

        // Simple Interest for 1 Month: (TotalPrincipal * Rate% / 12)
        // Or is it on Reducing Balance? Usually EMI consumer loans are flat or reducing.
        // User asked for manual correction, so default approximation is fine.
        const interestAmount = (emi.totalAmount * iRate) / 100 / 12;
        const gstAmount = interestAmount * (gRate / 100);

        setBillingEMI({ ...emi, index });
        setBillDetails({
            amount: monthlyPrincipal.toFixed(2),
            interestRate: iRate,
            interest: interestAmount.toFixed(2),
            gstRate: gRate,
            gst: gstAmount.toFixed(2),
            date: new Date().toISOString().split("T")[0],
        });
    };

    // Auto-calc handlers
    const updateInterestFromRate = (rate) => {
        const r = parseFloat(rate) || 0;
        // Recalc Interest Amount: (TotalPrincipal * r% / 12)
        const principal = billingEMI.totalAmount; // Always on Total for Flat? Or Remaining?
        // Let's stick to Total as base to be consistent with previous logic,
        // but typically it might be reducing. User has manual override anyway.
        const iAmount = (principal * r) / 100 / 12;

        // Recalc GST too if rate exists
        const gAmount =
            (iAmount * (parseFloat(billDetails.gstRate) || 0)) / 100;

        setBillDetails((prev) => ({
            ...prev,
            interestRate: rate,
            interest: iAmount.toFixed(2),
            gst: gAmount.toFixed(2),
        }));
    };

    const updateGSTFromRate = (rate) => {
        const r = parseFloat(rate) || 0;
        const iAmount = parseFloat(billDetails.interest) || 0;
        const gAmount = (iAmount * r) / 100;

        setBillDetails((prev) => ({
            ...prev,
            gstRate: rate,
            gst: gAmount.toFixed(2),
        }));
    };

    const confirmBill = async (e) => {
        e.preventDefault();
        if (!billingEMI) return;

        setLoading(true);
        try {
            const principal = parseFloat(billDetails.amount);
            const interest = parseFloat(billDetails.interest) || 0;
            const gst = parseFloat(billDetails.gst) || 0;
            const totalBill = principal + interest + gst;

            // 1. Add Transaction
            await addTransaction({
                accountId: liveAccount._id,
                amount: totalBill,
                type: TRANSACTION_TYPES.DEBIT, // Expense
                category: "EMI",
                description: `EMI: ${billingEMI.name} (${(billingEMI.paidMonths || 0) + 1}/${billingEMI.tenureMonths})`,
                date: billDetails.date,
                scope: SCOPES.MANAGER,
            });

            // 2. Update EMI
            const updatedEMIs = [...(liveAccount.emis || [])];
            const emi = updatedEMIs[billingEMI.index];

            emi.paidMonths = (emi.paidMonths || 0) + 1;
            emi.remainingAmount = Math.max(0, emi.remainingAmount - principal);

            if (emi.remainingAmount < 1 || emi.paidMonths >= emi.tenureMonths) {
                emi.status = "Closed";
                emi.remainingAmount = 0;
            }

            await updateAccount(liveAccount._id, { emis: updatedEMIs });
            toast.success("Installment billed successfully");
        } catch (error) {
            console.error("Billing failed", error);
            // If error came from addTransaction, we need to toast.
            // If from updateAccount, already toasted.
            if (!error.message.startsWith("Failed to update account")) {
                toast.error("Billing failed. Please try again.");
            }
        } finally {
            setLoading(false);
            setBillingEMI(null);
        }
    };

    // ... inside render ...

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-finance-card border border-finance-border rounded-2xl w-full max-w-md p-6 relative shadow-2xl flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-white mb-1">
                    Manage EMIs
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                    {liveAccount.name}
                </p>

                {/* Tabs */}
                <div className="flex bg-slate-900/50 p-1 rounded-xl mb-6 shrink-0">
                    <button
                        onClick={() => setActiveTab("list")}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "list" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                    >
                        All EMIs
                    </button>
                    <button
                        onClick={() => setActiveTab("add")}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "add" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                    >
                        Add New EMI
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                    {activeTab === "list" ? (
                        <div className="space-y-3">
                            {allEMIs.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>
                                        No EMIs found. Add one to get started.
                                    </p>
                                </div>
                            ) : (
                                allEMIs.map((emi, i) => (
                                    <div
                                        className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800"
                                        key={i}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-white">
                                                    {emi.name}
                                                </h4>
                                                {emi.status === "Closed" && (
                                                    <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                                                        Closed
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs text-slate-400">
                                                    Principal:{" "}
                                                    <span className="text-emerald-400">
                                                        {formatCurrency(
                                                            emi.totalAmount,
                                                        )}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Blocked:{" "}
                                                    <span className="text-rose-400 font-medium">
                                                        {formatCurrency(
                                                            emi.remainingAmount,
                                                        )}
                                                    </span>
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                                                        {emi.tenureMonths}{" "}
                                                        Months
                                                    </div>
                                                    <div className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                                                        Paid:{" "}
                                                        {emi.paidMonths || 0}/
                                                        {emi.tenureMonths}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {emi.status !== "Closed" && (
                                                <button
                                                    onClick={() =>
                                                        handleBillClick(emi, i)
                                                    }
                                                    className="flex items-center justify-center gap-1 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition-colors shadow-lg shadow-emerald-500/20"
                                                >
                                                    <CheckCircle className="w-3 h-3" />
                                                    Bill
                                                </button>
                                            )}
                                            {emi.status !== "Closed" ? (
                                                <button
                                                    onClick={() =>
                                                        handleCloseEMI(i)
                                                    }
                                                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded"
                                                >
                                                    Close
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        handleDeleteEMI(i)
                                                    }
                                                    className="text-[10px] bg-rose-700 hover:bg-rose-600 text-white px-2 py-1 rounded"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleAddEMI} className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">
                                    Item Name
                                </label>
                                <input
                                    type="text"
                                    value={newEMI.name}
                                    onChange={(e) =>
                                        setNewEMI((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. iPhone 15 EMI"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">
                                    Principal Amount (Blocked)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-500">
                                        ₹
                                    </span>
                                    <input
                                        type="number"
                                        value={newEMI.totalAmount}
                                        onChange={(e) =>
                                            setNewEMI((prev) => ({
                                                ...prev,
                                                totalAmount: e.target.value,
                                            }))
                                        }
                                        placeholder="0.00"
                                        className="w-full pl-8 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-indigo-400 mt-1">
                                    This amount will be blocked from your credit
                                    limit.
                                </p>
                            </div>

                            {/* Tenure Selection */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">
                                    Tenure (Months)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {tenureOptions.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() =>
                                                setNewEMI((prev) => ({
                                                    ...prev,
                                                    tenureMonths: t,
                                                }))
                                            }
                                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${parseInt(
                                                newEMI.tenureMonths,
                                            ) === t
                                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                                                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                                                }`}
                                        >
                                            {t}M
                                        </button>
                                    ))}
                                    <div className="relative w-20">
                                        <input
                                            type="number"
                                            value={newEMI.tenureMonths}
                                            onChange={(e) =>
                                                setNewEMI((prev) => ({
                                                    ...prev,
                                                    tenureMonths:
                                                        e.target.value,
                                                }))
                                            }
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-center text-white focus:outline-none focus:border-indigo-500"
                                            placeholder="Custom"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">
                                        Interest Rate (%)
                                    </label>
                                    <div className="relative">
                                        <Percent className="absolute left-3 top-3.5 w-3 h-3 text-slate-500" />
                                        <input
                                            type="number"
                                            value={newEMI.interestRate}
                                            onChange={(e) =>
                                                setNewEMI((prev) => ({
                                                    ...prev,
                                                    interestRate:
                                                        e.target.value,
                                                }))
                                            }
                                            placeholder="0"
                                            className="w-full pl-8 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">
                                        GST Rate (%)
                                    </label>
                                    <div className="relative">
                                        <Percent className="absolute left-3 top-3.5 w-3 h-3 text-slate-500" />
                                        <input
                                            type="number"
                                            value={newEMI.gst}
                                            onChange={(e) =>
                                                setNewEMI((prev) => ({
                                                    ...prev,
                                                    gst: e.target.value,
                                                }))
                                            }
                                            placeholder="18"
                                            className="w-full pl-8 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl mt-4 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Adding..." : "Add EMI"}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Billing Confirmation Overlay */}
            {billingEMI && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm rounded-2xl animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-5 shadow-2xl">
                        <h4 className="font-bold text-white mb-4">
                            Bill Installment
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-400">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={billDetails.date}
                                    onChange={(e) =>
                                        setBillDetails({
                                            ...billDetails,
                                            date: e.target.value,
                                        })
                                    }
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">
                                    Principal Component (Releases Block)
                                </label>
                                <input
                                    type="number"
                                    value={billDetails.amount}
                                    onChange={(e) =>
                                        setBillDetails({
                                            ...billDetails,
                                            amount: e.target.value,
                                        })
                                    }
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-400">
                                        Interest %
                                    </label>
                                    <input
                                        type="number"
                                        value={billDetails.interestRate}
                                        onChange={(e) =>
                                            updateInterestFromRate(
                                                e.target.value,
                                            )
                                        }
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">
                                        Interest Amt
                                    </label>
                                    <input
                                        type="number"
                                        value={billDetails.interest}
                                        onChange={(e) =>
                                            setBillDetails({
                                                ...billDetails,
                                                interest: e.target.value,
                                            })
                                        }
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-400">
                                        GST %
                                    </label>
                                    <input
                                        type="number"
                                        value={billDetails.gstRate}
                                        onChange={(e) =>
                                            updateGSTFromRate(e.target.value)
                                        }
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">
                                        GST Amt
                                    </label>
                                    <input
                                        type="number"
                                        value={billDetails.gst}
                                        onChange={(e) =>
                                            setBillDetails({
                                                ...billDetails,
                                                gst: e.target.value,
                                            })
                                        }
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="py-2 mt-2 border-t border-slate-800">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-slate-400">
                                        Total Transaction:
                                    </span>
                                    <span className="text-emerald-400">
                                        {formatCurrency(
                                            (parseFloat(billDetails.amount) || 0) * 100 +
                                            (parseFloat(billDetails.interest) || 0) * 100 +
                                            (parseFloat(billDetails.gst) || 0) * 100
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setBillingEMI(null)}
                                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmBill}
                                    disabled={loading}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors"
                                >
                                    {loading ? "Processing..." : "Confirm Bill"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageEMIsModal;
