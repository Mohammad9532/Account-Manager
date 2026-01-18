'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Check } from 'lucide-react';
import AdvisorModal from './AdvisorModal';
import SEOConversionSection from './SEOConversionSection';
import Footer from './Footer';

const LedgerView = () => {
    const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
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
                    <Link href="/login" className="text-slate-900 hover:text-emerald-600">Sign in</Link>
                    <Link
                        href="/dashboard"
                        className="px-5 py-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200"
                    >
                        Create Free Ledger
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-16 pb-24 px-6 md:px-12 max-w-7xl mx-auto text-center relative overflow-hidden">
                <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute top-10 right-10 w-64 h-64 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 relative z-10">
                    The Smart <span className="text-emerald-600">Ledger Book Online for Small Businesses</span>.
                </h1>

                <p className="font-medium text-lg text-emerald-700 mb-6">
                    Replace your physical khata book with a secure digital ledger.
                </p>

                <p className="text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
                    Track daily income, expenses, and customer balances in one place.
                    <br />
                    <span className="text-base text-slate-500">Safe, secure, and accessible from anywhere.</span>
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                    <Link
                        href="/dashboard"
                        className="px-8 py-4 bg-emerald-500 text-white rounded-lg font-semibold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2"
                    >
                        Create Free Ledger <ChevronRight className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => setIsAdvisorOpen(true)}
                        className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium text-lg hover:bg-slate-50 transition-colors"
                    >
                        Ask a Question on WhatsApp
                    </button>
                </div>

                <p className="text-xs text-slate-400 max-w-lg mx-auto mb-4 leading-relaxed">
                    MintAccounts is an accounting & money management tool. We do not provide financial advice or request sensitive personal information.
                </p>

                <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Private, Secure & Built for UAE/India Business
                </p>
            </header>

            {/* SEO Content Section */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Why switch to a Ledger Book Online?</h2>
                    <div className="prose prose-lg mx-auto text-slate-600">
                        <p>
                            Managing a physical ledger book (khata) is risky. Books get lost, pages get torn, and calculation errors happen.
                            With <strong>MintAccounts</strong>, your ledger book is online, secure, and automatic.
                        </p>
                        <p>
                            Whether you are a shop owner, currency dealer, or trader, you need to track:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-8">
                            <li><strong>Daily Income & Expenses:</strong> Record every rupee that comes in and goes out.</li>
                            <li><strong>Customer Balances (Udhar/Jama):</strong> Know exactly who owes you money.</li>
                            <li><strong>Profit & Loss:</strong> See your real profit instantly, without manual math.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 max-w-7xl mx-auto px-6">
                <p className="text-center text-slate-600 max-w-2xl mx-auto mb-16 text-lg">
                    MintAccounts replaces your physical khata with a secure, always-available digital ledger.
                </p>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Digital Account Book",
                            desc: "Maintain separate ledgers for different customers and partners.",
                            icon: "📒",
                            color: "bg-emerald-50 text-emerald-600"
                        },
                        {
                            title: "Multi-Currency Support",
                            desc: "Deal in AED, INR, USD? We handle the conversions for you.",
                            icon: "💱",
                            color: "bg-blue-50 text-blue-600"
                        },
                        {
                            title: "Auto-Calculated Profit",
                            desc: "Stop guessing. We calculate your exact profit based on your rates.",
                            icon: "📈",
                            color: "bg-orange-50 text-orange-600"
                        }
                    ].map((feature, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                            <div className={`w-14 h-14 ${feature.color} flex items-center justify-center rounded-2xl text-2xl mb-6`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                            <p className="text-slate-600">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ / Rich Snippet Candidates */}
            <section className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Is this online ledger book safe?</h3>
                            <p className="text-slate-600">Yes. MintAccounts uses bank-grade encryption to keep your financial data secure. Only you have access to your data.</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Can I use it on mobile?</h3>
                            <p className="text-slate-600">Absolutely. Our ledger book online works perfectly on any smartphone, tablet, or computer.</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Is it free to start?</h3>
                            <p className="text-slate-600">Yes, you can create your account and start managing your ledger book for free.</p>
                        </div>
                    </div>
                </div>
            </section>

            <SEOConversionSection onTalkToAdvisor={() => setIsAdvisorOpen(true)} />

            {/* Footer Links for Internal Linking */}
            <section className="py-12 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-slate-500 mb-4">Explore other solutions:</p>
                    <div className="flex flex-wrap justify-center gap-6 mb-8">
                        <Link href="/track-receivables-and-payables" className="text-emerald-600 hover:underline">Track Receivables & Payables</Link>
                        <Link href="/daily-expense-tracker" className="text-emerald-600 hover:underline">Daily Expense Tracker</Link>
                    </div>
                    <p className="text-slate-500 mb-4 text-sm">Perfect for:</p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <Link href="/accounting-for-small-business" className="text-slate-500 hover:text-emerald-600 hover:underline">Small Business</Link>
                        <Link href="/digital-khata-for-shops" className="text-slate-500 hover:text-emerald-600 hover:underline">Shops</Link>
                        <Link href="/money-tracking-for-traders" className="text-slate-500 hover:text-emerald-600 hover:underline">Traders</Link>
                    </div>
                </div>
            </section>

            <Footer />

            <AdvisorModal isOpen={isAdvisorOpen} onClose={() => setIsAdvisorOpen(false)} />
        </div>
    );
};

export default LedgerView;
