import React from 'react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="py-12 bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl font-bold text-slate-900">BeingReal Accounts</span>
                        </div>
                        <p className="text-slate-500 text-sm max-w-sm">
                            The simple, secure ledger book online for growing businesses in UAE & India.
                            Replace physical khatas and Excel with a smart digital tool.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 mb-4">Product</h3>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link href="/ledger-book-online" className="hover:text-emerald-600">Ledger Book</Link></li>
                            <li><Link href="/daily-expense-tracker" className="hover:text-emerald-600">Expense Tracker</Link></li>
                            <li><Link href="/track-receivables-and-payables" className="hover:text-emerald-600">Receivables</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 mb-4">Legal & Support</h3>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link href="/contact" className="hover:text-emerald-600">Contact Us</Link></li>
                            <li><Link href="/privacy-policy" className="hover:text-emerald-600">Privacy Policy</Link></li>
                            <li><Link href="/terms-of-service" className="hover:text-emerald-600">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                    <p>&copy; {new Date().getFullYear()} BeingReal Accounts. All rights reserved.</p>
                    <p>Built for Business. Secure by Design.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
