'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Check } from 'lucide-react';
import AdvisorModal from './AdvisorModal';

const LandingPage = () => {
    const [isAdvisorOpen, setIsAdvisorOpen] = React.useState(false);
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-4 md:px-12 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <Link href="/">
                        <img src="/mint-logo.png" alt="Mint Accounts" className="h-12 w-auto rounded-xl" />
                    </Link>
                </div>
                <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
                    <Link href="#features" className="hover:text-emerald-900 hidden md:block">Features</Link>
                    <Link href="#pricing" className="hover:text-emerald-900 hidden md:block">Pricing</Link>
                    <Link href="/login" className="text-slate-900 hover:text-emerald-600">Sign in</Link>
                    <Link
                        href="/dashboard" /* Using dashboard directly for demo/quick start */
                        className="px-5 py-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200"
                    >
                        Try it free
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-16 pb-24 px-6 md:px-12 max-w-7xl mx-auto text-center relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute top-10 right-10 w-64 h-64 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 relative z-10">
                    All your money in <span className="relative whitespace-nowrap">
                        <span className="relative z-10">one place</span>
                        {/* No underline or extremely subtle one if requested, User said "Emerald underline or no underline" */}
                    </span>.
                </h1>

                <p className="font-medium text-lg text-emerald-700 mb-6">
                    Trusted by growing businesses across UAE & India.
                </p>

                <p className="text-3xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                    Simple. Secure. Built for real businesses.
                </p>

                <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Track income, expenses, customers, partners, and profit — without Excel, without confusion, and without stress.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                    <Link
                        href="/dashboard"
                        className="px-8 py-4 bg-emerald-500 text-white rounded-lg font-semibold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2"
                    >
                        Get Started – It’s Free <ChevronRight className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => setIsAdvisorOpen(true)}
                        className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium text-lg hover:bg-slate-50 transition-colors"
                    >
                        Talk to an Advisor
                    </button>
                </div>

                <p className="text-sm text-slate-500 font-medium">
                    No credit card required
                </p>
                {/* Doodles removed */}
            </header>

            {/* Problem Section */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-bold text-emerald-600 tracking-wider uppercase mb-2">Why MintAccounts?</h2>

                        {/* Perfect Positioning Section - Pushed Harder */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 inline-block">
                            <h3 className="text-3xl md:text-4xl font-bold text-slate-900">
                                Running a business is not hard.<br />
                                <span className="text-emerald-600">Keeping track of money is.</span>
                            </h3>
                        </div>

                        <p className="text-xl text-slate-600 mt-8">Most businesses lose money because:</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { icon: "💸", title: "Payments are forgotten" },
                            { icon: "🤝", title: "Partners delay" },
                            { icon: "📝", title: "Records don’t match" },
                            { icon: "📉", title: "Profit is guessed" },
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
                                <div className="text-4xl mb-4">{item.icon}</div>
                                <h4 className="font-semibold text-slate-900">{item.title}</h4>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-lg font-medium text-slate-800 bg-white inline-block px-6 py-3 rounded-full shadow-sm border border-slate-200">
                            MintAccounts turns your daily transactions into a <span className="text-emerald-600 font-bold">clear financial picture</span> you can trust.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">What you can do with MintAccounts</h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Track every deal",
                            desc: "Record every sale, payment, and exchange in one place.",
                            icon: "🧾",
                            color: "bg-emerald-50 text-emerald-600"
                        },
                        {
                            title: "Handle multiple currencies",
                            desc: "AED, INR, USD — MintAccounts keeps it clean and accurate.",
                            icon: "💱",
                            color: "bg-blue-50 text-blue-600"
                        },
                        {
                            title: "Manage customers & partners",
                            desc: "Know exactly who owes you money and who you owe.",
                            icon: "👥",
                            color: "bg-emerald-50 text-emerald-600"
                        },
                        {
                            title: "See real profit",
                            desc: "No guessing. Every rupee of profit is calculated for you.",
                            icon: "📊",
                            color: "bg-orange-50 text-orange-600"
                        },
                        {
                            title: "Send statements on WhatsApp",
                            desc: "One click to send balance, receipts, or reminders.",
                            icon: "📱",
                            color: "bg-teal-50 text-teal-600"
                        },
                        {
                            title: "Built for people who move money",
                            desc: "Designed specifically for currency dealers and traders.",
                            icon: "🚀",
                            color: "bg-rose-50 text-rose-600"
                        }
                    ].map((feature, i) => (
                        <div key={i} className="group p-8 rounded-3xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-default">
                            <div className={`w-14 h-14 ${feature.color} flex items-center justify-center rounded-2xl text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Target Audience Section - Professional */}
            <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="md:w-1/2">
                            <h2 className="text-4xl font-bold mb-6">MintAccounts is perfect for:</h2>
                            <ul className="space-y-4">
                                {[
                                    "Currency dealers",
                                    "Traders",
                                    "Small business owners",
                                    "Shop owners",
                                    "Service providers",
                                    "Anyone who handles daily cash and transfers"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-lg text-slate-300">
                                        <Check className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <p className="text-lg font-medium italic text-slate-200">
                                    "If you receive money in one place and pay it somewhere else — MintAccounts was made for you."
                                </p>
                            </div>
                        </div>

                        <div className="md:w-1/2 bg-white rounded-2xl p-8 text-slate-900 shadow-2xl">
                            <h3 className="text-2xl font-bold mb-6 border-b pb-4">Your private financial control room</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Total Received</span>
                                    <span className="font-bold text-emerald-600 font-mono">AED 45,200</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Pending</span>
                                    <span className="font-bold text-orange-500 font-mono">AED 12,500</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Net Profit</span>
                                    <span className="font-bold text-emerald-600 font-mono">AED 3,850</span>
                                </div>
                            </div>
                            <div className="mt-8 text-center space-y-2">
                                <p className="text-slate-400 text-xl">No Excel.</p>
                                <p className="text-slate-400 text-xl">No guessing.</p>
                                <p className="text-emerald-600 text-2xl font-bold">No stress.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing / Call to Action */}
            <section id="pricing" className="py-24 text-center px-6">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Pricing</h2>
                <p className="text-xl text-slate-600 mb-12">Start free. Upgrade only when your business grows.</p>

                <div className="bg-emerald-900 text-white rounded-3xl p-12 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                    <div className="relative z-10">
                        <h3 className="text-4xl md:text-5xl font-bold mb-6">Ready to take control of your money?</h3>
                        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-10">
                            <div className="text-center">
                                <span className="block text-4xl mb-2">🐢</span>
                                <span className="font-medium text-emerald-100">Track every rupee</span>
                            </div>
                            <div className="w-px h-12 bg-emerald-700 hidden md:block"></div>
                            <div className="text-center">
                                <span className="block text-4xl mb-2">🚄</span>
                                <span className="font-medium text-emerald-100">Control every deal</span>
                            </div>
                            <div className="w-px h-12 bg-emerald-700 hidden md:block"></div>
                            <div className="text-center">
                                <span className="block text-4xl mb-2">🚀</span>
                                <span className="font-medium text-emerald-100">Grow with confidence</span>
                            </div>
                        </div>

                        <Link
                            href="/dashboard"
                            className="inline-flex px-10 py-5 bg-white text-emerald-900 rounded-xl font-bold text-xl hover:bg-emerald-50 transition-colors shadow-lg"
                        >
                            Get Started – It’s Free
                        </Link>
                        <p className="mt-4 text-emerald-200 text-sm">Affordable plans designed for small businesses.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center text-slate-500 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="font-bold text-slate-900">MintAccounts</span>
                </div>
                <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
                    <Link href="/ledger-book-online" className="text-emerald-600 hover:underline">Ledger Book Online</Link>
                    <Link href="/track-receivables-and-payables" className="text-emerald-600 hover:underline">Track Receivables</Link>
                    <Link href="/daily-expense-tracker" className="text-emerald-600 hover:underline">Daily Expense Tracker</Link>
                </div>
                <div className="flex flex-wrap justify-center gap-6 mb-8 text-xs text-slate-400">
                    <span className="font-semibold text-slate-500">Solutions for:</span>
                    <Link href="/accounting-for-small-business" className="hover:text-emerald-600 hover:underline">Small Business</Link>
                    <Link href="/digital-khata-for-shops" className="hover:text-emerald-600 hover:underline">Shops</Link>
                    <Link href="/money-tracking-for-traders" className="hover:text-emerald-600 hover:underline">Traders</Link>
                </div>
                <p>&copy; {new Date().getFullYear()} MintAccounts. All rights reserved.</p>
            </footer>

            <AdvisorModal isOpen={isAdvisorOpen} onClose={() => setIsAdvisorOpen(false)} />
        </div>
    );
};

export default LandingPage;
