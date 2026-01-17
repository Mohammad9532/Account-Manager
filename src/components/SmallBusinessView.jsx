'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Check } from 'lucide-react';
import AdvisorModal from './AdvisorModal';
import SEOConversionSection from './SEOConversionSection';

const SmallBusinessView = () => {
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
                        Try it free
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-16 pb-24 px-6 md:px-12 max-w-7xl mx-auto text-center relative overflow-hidden">
                <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute top-10 right-10 w-64 h-64 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 relative z-10">
                    Simple Accounting for <span className="text-emerald-600">Small Business</span>.
                </h1>

                <p className="font-medium text-lg text-emerald-700 mb-6">
                    Easier than Excel. Smarter than a notebook.
                </p>

                <p className="text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
                    Track sales, manage expenses, and see your profit without hiring an accountant.
                    <br />
                    <span className="text-base text-slate-500">Essential tools for growing businesses in UAE & India.</span>
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                    <Link
                        href="/dashboard"
                        className="px-8 py-4 bg-emerald-500 text-white rounded-lg font-semibold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2"
                    >
                        Get Started Free <ChevronRight className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => setIsAdvisorOpen(true)}
                        className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium text-lg hover:bg-slate-50 transition-colors"
                    >
                        Talk to an Advisor
                    </button>
                </div>

                <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Private, Secure & Built for UAE/India Business
                </p>
            </header>

            {/* Problem Section */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Why standard accounting software fails you</h2>
                    <div className="prose prose-lg mx-auto text-slate-600">
                        <p>
                            Big accounting software is too complex and expensive. Excel sheets get messy and broken.
                            <strong>MintAccounts</strong> is built for the middle ground.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-8">
                            <li><strong>Zero Learning Curve:</strong> If you can send a WhatsApp message, you can use this.</li>
                            <li><strong>Mobile First:</strong> Run your business from your phone, anywhere.</li>
                            <li><strong>Focus on Cash:</strong> We value cash flow and simple receivables over complex audits.</li>
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
                        <Link href="/digital-khata-for-shops" className="text-emerald-600 hover:underline">For Shops</Link>
                        <Link href="/money-tracking-for-traders" className="text-emerald-600 hover:underline">For Traders</Link>
                    </div>
                </div>
            </section>

            <footer className="py-8 text-center text-slate-500 bg-slate-50 border-t border-slate-200">
                <p>&copy; {new Date().getFullYear()} MintAccounts. Simple Small Business Accounting.</p>
            </footer>

            <AdvisorModal isOpen={isAdvisorOpen} onClose={() => setIsAdvisorOpen(false)} />
        </div>
    );
};

export default SmallBusinessView;
