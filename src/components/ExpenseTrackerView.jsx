'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Check } from 'lucide-react';
import AdvisorModal from './AdvisorModal';
import SEOConversionSection from './SEOConversionSection';
import Footer from './Footer';

const ExpenseTrackerView = () => {
    const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-4 md:px-12 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <Link href="/">
                        <img src="/bra-logo.png" alt="BeingReal Accounts" className="h-12 w-auto rounded-xl" />
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
                    Your Simple <span className="text-emerald-600">Daily Expense Tracker</span>.
                </h1>

                <p className="font-medium text-lg text-emerald-700 mb-6">
                    Stop wondering where your cash went.
                </p>

                <p className="text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
                    Record every small expense in seconds. See your daily total instantly.
                    <br />
                    <span className="text-base text-slate-500">Fast, free, and built for busy business owners.</span>
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                    <Link
                        href="/dashboard"
                        className="px-8 py-4 bg-emerald-500 text-white rounded-lg font-semibold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2"
                    >
                        Start Tracking Expenses <ChevronRight className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => setIsAdvisorOpen(true)}
                        className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium text-lg hover:bg-slate-50 transition-colors"
                    >
                        Ask a Question on WhatsApp
                    </button>
                </div>

                <p className="text-xs text-slate-400 max-w-lg mx-auto mb-4 leading-relaxed">
                    BeingReal Accounts is an accounting & money management tool. We do not provide financial advice or request sensitive personal information.
                </p>

                <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Private, Secure & Built for UAE/India Business
                </p>
            </header>

            {/* Problem Section */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Small expenses eat your profit</h2>
                    <div className="prose prose-lg mx-auto text-slate-600">
                        <p>
                            Tea, snacks, fuel, small repairs - they add up. If you don't track them, you don't know your real profit.
                            <strong>BeingReal Accounts</strong> helps you capture every expense on the go.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-8">
                            <li><strong>Fast Entry:</strong> Designed to add an expense in 5 seconds or less.</li>
                            <li><strong>Categories:</strong> Sort by Travel, Food, Office, etc. automatically.</li>
                            <li><strong>Monthly Reports:</strong> One click to see a full PDF report of your monthly spending.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Smart Categories",
                            desc: "Automatically sort expenses by type (Travel, Food, Office).",
                            icon: "🏷️",
                            color: "bg-emerald-50 text-emerald-600"
                        },
                        {
                            title: "Daily Totals",
                            desc: "See a clear summary of total spending at the end of every day.",
                            icon: "📝",
                            color: "bg-blue-50 text-blue-600"
                        },
                        {
                            title: "Export to PDF",
                            desc: "Download a neat expense report to share with partners.",
                            icon: "📄",
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

            {/* FAQ Section */}
            <section className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                        <p className="text-emerald-600 font-medium bg-emerald-50 inline-block px-4 py-1 rounded-full text-sm">Built for businesses in India & UAE</p>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Does this app work offline?</h3>
                            <p className="text-slate-600">Currently, you need an internet connection to sync your data securely to the cloud.</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Can I export my expense reports?</h3>
                            <p className="text-slate-600">Yes, you can download a daily or monthly expense report as a PDF to share or print.</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Is it simple to use?</h3>
                            <p className="text-slate-600">Yes, it is designed for speed. You can add a new expense in less than 5 seconds.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Links for Internal Linking */}
            <section className="py-12 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-slate-500 mb-4">Explore other solutions:</p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <Link href="/ledger-book-online" className="text-emerald-600 hover:underline">Secure Ledger Book</Link>
                        <Link href="/track-receivables-and-payables" className="text-emerald-600 hover:underline">Receivables Tracker</Link>
                    </div>
                </div>
            </section>

            <Footer />

            <AdvisorModal isOpen={isAdvisorOpen} onClose={() => setIsAdvisorOpen(false)} />
        </div>
    );
};

export default ExpenseTrackerView;
