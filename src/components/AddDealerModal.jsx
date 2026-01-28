"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { X, Building2, Phone, Coins } from "lucide-react";

const AddDealerModal = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        name: "",
        contact: "",
        defaultCurrency: "INR",
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onAdd(formData);
            setFormData({ name: "", contact: "", defaultCurrency: "USD" });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add dealer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-emerald-400" />
                        Add Currency Dealer
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Dealer Name
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                className="w-full bg-slate-800 border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                                placeholder="e.g. Al Ansari Exchange"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Contact Info (Optional)
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                value={formData.contact}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        contact: e.target.value,
                                    })
                                }
                                className="w-full bg-slate-800 border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                                placeholder="+971 50..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Default Currency
                        </label>
                        <div className="relative">
                            <Coins className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                            <select
                                value={formData.defaultCurrency}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        defaultCurrency: e.target.value,
                                    })
                                }
                                className="w-full bg-slate-800 border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
                            >
                                <option value="INR">INR - Indian Rupee</option>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="PKR">
                                    PKR - Pakistani Rupee
                                </option>
                                <option value="PHP">
                                    PHP - Philippine Peso
                                </option>
                                <option value="BDT">
                                    BDT - Bangladeshi Taka
                                </option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                    >
                        {loading ? "Adding..." : "Add Dealer"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddDealerModal;
