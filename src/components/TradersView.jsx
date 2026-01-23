'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Check } from 'lucide-react';
import AdvisorModal from './AdvisorModal';
import SEOConversionSection from './SEOConversionSection';
import Footer from './Footer';

const TradersView = () => {
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
                    Fast Money Tracking for <span className="text-emerald-600">Currency Traders</span>.
                </h1>

                <p className="font-medium text-lg text-emerald-700 mb-6">
                    Multi-currency. Real-time Balances. Profit Calculation.
                </p>

                <p className="text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
                    Track AED, INR, USD and more. Know your position with every dealer instantly.
                    <br />
                    <span className="text-base text-slate-500">Built specifically for the pace of trading.</span>
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
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Trading moves fast. Does your ledger?</h2>
                    <div className="prose prose-lg mx-auto text-slate-600">
                        <p>
                            Paperbooks and Excel can't keep up with live rates and multiple currencies.
                            <strong>BeingReal Accounts</strong> is designed for traders who need speed.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-8">
                            <li><strong>Multi-Currency:</strong> Track balances in AED and INR simultaneously.</li>
                            <li><strong>Auto-Conversion:</strong> See your total worth in one currency based on your set rates.</li>
                            <li><strong>Dealer Management:</strong> Keep separate accounts for every dealer you work with.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <SEOConversionSection onTalkToAdvisor={() => setIsAdvisorOpen(true)} />

            {/* Internal Linking Footer */}
            <section className="py-12 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-slate-500 mb-4">See how we help others:</p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <Link href="/accounting-for-small-business" className="text-emerald-600 hover:underline">For Small Business</Link>
                        <Link href="/digital-khata-for-shops" className="text-emerald-600 hover:underline">For Shops</Link>
                    </div>
                </div>
            </section>

            <Footer />

            <AdvisorModal isOpen={isAdvisorOpen} onClose={() => setIsAdvisorOpen(false)} />
        </div>
    );
};

export default TradersView;
