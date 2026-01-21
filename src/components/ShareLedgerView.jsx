'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Check } from 'lucide-react';
import AdvisorModal from './AdvisorModal';
import SEOConversionSection from './SEOConversionSection';
import Footer from './Footer';

const ShareLedgerView = () => {
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
                    Share a Ledger <span className="text-emerald-600">Securely</span>.
                </h1>

                <p className="font-medium text-lg text-emerald-700 mb-6">
                    Give access to partners or accountants — without sharing your full account.
                </p>

                <p className="text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
                    Stop sending screenshots. Give your partners live, read-only access to their specific ledger.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                    <Link
                        href="/dashboard"
                        className="px-8 py-4 bg-emerald-500 text-white rounded-lg font-semibold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2"
                    >
                        Try Secure Ledger Sharing <ChevronRight className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => setIsAdvisorOpen(true)}
                        className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium text-lg hover:bg-slate-50 transition-colors"
                    >
                        Ask a Question
                    </button>
                </div>

                <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-2 bg-slate-50 px-4 py-2 rounded-full inline-block mx-auto border border-slate-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Ledger sharing is invite-only. Only registered users can access shared ledgers. No public links.
                </p>
            </header>

            {/* Content Section: Educational First */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-4xl mx-auto px-6">
                    {/* Problem */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">The Problem with WhatsApp & Excel</h2>
                        <div className="prose prose-lg mx-auto text-slate-600">
                            <p>
                                Most businesses share ledger updates by sending screenshots on WhatsApp or emailing Excel sheets.
                                This is <strong>slow, messy, and insecure</strong>.
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mb-8">
                                <li><strong>Screenshots get lost:</strong> "Can you send the balance again?" is a daily waste of time.</li>
                                <li><strong>Excel is static:</strong> The moment you send a file, it's outdated.</li>
                                <li><strong>Privacy risks:</strong> Accidentally sending the wrong screenshot reveals your private data.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Solution */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">The Solution: Live, Permission-Based Access</h2>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-lg text-slate-700 mb-6">
                                With <strong>BeingReal Account's</strong>, you don't send files. You grant access.
                            </p>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <h3 className="font-bold text-emerald-800 mb-2">1. Select a Ledger</h3>
                                    <p className="text-sm text-emerald-700">Choose the specific customer or partner ledger you want to share.</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <h3 className="font-bold text-emerald-800 mb-2">2. Enter Their Email</h3>
                                    <p className="text-sm text-emerald-700">Invite them using their registered email address.</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <h3 className="font-bold text-emerald-800 mb-2">3. Set Permissions</h3>
                                    <p className="text-sm text-emerald-700">Choose <strong>Viewer</strong> (Read-Only) or <strong>Editor</strong> (Can add transactions).</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <h3 className="font-bold text-emerald-800 mb-2">4. They See It Live</h3>
                                    <p className="text-sm text-emerald-700">They log in to their own dashboard and see the shared ledger instantly.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Use Cases */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Who is this for?</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { title: "Business Partners", desc: "Keep joint venture accounts transparent. Both partners see every transaction instantly." },
                                { title: "Accountants", desc: "Give your accountant read-only access to verify entries without giving them your bank password." },
                                { title: "Staff / Managers", desc: "Let staff record sales in a specific ledger without seeing your total business profit." }
                            ].map((item, i) => (
                                <div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                                    <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-600">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security */}
                    <div>
                        <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Security First</h2>
                        <div className="prose prose-lg mx-auto text-slate-600 bg-white p-8 rounded-2xl border border-slate-200">
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                                    <span><strong>Invite-Only:</strong> Access is granted only to specific email addresses. No public "share links" that can be leaked.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                                    <span><strong>Isolated Views:</strong> A partner can ONLY see the ledger you shared. They cannot see your other accounts, your total balance, or your profit.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                                    <span><strong>Revoke Anytime:</strong> Stop sharing instantly with one click.</span>
                                </li>
                            </ul>
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
                        <Link href="/ledger-book-online" className="text-emerald-600 hover:underline">Ledger Book Online</Link>
                        <Link href="/daily-expense-tracker" className="text-emerald-600 hover:underline">Daily Expense Tracker</Link>
                    </div>
                </div>
            </section>

            <Footer />

            <AdvisorModal isOpen={isAdvisorOpen} onClose={() => setIsAdvisorOpen(false)} />
        </div>
    );
};

export default ShareLedgerView;
