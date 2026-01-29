'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, PieChart, Menu, Coffee, LogOut, Book, ArrowRightLeft, Sun, Moon } from 'lucide-react';
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
                <div className="flex items-center gap-3 px-2 mb-6">
                    <div className="relative w-full h-16 flex items-center justify-center">
                        <img src="/bra-logo.png" alt="BeingReal Accounts" className="h-full w-auto object-contain rounded-xl" />
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem href="/ledgers" icon={Book} label="Ledger Book" />
                    <NavItem href="/dailyexpense" icon={Coffee} label="Daily Expenses" />
                    <NavItem href="/income" icon={Wallet} label="Income Tracker" />
                    <NavItem href="/currency-dealers" icon={ArrowRightLeft} label="Currency Dealers" />
                    <NavItem href="/reports" icon={PieChart} label="Reports" />

                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 group text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-5 h-5 transition-transform group-hover:rotate-45" />
                        ) : (
                            <Moon className="w-5 h-5 transition-transform group-hover:-rotate-12" />
                        )}
                        <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                </nav>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Balance</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Available</p>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800/50">
                    <div className="mb-4 px-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Logged in as</p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{session?.user?.name || 'User'}</p>
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
            <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full bg-transparent">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between mb-6 sticky top-0 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 z-20 shadow-xl">
                    <div className="flex items-center gap-3">
                        <img src="/bra-logo.png" alt="BeingReal Accounts" className="h-10 w-auto rounded-lg" />
                        <div>
                            <span className="font-bold block leading-tight text-slate-900 dark:text-white">BeingReal Accounts</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block leading-tight">Hi, {session?.user?.name?.split(' ')[0] || 'User'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-400 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Mobile Tab Bar (Bottom) */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 flex justify-between px-4 z-30 overflow-x-auto shadow-2xl">
                    <Link href="/dashboard" className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${pathname === '/dashboard' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-[10px]">Dash</span>
                    </Link>
                    <Link href="/ledgers" className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${pathname === '/ledgers' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Book className="w-5 h-5" />
                        <span className="text-[10px]">Ledgers</span>
                    </Link>
                    <Link href="/dailyexpense" className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${pathname === '/dailyexpense' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Coffee className="w-5 h-5" />
                        <span className="text-[10px]">Daily</span>
                    </Link>
                    <Link href="/income" className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${pathname === '/income' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Wallet className="w-5 h-5" />
                        <span className="text-[10px]">Income</span>
                    </Link>
                    <Link href="/currency-dealers" className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${pathname === '/currency-dealers' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <ArrowRightLeft className="w-5 h-5" />
                        <span className="text-[10px]">Dealers</span>
                    </Link>
                    <Link href="/reports" className={`p-2 rounded-lg flex flex-col items-center gap-1 min-w-[3rem] ${pathname === '/reports' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <PieChart className="w-5 h-5" />
                        <span className="text-[10px]">Reports</span>
                    </Link>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
                    {children}
                </div>
            </main >
        </div >
    );
};

export default Layout;
