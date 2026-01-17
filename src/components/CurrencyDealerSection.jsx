'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, ArrowRight, Users } from 'lucide-react';
import AddDealerModal from './AddDealerModal';
import AddCustomerModal from './AddCustomerModal';
import DealerDetailView from './DealerDetailView';
import CustomerDetailView from './CustomerDetailView'; // Will create this

const CurrencyDealerSection = () => {
    const [viewMode, setViewMode] = useState('dealers'); // 'dealers' or 'customers'
    const [dealers, setDealers] = useState([]);
    const [customers, setCustomers] = useState([]);

    // Selection state
    const [selectedDealer, setSelectedDealer] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Modals
    const [isAddDealerModalOpen, setIsAddDealerModalOpen] = useState(false);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);

    const fetchDealers = async () => {
        try {
            const res = await fetch('/api/currency-dealers');
            if (res.ok) setDealers(await res.json());
        } catch (error) { console.error(error); }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/currency-customers');
            if (res.ok) setCustomers(await res.json());
        } catch (error) { console.error(error); }
    };

    const fetchAll = async () => {
        setLoading(true);
        await Promise.all([fetchDealers(), fetchCustomers()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleAddDealer = async (dealerData) => {
        const res = await fetch('/api/currency-dealers', {
            method: 'POST',
            body: JSON.stringify(dealerData),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) fetchDealers();
    };

    const handleAddCustomer = async (customerData) => {
        const res = await fetch('/api/currency-customers', {
            method: 'POST',
            body: JSON.stringify(customerData),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) fetchCustomers();
    };

    // Navigation Logic
    if (selectedDealer) {
        return (
            <DealerDetailView
                dealerId={selectedDealer._id}
                onBack={() => { setSelectedDealer(null); fetchAll(); }}
            />
        );
    }

    if (selectedCustomer) {
        return (
            <CustomerDetailView
                customerId={selectedCustomer._id}
                onBack={() => { setSelectedCustomer(null); fetchAll(); }}
            />
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent font-kalam">
                        Currency Exchange
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Manage dealers, customers, and trades</p>
                </div>

                <button
                    onClick={() => viewMode === 'dealers' ? setIsAddDealerModalOpen(true) : setIsAddCustomerModalOpen(true)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    {viewMode === 'dealers' ? 'New Dealer' : 'New Customer'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-800 rounded-xl w-full md:w-fit">
                <button
                    onClick={() => setViewMode('dealers')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'dealers'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Dealers
                </button>
                <button
                    onClick={() => setViewMode('customers')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'customers'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Customers
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading...</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* View Mode Summary */}
                    {viewMode === 'customers' && customers.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-900/40 to-slate-900/40 border border-blue-500/20 p-4 rounded-2xl flex justify-between items-center shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Users className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Total Pending</h3>
                                    <p className="text-xs text-slate-500">Total amount needed to collect</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-white font-mono block">
                                    {customers.reduce((acc, c) => acc + (c.balance || 0), 0).toFixed(2)} <span className="text-sm text-slate-400">AED</span>
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {viewMode === 'dealers' ? (
                            dealers.length === 0 ? (
                                <div className="col-span-full text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                                    <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-slate-300">No Dealers Yet</h3>
                                </div>
                            ) : dealers.map(dealer => (
                                <div
                                    key={dealer._id}
                                    onClick={() => setSelectedDealer(dealer)}
                                    className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/30 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-emerald-900/10"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 group-hover:border-emerald-500/30 transition-colors">
                                            <Building2 className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 -mr-2 transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-200 mb-1">{dealer.name}</h3>
                                    <p className="text-sm text-slate-500 mb-4">{dealer.contact || 'No contact info'}</p>
                                    <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Balance</span>
                                        <span className={`font-mono font-bold ${dealer.balance >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                            {typeof dealer.balance === 'number' ? `${Math.abs(dealer.balance).toFixed(2)} AED` : '0.00 AED'}
                                        </span>
                                    </div>
                                    <div className="flex justify-end mt-1">
                                        <span className="text-[10px] text-slate-500">
                                            {dealer.balance > 0 ? '(You Owe)' : dealer.balance < 0 ? '(Owes You)' : '(Settled)'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            customers.length === 0 ? (
                                <div className="col-span-full text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-slate-300">No Customers Yet</h3>
                                </div>
                            ) : customers.map(customer => (
                                <div
                                    key={customer._id}
                                    onClick={() => setSelectedCustomer(customer)}
                                    className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-blue-500/30 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-blue-900/10" // Blue theme for customers?
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 group-hover:border-blue-500/30 transition-colors">
                                            <Users className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 -mr-2 transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-200 mb-1">{customer.name}</h3>
                                    <p className="text-sm text-slate-500 mb-4">{customer.contact || 'No contact info'}</p>
                                    <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Balance</span>
                                        <span className={`font-mono font-bold ${customer.balance > 0 ? "text-emerald-400" : customer.balance < 0 ? "text-rose-400" : "text-slate-200"}`}>
                                            {typeof customer.balance === 'number' ? `${Math.abs(customer.balance).toFixed(2)} AED` : '0.00 AED'}
                                        </span>
                                    </div>
                                    <div className="flex justify-end mt-1">
                                        <span className="text-[10px] text-slate-500">
                                            {customer.balance > 0 ? '(Owes You)' : customer.balance < 0 ? '(You Owe)' : '(Settled)'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <AddDealerModal
                isOpen={isAddDealerModalOpen}
                onClose={() => setIsAddDealerModalOpen(false)}
                onAdd={handleAddDealer}
            />
            <AddCustomerModal
                isOpen={isAddCustomerModalOpen}
                onClose={() => setIsAddCustomerModalOpen(false)}
                onAdd={handleAddCustomer}
            />
        </div>
    );
};

export default CurrencyDealerSection;
