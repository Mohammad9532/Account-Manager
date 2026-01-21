'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Shield, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

const ShareLedgerModal = ({ ledgerId, ledgerName, onClose }) => {
    const { data: session } = useSession();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('viewer');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState(null);

    // Fetch existing users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(`/api/ledgers/share?ledgerId=${ledgerId}`);
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                } else {
                    console.error("Failed to fetch shared users");
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (ledgerId) fetchUsers();
    }, [ledgerId]);

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviting(true);
        setError(null);

        try {
            const res = await fetch('/api/ledgers/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ledgerId, email, role })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to invite user');
            }

            // Success - refresh list
            const userRes = await fetch(`/api/ledgers/share?ledgerId=${ledgerId}`);
            const userData = await userRes.json();
            setUsers(userData.users || []);
            setEmail('');
            alert('User invited successfully!');

        } catch (err) {
            setError(err.message);
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (userIdToRemove) => {
        if (!confirm('Are you sure you want to remove this user?')) return;

        try {
            const res = await fetch('/api/ledgers/share', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ledgerId, userIdToRemove })
            });

            if (res.ok) {
                setUsers(prev => prev.filter(u => u.userId !== userIdToRemove));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to remove user');
            }
        } catch (err) {
            alert('Error removing user');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <Shield className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Share Ledger</h3>
                        <p className="text-slate-400 text-sm">Manage access for "{ledgerName}"</p>
                    </div>
                </div>

                {/* Invite Form */}
                <form onSubmit={handleInvite} className="mb-8 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Invite User</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter user email"
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer"
                            >
                                <option value="viewer">Viewer (Read Only)</option>
                                <option value="editor">Editor (Add/Edit Entries)</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={inviting}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2"
                        >
                            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            Invite
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
                            {error}
                        </div>
                    )}
                </form>

                {/* Existing Users List */}
                <div>
                    <h4 className="text-sm font-bold text-slate-400 mb-3">People with access</h4>

                    {loading ? (
                        <div className="text-center py-4 text-slate-500">Loading...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-800 border-dashed">
                            No one else has access yet.
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {users.map((access) => (
                                <div key={access._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                                            {access.user?.name?.[0] || access.userId?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{access.user?.name || 'User'}</p>
                                            <p className="text-xs text-slate-500">{access.userId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs px-2 py-1 rounded-full border ${access.role === 'editor'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {access.role}
                                        </span>
                                        <button
                                            onClick={() => handleRemove(access.userId)}
                                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                            title="Remove Access"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareLedgerModal;
