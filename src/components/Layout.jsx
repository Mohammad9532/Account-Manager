'use client';

import React from 'react';
import { LayoutDashboard, Wallet, PieChart, Menu, Coffee, LogOut, Book, ArrowRightLeft } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

const Layout = ({ children, activeTab, setActiveTab }) => {
    const { data: session } = useSession();
    // ... NavItem component ... (kept implicit for brevity, will rely on exact string match below for context if needed, but here replace full file content chunk is safer if easy)
    // Actually, I'll just target the imports and the sidebar footer area separately or use multi-replace.
    // Let's use multi-replace to be safe.

    const NavItem = ({ icon: Icon, label, id }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 group
        ${activeTab === id
                    ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.15)] border border-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-emerald-400 hover:shadow-[0_0_15px_rgba(52,211,153,0.1)]'
                }`}
        >
            <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === id ? 'animate-pulse' : ''}`} />
            <span className="font-medium">{label}</span>
            {activeTab === id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            )}
        </button>
    );

    return (
        <div className="flex min-h-screen font-sans bg-finance-bg text-slate-100 selection:bg-emerald-500/30">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-700 p-6 flex flex-col gap-8 bg-slate-800 fixed h-full z-10 hidden md:flex">
                <div className="flex items-center gap-3 px-2 mb-6">
                    <div className="relative w-full h-16 flex items-center justify-center">
                        <img src="/mint-logo.png" alt="Mint Accounts" className="h-full w-auto object-contain rounded-xl" />
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem id="manager" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem id="ledgers" icon={Book} label="Ledger Book" />
                    <NavItem id="daily" icon={Coffee} label="Daily Expenses" />
                    <NavItem id="income" icon={Wallet} label="Income Tracker" />
                    <NavItem id="currency" icon={ArrowRightLeft} label="Currency Dealers" />
                    <NavItem id="reports" icon={PieChart} label="Reports" />
                </nav>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Total Balance</p>
                    <p className="text-lg font-bold text-emerald-400">Available</p>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-800/50">
                    <div className="mb-4 px-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Logged in as</p>
                        <p className="text-sm font-medium text-slate-200 truncate">{session?.user?.name || 'User'}</p>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between mb-6 sticky top-0 bg-slate-800 p-4 rounded-2xl border border-slate-700 z-20 shadow-xl">
                    <div className="flex items-center gap-3">
                        <img src="/mint-logo.png" alt="Mint Accounts" className="h-10 w-auto rounded-lg" />
                        <div>
                            <span className="font-bold block leading-tight text-white">Mint Accounts</span>
                            <span className="text-xs text-slate-400 block leading-tight">Hi, {session?.user?.name?.split(' ')[0] || 'User'}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:text-rose-400 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                {/* Mobile Tab Bar (Bottom) */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-2 flex justify-between px-4 z-30 overflow-x-auto shadow-2xl">
                    <button onClick={() => setActiveTab('manager')} className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${activeTab === 'manager' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-[10px]">Dash</span>
                    </button>
                    <button onClick={() => setActiveTab('ledgers')} className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${activeTab === 'ledgers' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Book className="w-5 h-5" />
                        <span className="text-[10px]">Ledgers</span>
                    </button>
                    <button onClick={() => setActiveTab('daily')} className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${activeTab === 'daily' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Coffee className="w-5 h-5" />
                        <span className="text-[10px]">Daily</span>
                    </button>
                    <button onClick={() => setActiveTab('income')} className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${activeTab === 'income' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Wallet className="w-5 h-5" />
                        <span className="text-[10px]">Income</span>
                    </button>
                    <button onClick={() => setActiveTab('currency')} className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${activeTab === 'currency' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <ArrowRightLeft className="w-5 h-5" />
                        <span className="text-[10px]">Dealers</span>
                    </button>
                    <button onClick={() => setActiveTab('reports')} className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${activeTab === 'reports' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <PieChart className="w-5 h-5" />
                        <span className="text-[10px]">Reports</span>
                    </button>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
                    {children}
                </div>
            </main >
        </div >
    );
};

export default Layout;
