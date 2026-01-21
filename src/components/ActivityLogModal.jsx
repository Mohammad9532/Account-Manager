'use client';

import React, { useState, useEffect } from 'react';
import { X, History, Clock } from 'lucide-react';

const ActivityLogModal = ({ ledgerId, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch(`/api/ledgers/activity?ledgerId=${ledgerId}`);
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (ledgerId) fetchLogs();
    }, [ledgerId]);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, day: 'numeric', month: 'short' });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6 shrink-0">
                    <div className="p-3 bg-amber-500/10 rounded-xl">
                        <History className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Activity Log</h3>
                        <p className="text-slate-400 text-sm">Recent changes and events</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading activity...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-800 border-dashed">
                            No recent activity found.
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log._id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                <p className="text-sm font-medium text-slate-200 leading-snug mb-1">
                                    {log.details}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(log.createdAt)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLogModal;
