'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Check } from 'lucide-react';
import AdvisorModal from './AdvisorModal';
import SEOConversionSection from './SEOConversionSection';
import Footer from './Footer';

const ReceivablesView = () => {
    const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-4 md:px-12 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <Link href="/">
                        <img src="/mint-logo.png" alt="BeingReal Account's" className="h-12 w-auto rounded-xl" />
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
                    Track <span className="text-emerald-600">Receivables & Payables</span> Without Confusion.
                </h1>

                <p className="font-medium text-lg text-emerald-700 mb-6">
                    Never forget who owes you money again.
                </p>

                <p className="text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
                    Send WhatsApp reminders, track udhar/jama, and settle debts faster.
                    <br />
                    <span className="text-base text-slate-500">Simple debt tracking for small businesses.</span>
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                    <Link
                        href="/dashboard"
                        className="px-8 py-4 bg-emerald-500 text-white rounded-lg font-semibold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2"
                    >
                        Start Tracking Udhar <ChevronRight className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => setIsAdvisorOpen(true)}
                        className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium text-lg hover:bg-slate-50 transition-colors"
                    >
                        Ask a Question on WhatsApp
                    </button>
                </div>

                <p className="text-xs text-slate-400 max-w-lg mx-auto mb-4 leading-relaxed">
                    BeingReal Account's is an accounting & money management tool. We do not provide financial advice or request sensitive personal information.
                </p>

                <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Private, Secure & Built for UAE/India Business
                </p>
            </header>

            {/* Problem Section */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Stop chasing payments in your head</h2>
                    <div className="prose prose-lg mx-auto text-slate-600">
                        <p>
                            "I'll pay you tomorrow" often turns into weeks of waiting. If you don't write it down, you lose money.
                            <strong>BeingReal Account's</strong> makes tracking receivables (Udhar) and payables (Jama) easy.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-8">
                            <li><strong>Automated Reminders:</strong> Send a professional WhatsApp summary to customers in one click.</li>
                            <li><strong>Clear History:</strong> See exactly when a debt started and every payment made since.</li>
                            <li><strong>Aging Analysis:</strong> Know who is late and who pays on time.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Smart Reminders",
                            desc: "Send polite automatic reminders to customers on WhatsApp.",
                            icon: "⏰",
                            color: "bg-emerald-50 text-emerald-600"
                        },
                        {
                            title: "Aging Reports",
                            desc: "See how long a payment has been pending (30, 60, 90 days).",
                            icon: "📅",
                            color: "bg-blue-50 text-blue-600"
                        },
                        {
                            title: "Multi-Party Settlement",
                            desc: "Adjust balances between partners easily.",
                            icon: "🤝",
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
                        <p className="text-emerald-600 font-medium bg-emerald-50 inline-block px-4 py-1 rounded-full text-sm">Private & secure money tracking</p>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">How do I send payment reminders?</h3>
                            <p className="text-slate-600">You can send automatic WhatsApp reminders to your customers directly from the app with one click.</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Is my customer data shared?</h3>
                            <p className="text-slate-600">No. Your customer list and financial data are private and secure. We never share your data.</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Can I track both receivables and payables?</h3>
                            <p className="text-slate-600">Yes, you can track money you are owed (Receivables/Udhar) and money you owe (Payables/Jama) in separate tabs.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Links for Internal Linking */}
            <section className="py-12 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-slate-500 mb-4">Explore other solutions:</p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <Link href="/ledger-book-online" className="text-emerald-600 hover:underline">One-click Ledger Book</Link>
                        <Link href="/daily-expense-tracker" className="text-emerald-600 hover:underline">Daily Expense Tracker</Link>
                    </div>
                </div>
            </section>

            <Footer />

            <AdvisorModal isOpen={isAdvisorOpen} onClose={() => setIsAdvisorOpen(false)} />
        </div>
    );
};

export default ReceivablesView;
