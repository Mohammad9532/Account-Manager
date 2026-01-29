'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, PieChart, Menu, Coffee, LogOut, Book, ArrowRightLeft, Sun, Moon, User } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useFinance } from '../context/FinanceContext';

const Layout = ({ children }) => {
    const { data: session } = useSession();
    const { theme, toggleTheme } = useFinance();
    const pathname = usePathname();

    const NavItem = ({ icon: Icon, label, href }) => {
        const isActive = pathname && (pathname === href || (href !== '/dashboard' && pathname.startsWith(href)));

        return (
            <Link
                href={href}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 group
        ${isActive
                        ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.15)] border border-emerald-500/20'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-emerald-400 hover:shadow-[0_0_15px_rgba(52,211,153,0.1)]'
                    }`}
            >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="font-medium">{label}</span>
                {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                )}
            </Link>
        );
    };

    return (
        <div className="flex min-h-screen font-sans bg-white dark:bg-finance-bg text-slate-900 dark:text-slate-100 selection:bg-emerald-500/30" style={{ backgroundImage: theme === 'light' ? 'var(--primary-gradient)' : 'none', backgroundAttachment: 'fixed' }}>
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-200/60 dark:border-slate-700 p-6 flex flex-col gap-8 bg-white/40 dark:bg-slate-800 fixed h-full z-10 hidden md:flex backdrop-blur-md">
                <div className="flex items-center justify-between gap-3 px-2 mb-6">
                    <Link href="/dashboard" className="relative h-12 flex items-center">
                        <img src="/bra-logo.png" alt="BeingReal Accounts" className="h-full w-auto object-contain rounded-xl" />
                    </Link>
                    <Link
                        href="/profile"
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 p-0.5 shadow-lg hover:scale-105 transition-transform overflow-hidden"
                    >
                        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                            {session?.user?.image ? (
                                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-5 h-5 text-slate-400" />
                            )}
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 space-y-1">
                    <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem href="/ledgers" icon={Book} label="Ledger Book" />
                    <NavItem href="/dailyexpense" icon={Coffee} label="Daily Expenses" />
                    <NavItem href="/income" icon={Wallet} label="Income Tracker" />
                    <NavItem href="/currency-dealers" icon={ArrowRightLeft} label="Currency Dealers" />
                    <NavItem href="/reports" icon={PieChart} label="Reports" />
                </nav>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-bold uppercase tracking-widest">Auth as</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{session?.user?.name || 'User'}</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full bg-transparent">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between mb-6 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg p-4 rounded-2xl border border-slate-200 dark:border-slate-800 z-20 shadow-lg">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/profile"
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 p-0.5 shadow-md overflow-hidden"
                        >
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                {session?.user?.image ? (
                                    <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                        </Link>
                        <div className="flex items-center gap-2">
                            <img src="/bra-logo.png" alt="BeingReal" className="h-8 w-auto rounded-lg" />
                            <span className="font-bold text-finance-text text-lg">Accounts</span>
                        </div>
                    </div>
                </div>

                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-2 flex justify-around px-4 z-30 shadow-2xl">
                    <Link href="/dashboard" className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${pathname === '/dashboard' ? 'text-emerald-500' : 'text-slate-400'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Dash</span>
                    </Link>
                    <Link href="/ledgers" className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${pathname === '/ledgers' ? 'text-emerald-500' : 'text-slate-400'}`}>
                        <Book className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Ledgers</span>
                    </Link>
                    <Link href="/dailyexpense" className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${pathname === '/dailyexpense' ? 'text-emerald-500' : 'text-slate-400'}`}>
                        <Coffee className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Daily</span>
                    </Link>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
