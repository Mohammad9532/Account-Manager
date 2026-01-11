'use client';

import React from 'react';
import { LayoutDashboard, Wallet, PieChart, Menu, Coffee } from 'lucide-react';

const Layout = ({ children, activeTab, setActiveTab }) => {
    const NavItem = ({ icon: Icon, label, id }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 group
        ${activeTab === id
                    ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
        >
            <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === id ? 'animate-pulse' : ''}`} />
            <span className="font-medium">{label}</span>
            {activeTab === id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
            )}
        </button>
    );

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800/50 p-6 flex flex-col gap-8 bg-slate-950/50 backdrop-blur-xl fixed h-full z-10 hidden md:flex">
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-blue-500/20">
                        <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        MintMart
                    </h1>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem id="manager" icon={LayoutDashboard} label="Account Manager" />
                    <NavItem id="daily" icon={Coffee} label="Daily Expenses" />
                    <NavItem id="reports" icon={PieChart} label="Reports" />
                </nav>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Total Balance</p>
                    <p className="text-lg font-bold text-emerald-400">Available</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between mb-6 sticky top-0 bg-slate-950/80 backdrop-blur-lg p-2 rounded-2xl border border-slate-800/50 z-20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold">MintMart</span>
                    </div>
                </div>

                {/* Mobile Tab Bar (Bottom) */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 p-2 flex justify-around z-30">
                    <button onClick={() => setActiveTab('manager')} className={`p-2 rounded-lg flex flex-col items-center gap-1 ${activeTab === 'manager' ? 'text-blue-400' : 'text-slate-500'}`}>
                        <LayoutDashboard className="w-6 h-6" />
                        <span className="text-[10px]">Manager</span>
                    </button>
                    <button onClick={() => setActiveTab('daily')} className={`p-2 rounded-lg flex flex-col items-center gap-1 ${activeTab === 'daily' ? 'text-blue-400' : 'text-slate-500'}`}>
                        <Coffee className="w-6 h-6" />
                        <span className="text-[10px]">Daily</span>
                    </button>
                    <button onClick={() => setActiveTab('reports')} className={`p-2 rounded-lg flex flex-col items-center gap-1 ${activeTab === 'reports' ? 'text-blue-400' : 'text-slate-500'}`}>
                        <PieChart className="w-6 h-6" />
                        <span className="text-[10px]">Reports</span>
                    </button>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
