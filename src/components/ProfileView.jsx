'use client';

import React from 'react';
import { User, Mail, Shield, LogOut, Package, CreditCard, ChevronRight, Settings } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useFinance } from '../context/FinanceContext';

const ProfileView = () => {
    const { data: session, update } = useSession();
    const { accounts, transactions, formatCurrency, theme, toggleTheme } = useFinance();

    const [isEditing, setIsEditing] = React.useState(false);
    const [editData, setEditData] = React.useState({
        name: session?.user?.name || '',
        email: session?.user?.email || '',
        phone: session?.user?.phone || ''
    });
    const [isSaving, setIsSaving] = React.useState(false);

    // Calculate Net Position (Net Worth) - Replicating Dashboard Logic
    const netPosition = React.useMemo(() => {
        const personalAccounts = accounts.filter(a => !a.isShared);

        let liquidFunds = 0;
        let ccDebt = 0;
        let totalReceivables = 0;
        let totalPayables = 0;

        // Account Stats (Formal Accounts)
        personalAccounts.forEach(acc => {
            const bal = acc.balance || 0;
            if (['Bank', 'Cash'].includes(acc.type)) {
                liquidFunds += bal;
            } else if (acc.type === 'Credit Card') {
                if (bal < 0) ccDebt += Math.abs(bal);
                else liquidFunds += bal;
            } else if (acc.type === 'Other') {
                if (bal < 0) totalReceivables += Math.abs(bal);
                else totalPayables += bal;
            }
        });

        // Legacy / Orphan Ledger Stats (Matching Dashboard Logic)
        const groups = {}; // Formal accounts mapping (ID and Name)
        const legacyBalances = {}; // To aggregate name-based balances

        personalAccounts.filter(a => a.type === 'Other').forEach(a => {
            groups[String(a._id)] = true;
            groups[a.name.toLowerCase()] = true;
        });

        transactions.forEach(t => {
            if ((t.scope || 'manager') !== 'manager') return;
            if (t.accountId && groups[String(t.accountId)]) return;
            if (t.linkedAccountId && groups[String(t.linkedAccountId)]) return;

            const name = (t.description || '').trim();
            if (!name) return;
            const key = name.toLowerCase();
            if (groups[key]) return;

            const amt = parseFloat(t.amount);
            const isCredit = t.type === 'Money In';
            const signedAmt = isCredit ? amt : -amt;

            if (!legacyBalances[key]) legacyBalances[key] = 0;
            legacyBalances[key] += signedAmt;
        });

        // Add legacy net balances to totals
        Object.values(legacyBalances).forEach(bal => {
            if (bal < 0) totalReceivables += Math.abs(bal);
            else totalPayables += bal;
        });

        // Simplified Net calculation consistent with dashboard
        return (liquidFunds + totalReceivables) - (totalPayables + ccDebt);
    }, [accounts, transactions]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/user', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success('Profile updated successfully!');
                setIsEditing(false);
                // Trigger session refresh if update is available from useSession
                if (update) await update();
            } else {
                toast.error('Failed to update profile');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const ProfileItem = ({ icon: Icon, label, value, onClick, danger, isEditable, field }) => (
        <div
            className={`w-full flex items-center justify-between p-4 rounded-2xl bg-white/70 dark:bg-finance-card border border-white dark:border-finance-border backdrop-blur-md transition-all hover:shadow-md group ${danger ? 'hover:bg-rose-50 dark:hover:bg-rose-500/10' : ''}`}
        >
            <div className="flex items-center gap-4 flex-1">
                <div className={`p-2.5 rounded-xl ${danger ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
                    {isEditing && isEditable ? (
                        <input
                            value={editData[field]}
                            onChange={e => setEditData(prev => ({ ...prev, [field]: e.target.value }))}
                            className="w-full bg-transparent font-bold text-finance-text focus:outline-none border-b border-emerald-500/50 py-0.5"
                            placeholder={`Enter ${label.toLowerCase()}`}
                        />
                    ) : (
                        <p className={`font-bold ${danger ? 'text-rose-600 dark:text-rose-400' : 'text-finance-text'}`}>{value}</p>
                    )}
                </div>
            </div>
            {onClick && !isEditing && (
                <button onClick={onClick}>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-finance-text transition-colors" />
                </button>
            )}
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-12">
            {/* Header / Avatar Section */}
            <div className="text-center space-y-4">
                <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 p-1 shadow-2xl">
                        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                            {session?.user?.image ? (
                                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-16 h-16 text-slate-300 dark:text-slate-700" />
                            )}
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-finance-text">{session?.user?.name || 'User'}</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2">
                        <Mail className="w-4 h-4" />
                        {session?.user?.email || 'No email associated'}
                    </p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                    >
                        Edit Profile
                    </button>
                ) : (
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-full shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setEditData({
                                    name: session?.user?.name || '',
                                    email: session?.user?.email || '',
                                    phone: session?.user?.phone || ''
                                });
                            }}
                            className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-bold rounded-full transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                    <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 font-bold uppercase tracking-widest">Net Position</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        {netPosition >= 0 ? 'Surplus' : 'Deficit'}
                    </p>
                </div>
                <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="text-[10px] text-blue-700/70 dark:text-blue-400/70 font-bold uppercase tracking-widest">Total Balance</p>
                    <p className="text-xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(Math.abs(netPosition))}</p>
                </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-2">Personal Details</h3>
                <div className="grid gap-3">
                    <ProfileItem
                        icon={User}
                        label="Full Name"
                        value={session?.user?.name}
                        isEditable
                        field="name"
                    />
                    <ProfileItem
                        icon={Mail}
                        label="Email Address"
                        value={session?.user?.email || 'N/A'}
                        isEditable
                        field="email"
                    />
                    <ProfileItem
                        icon={Shield}
                        label="Mobile Number"
                        value={session?.user?.phone || 'N/A'}
                        isEditable
                        field="phone"
                    />
                </div>
            </div>

            {/* Preferences Management */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-2">App Preferences</h3>
                <div className="grid gap-3">
                    <ProfileItem
                        icon={Settings}
                        label="Appearance"
                        value={theme.charAt(0).toUpperCase() + theme.slice(1) + ' Mode'}
                        onClick={toggleTheme}
                    />
                </div>
            </div>

            {/* Logout Section */}
            <div className="pt-4">
                <ProfileItem
                    icon={LogOut}
                    label="Session"
                    value="Log out"
                    danger
                    onClick={() => signOut({ callbackUrl: '/login' })}
                />
            </div>

            {/* Version Info */}
            <p className="text-center text-xs text-slate-400 font-medium">
                BeingReal Accounts v1.2.5 • Secure Cloud Storage
            </p>
        </div>
    );
};

export default ProfileView;
