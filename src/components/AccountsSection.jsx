
import React, { useState } from 'react';
import { CreditCard, Landmark, Banknote, Plus, X, Wallet } from 'lucide-react'; // Banknote replaced with Wallet if needed, checking imports usually
import { useFinance } from '../context/FinanceContext';

const AccountsSection = () => {
    const { accounts, createAccount } = useFinance();
    const [showAdd, setShowAdd] = useState(false);
    const [newAccount, setNewAccount] = useState({ name: '', type: 'Bank', balance: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newAccount.name) return;
        await createAccount({
            ...newAccount,
            balance: parseFloat(newAccount.balance) || 0
        });
        setShowAdd(false);
        setNewAccount({ name: '', type: 'Bank', balance: '' });
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Credit Card': return <CreditCard className="w-6 h-6 text-purple-400" />;
            case 'Cash': return <Wallet className="w-6 h-6 text-green-400" />;
            case 'Bank': return <Landmark className="w-6 h-6 text-blue-400" />;
            default: return <Wallet className="w-6 h-6 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Accounts & Cards</h3>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Account
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Account Cards */}
                {accounts.map(account => (
                    <div key={account._id} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/30 rounded-xl p-4 transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-slate-900/50 rounded-lg">
                                {getIcon(account.type)}
                            </div>
                            <span className={`text-sm font-medium ${account.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {account.currency} {account.balance.toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{account.type}</p>
                            <p className="text-white font-medium truncate">{account.name}</p>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {accounts.length === 0 && (
                    <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
                        <p>No accounts added yet.</p>
                        <button onClick={() => setShowAdd(true)} className="text-blue-400 hover:underline mt-2 text-sm">Add your first account</button>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200 shadow-2xl">
                        <button
                            onClick={() => setShowAdd(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-6">Add New Account</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Account Name</label>
                                <input
                                    type="text"
                                    value={newAccount.name}
                                    onChange={e => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. HDFC Bank, My Wallet"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Type</label>
                                <select
                                    value={newAccount.type}
                                    onChange={e => setNewAccount(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none"
                                >
                                    <option value="Bank">Bank Account</option>
                                    <option value="Credit Card">Credit Card</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Initial Balance</label>
                                <input
                                    type="number"
                                    value={newAccount.balance}
                                    onChange={e => setNewAccount(prev => ({ ...prev, balance: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl mt-2 transition-colors"
                            >
                                Create Account
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountsSection;
