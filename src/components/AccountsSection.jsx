'use client';

import React, { useState } from 'react';
import { CreditCard, Landmark, Banknote, Plus, X, Wallet, Trash2, Pencil } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import EditAccountModal from './EditAccountModal';

const AccountsSection = ({ onAccountClick }) => {
    const { accounts, createAccount, deleteAccount } = useFinance();
    const [showAdd, setShowAdd] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [newAccount, setNewAccount] = useState({ name: '', type: 'Bank', balance: '', creditLimit: '', billDay: '', dueDay: '', currency: 'INR', linkedAccountId: null });

    // Group accounts
    const grouped = React.useMemo(() => {
        const others = accounts.filter(a => a.type !== 'Credit Card');
        const creditCards = accounts.filter(a => a.type === 'Credit Card');

        const heads = creditCards.filter(a => !a.linkedAccountId);
        const families = heads.map(head => ({
            head,
            children: creditCards.filter(a => a.linkedAccountId === head._id)
        }));

        return { others, families };
    }, [accounts]);

    const handleAddConnected = (parentId) => {
        setNewAccount({
            name: '',
            type: 'Credit Card',
            balance: '',
            creditLimit: '', // Will be ignored
            billDay: '',
            dueDay: '',
            currency: 'INR',
            linkedAccountId: parentId
        });
        setShowAdd(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newAccount.name) return;

        let calculatedBalance = parseFloat(newAccount.balance) || 0;
        const limit = parseFloat(newAccount.creditLimit) || 0;

        // For Head Credit Cards, the input 'balance' represents 'Available Credit'
        // Actual Balance (Debt) = Available - Limit
        // Example: Limit 30k, Available 10k -> Balance = 10k - 30k = -20k (Debt)
        if (newAccount.type === 'Credit Card' && !newAccount.linkedAccountId) {
            calculatedBalance = calculatedBalance - limit;
        }

        await createAccount({
            ...newAccount,
            balance: calculatedBalance,
            creditLimit: newAccount.linkedAccountId ? 0 : limit,
            billDay: parseInt(newAccount.billDay) || null,
            dueDay: parseInt(newAccount.dueDay) || null,
            linkedAccountId: newAccount.linkedAccountId || null
        });
        setShowAdd(false);
        setNewAccount({ name: '', type: 'Bank', balance: '', creditLimit: '', billDay: '', dueDay: '', currency: 'INR', linkedAccountId: null });
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete account "${name}"? This action cannot be undone.`)) {
            await deleteAccount(id);
        }
    };

    const handleResetData = async () => {
        console.log("Reset button clicked");
        if (window.confirm('WARNING: This will delete ALL accounts and transactions. This cannot be undone. Are you sure?')) {
            if (window.confirm('Double check: Are you absolutely sure you want to reset all data for this user?')) {
                try {
                    const res = await fetch('/api/reset-data', { method: 'DELETE' });
                    if (res.ok) {
                        alert('All data has been reset.');
                        window.location.reload();
                    } else {
                        const errorData = await res.json();
                        console.error('Reset failed:', errorData);
                        alert(`Failed to reset data: ${errorData.error || 'Unknown error'}`);
                    }
                } catch (error) {
                    console.error('Reset error:', error);
                    alert(`Error resetting data: ${error.message}`);
                }
            }
        }
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
                <div className="flex gap-3">
                    <button
                        onClick={handleResetData}
                        className="text-xs text-rose-500 hover:text-rose-400 hover:underline px-3 py-2"
                        title="Delete All Data"
                    >
                        Reset All Data
                    </button>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Account
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Non-Credit Card Accounts */}
                {grouped.others.map(account => (
                    <AccountCard
                        key={account._id}
                        account={account}
                        onClick={onAccountClick}
                        onEdit={setEditingAccount}
                        onDelete={handleDelete}
                        getIcon={getIcon}
                    />
                ))}

                {/* Credit Card Families */}
                {grouped.families.map(family => (
                    <React.Fragment key={family.head._id}>
                        {/* Head Card */}
                        <AccountCard
                            account={family.head}
                            onClick={onAccountClick}
                            onEdit={setEditingAccount}
                            onDelete={handleDelete}
                            getIcon={getIcon}
                            isHead={true}
                            onAddConnected={() => handleAddConnected(family.head._id)}
                        />

                        {/* Connected Cards */}
                        {family.children.map(child => (
                            <div key={child._id} className="relative pl-6 md:pl-0">
                                {/* Connector Line (Mobile only, effectively) */}
                                <div className="absolute left-0 top-0 bottom-0 w-4 border-l-2 border-b-2 border-slate-700 rounded-bl-xl -translate-y-1/2 translate-x-3 hidden" />
                                <AccountCard
                                    account={child}
                                    onClick={onAccountClick}
                                    onEdit={setEditingAccount}
                                    onDelete={handleDelete}
                                    getIcon={getIcon}
                                    isConnected={true}
                                />
                            </div>
                        ))}
                    </React.Fragment>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
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

                            {newAccount.linkedAccountId && (
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-400 flex items-center gap-2">
                                    <span className="font-bold">Linked Card:</span>
                                    Sharing limit with Parent.
                                </div>
                            )}

                            {!newAccount.linkedAccountId && (
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
                            )}

                            {/* Credit Card Specific Fields */}
                            {newAccount.type === 'Credit Card' && !newAccount.linkedAccountId && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Credit Limit</label>
                                        <input
                                            type="number"
                                            value={newAccount.creditLimit || ''}
                                            onChange={e => setNewAccount(prev => ({ ...prev, creditLimit: e.target.value }))}
                                            placeholder="e.g. 50000"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Bill Gen Day</label>
                                            <input
                                                type="number"
                                                min="1" max="31"
                                                value={newAccount.billDay || ''}
                                                onChange={e => setNewAccount(prev => ({ ...prev, billDay: e.target.value }))}
                                                placeholder="Day (1-31)"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Payment Due Day</label>
                                            <input
                                                type="number"
                                                min="1" max="31"
                                                value={newAccount.dueDay || ''}
                                                onChange={e => setNewAccount(prev => ({ ...prev, dueDay: e.target.value }))}
                                                placeholder="Day (1-31)"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {newAccount.type === 'Credit Card' && !newAccount.linkedAccountId ? (
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Current Available Limit</label>
                                    <input
                                        type="number"
                                        value={newAccount.balance} // We reuse the 'balance' field variable but interpret it as Available for CC
                                        onChange={e => setNewAccount(prev => ({ ...prev, balance: e.target.value }))}
                                        placeholder={newAccount.creditLimit ? `Max ${newAccount.creditLimit}` : "0.00"}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Amount used: ₹{((parseFloat(newAccount.creditLimit) || 0) - (parseFloat(newAccount.balance) || 0)).toLocaleString()}
                                    </p>
                                </div>
                            ) : (
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
                            )}

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
            {/* Edit Modal */}
            {editingAccount && (
                <EditAccountModal
                    account={editingAccount}
                    onClose={() => setEditingAccount(null)}
                />
            )}
        </div>

    );
};

// Sub-component for individual card
const AccountCard = ({ account, onClick, onEdit, onDelete, getIcon, isHead, isConnected, onAddConnected }) => {
    return (
        <div
            onClick={() => onClick && onClick(account)}
            className={`bg-slate-800/50 hover:bg-slate-800 border ${isConnected ? 'border-l-4 border-l-blue-500/50 border-r-slate-700 border-y-slate-700 bg-slate-800/30' : 'border-slate-700'} hover:border-blue-500/30 rounded-xl p-4 transition-all cursor-pointer group relative flex flex-col justify-between h-full`}
        >
            <div className={`absolute top-2 right-2 ${isHead ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity flex items-center gap-1`}>
                {isHead && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddConnected && onAddConnected();
                        }}
                        className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors mr-1"
                        title="Add Connected Card"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(account);
                    }}
                    className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Edit Account"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                {(account.transactionCount === 0 || !['Cash', 'Credit Card'].includes(account.type)) && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(account._id, account.name);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Account"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 ${isConnected ? 'bg-blue-500/10' : 'bg-slate-900/50'} rounded-lg shrink-0`}>
                    {getIcon(account.type)}
                </div>
                <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold leading-tight">
                        {isConnected ? 'Connected Card' : account.type}
                    </p>
                    <p className="text-white font-medium truncate w-[120px]">{account.name}</p>
                </div>
            </div>

            <div className="mt-2">
                <span className={`text-lg font-mono font-bold ${account.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {account.currency === 'AED' ? '₹' : (account.currency || '₹')} {Math.abs(account.balance).toLocaleString('en-IN')}
                </span>
                {account.type === 'Credit Card' && !isConnected && (
                    <div className="flex flex-col mt-1">
                        <p className="text-[10px] text-slate-500">
                            Limit: ₹{(account.creditLimit || 0).toLocaleString()}
                        </p>
                        {account.availableCredit !== undefined && account.availableCredit !== null && (
                            <p className="text-[10px] font-semibold text-emerald-400">
                                Avail: ₹{account.availableCredit.toLocaleString()}
                            </p>
                        )}
                    </div>
                )}
                {isConnected && (
                    <p className="text-[10px] text-blue-400/70 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Shared Limit
                    </p>
                )}
            </div>
        </div>
    );
};

export default AccountsSection;
