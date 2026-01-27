'use client';

import React, { useState } from 'react';
import { CreditCard, Landmark, Banknote, Plus, X, Wallet, Trash2, Pencil, Receipt } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import EditAccountModal from './EditAccountModal';
import ManageEMIsModal from './ManageEMIsModal';

const AccountsSection = ({ onAccountClick }) => {
    const { accounts, createAccount, deleteAccount, formatCurrency } = useFinance();
    const [showAdd, setShowAdd] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [managingEMIs, setManagingEMIs] = useState(null);
    const [newAccount, setNewAccount] = useState({ name: '', type: 'Bank', balance: '', creditLimit: '', billDay: '', dueDay: '', currency: 'INR', linkedAccountId: null });

    // Group accounts
    const grouped = React.useMemo(() => {
        const others = accounts.filter(a => a.type !== 'Credit Card');
        const creditCards = accounts.filter(a => a.type === 'Credit Card');

        const heads = creditCards.filter(a => !a.linkedAccountId);

        const allFamilies = heads.map(head => ({
            head,
            children: creditCards.filter(a => a.linkedAccountId === head._id)
        }));

        // Split into standalone and true families
        const standalone = allFamilies.filter(f => f.children.length === 0).map(f => f.head);
        const groups = allFamilies.filter(f => f.children.length > 0);

        // Combine others and standalone
        const singles = [...others, ...standalone];

        return { singles, groups };
    }, [accounts]);

    const handleAddConnected = (parentId) => {
        const parent = accounts.find(a => a._id === parentId);
        const parentAvailable = parent ? parent.availableCredit : '';

        setNewAccount({
            name: '',
            type: 'Credit Card',
            balance: parentAvailable !== undefined ? parentAvailable : '',
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
        // For Head Credit Cards, the input 'balance' represents 'Available Credit'
        // Actual Balance (Debt) = Available - Limit
        if (newAccount.type === 'Credit Card') {
            if (!newAccount.linkedAccountId) {
                // Head Card: Balance = Available - Limit
                calculatedBalance = calculatedBalance - limit;
            } else {
                // Add-on Card: Balance = Available - ParentLimit
                // Simple version: Implied usage = Input Available - Limit
                const parent = accounts.find(a => a._id === newAccount.linkedAccountId);
                const parentLimit = parent ? (parent.creditLimit || 0) : 0;
                calculatedBalance = calculatedBalance - parentLimit;
            }
        }

        await createAccount({
            ...newAccount,
            balance: calculatedBalance,
            initialBalance: calculatedBalance,
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
            case 'Bank': return <Landmark className="w-6 h-6 text-sky-500" />;
            default: return <Wallet className="w-6 h-6 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Money Sources</h3>
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
                        className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Account
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Single Cards (Bank, Cash, Standalone Credit Cards) */}
                {grouped.singles.map(account => {
                    // Check if it's a credit card to enable adding connected cards
                    const isCC = account.type === 'Credit Card';
                    return (
                        <AccountCard
                            key={account._id}
                            account={account}
                            onClick={onAccountClick}
                            onEdit={setEditingAccount}
                            onDelete={handleDelete}
                            getIcon={getIcon}
                            isHead={isCC}
                            onAddConnected={isCC ? () => handleAddConnected(account._id) : undefined}
                            onManageEMIs={setManagingEMIs}
                        />
                    );
                })}

                {/* Shared Limit Groups */}
                {grouped.groups.map(family => {
                    // Calculate Family Stats
                    const headLimit = family.head.creditLimit || 0;
                    const members = [family.head, ...family.children];
                    const totalUsed = members.reduce((sum, member) => sum + Math.abs(parseFloat(member.balance) || 0), 0);

                    // Calculate Total EMI Blocked
                    const totalEMIBlocked = members.reduce((sum, member) => {
                        const memberEMIs = member.emis || [];
                        const blocked = memberEMIs
                            .filter(e => e.status === 'Active')
                            .reduce((s, e) => s + (parseFloat(e.remainingAmount) || 0), 0);
                        return sum + blocked;
                    }, 0);

                    const realAvailable = headLimit - totalUsed - totalEMIBlocked;

                    return (
                        <div key={family.head._id} className="relative col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border border-indigo-500/30 rounded-2xl bg-indigo-500/5">
                            {/* Family Summary Header */}
                            <div className="col-span-full flex flex-wrap items-center justify-between gap-4 mb-2">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-indigo-200 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        Shared Limit Group
                                    </h4>
                                    <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20">
                                        {members.length} Cards
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs md:text-sm">
                                    <div className="text-slate-400">
                                        Limit: <span className="text-white font-mono">{formatCurrency(headLimit)}</span>
                                    </div>
                                    <div className="text-rose-400">
                                        Used: <span className="font-mono">{formatCurrency(totalUsed)}</span>
                                    </div>
                                    <div className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                        Available: <span className="font-mono">{formatCurrency(realAvailable)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cards in Family */}
                            <AccountCard
                                account={family.head}
                                onClick={onAccountClick}
                                onEdit={setEditingAccount}
                                onDelete={handleDelete}
                                getIcon={getIcon}
                                isHead={true}
                                onAddConnected={() => handleAddConnected(family.head._id)}
                                onManageEMIs={setManagingEMIs}
                            />

                            {family.children.map(child => (
                                <div key={child._id} className="relative">
                                    <AccountCard
                                        account={child}
                                        onClick={onAccountClick}
                                        onEdit={setEditingAccount}
                                        onDelete={handleDelete}
                                        getIcon={getIcon}
                                        isConnected={true}
                                        onManageEMIs={setManagingEMIs}
                                    />
                                </div>
                            ))}
                        </div>
                    );
                })}

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
                    <div className="bg-finance-card border border-finance-border rounded-2xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200 shadow-2xl">
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
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"

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
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 appearance-none"
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
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
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
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
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
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
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
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Amount used: ₹{((parseFloat(newAccount.creditLimit) || 0) - (parseFloat(newAccount.balance) || 0)).toLocaleString()}
                                    </p>
                                </div>
                            ) : newAccount.type === 'Credit Card' && newAccount.linkedAccountId ? (
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Current Available Balance</label>
                                    <input
                                        type="number"
                                        value={newAccount.balance}
                                        onChange={e => setNewAccount(prev => ({ ...prev, balance: e.target.value }))}
                                        placeholder="e.g. 3000"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Enter the available limit shown on this card.
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
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl mt-2 transition-colors"
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
            {/* Manage EMIs Modal */}
            {managingEMIs && (
                <ManageEMIsModal
                    account={managingEMIs}
                    onClose={() => setManagingEMIs(null)}
                />
            )}
        </div>

    );
};

// Sub-component for individual card
const AccountCard = ({ account, onClick, onEdit, onDelete, getIcon, isHead, isConnected, onAddConnected, onManageEMIs }) => {
    const { formatCurrency } = useFinance();

    // Calculate EMI Blocked for this specific card
    const emiBlocked = (account.emis || [])
        .filter(e => e.status === 'Active')
        .reduce((sum, e) => sum + (parseFloat(e.remainingAmount) || 0), 0);

    return (
        <div
            onClick={() => onClick && onClick(account)}
            className={`bg-finance-card border ${isConnected ? 'border-l-4 border-l-sky-500/50 border-r-finance-border border-y-finance-border' : 'border-finance-border'} hover:border-emerald-500/50 rounded-xl p-4 transition-all cursor-pointer group relative flex flex-col justify-between h-full hover:shadow-[0_0_20px_rgba(52,211,153,0.1)]`}
        >
            <div className={`absolute top-2 right-2 ${isHead ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity flex items-center gap-1`}>
                {isHead && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddConnected && onAddConnected();
                        }}
                        className="p-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors mr-1"
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
                    className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                    title="Edit Account"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                {account.type === 'Credit Card' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onManageEMIs && onManageEMIs(account);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="Manage EMIs"
                    >
                        <Receipt className="w-4 h-4" />
                    </button>
                )}
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
                <div className={`p-2 ${isConnected ? 'bg-sky-500/10' : 'bg-slate-900/50'} rounded-lg shrink-0`}>
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
                    {formatCurrency(Math.abs(account.balance))}
                </span>
                {account.type === 'Credit Card' && !isConnected && (
                    <div className="flex flex-col mt-1">
                        <p className="text-[10px] text-slate-500">
                            Limit: {formatCurrency(account.creditLimit || 0)}
                        </p>
                        {emiBlocked > 0 && (
                            <p className="text-[10px] text-indigo-400/80">
                                EMI Blocked: {formatCurrency(emiBlocked)}
                            </p>
                        )}
                        {account.availableCredit !== undefined && account.availableCredit !== null && (
                            <p className="text-[10px] font-semibold text-emerald-400">
                                Avail: {formatCurrency(account.availableCredit)}
                            </p>
                        )}
                    </div>
                )}
                {isConnected && (
                    <p className="text-[10px] text-sky-400/70 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                        Shared Limit
                    </p>
                )}
            </div>
        </div>
    );
};

export default AccountsSection;
