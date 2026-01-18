import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: "Privacy Policy | MintAccounts",
    description: "Privacy Policy for MintAccounts. How we handle your data.",
};

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
                <p className="text-slate-600 mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">1. Introduction</h2>
                <p className="text-slate-600 mb-4">
                    MintAccounts ("we", "our", or "us") provides a digital ledger and accounting tool.
                    We are committed to protecting your privacy and ensuring your financial data remains secure.
                </p>

                <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">2. Data Collection</h2>
                <p className="text-slate-600 mb-4">
                    We collect information you provide directly to us when you create an account, such as your email address and business name.
                    We also process the financial data you enter into the ledger (income, expenses, customer details) solely for the purpose of providing the service.
                </p>

                <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">3. Use of Data</h2>
                <p className="text-slate-600 mb-4">
                    We do NOT sell your personal data to third parties. We use your data to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
                    <li>Provide, maintain, and improve our services.</li>
                    <li>Generate accounting reports for your use.</li>
                    <li>Respond to your comments and questions.</li>
                </ul>

                <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">4. Security</h2>
                <p className="text-slate-600 mb-4">
                    We implement industry-standard security measures to protect your data from unauthorized access.
                </p>

                <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">5. Contact Us</h2>
                <p className="text-slate-600 mb-4">
                    If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:support@mintmart.app" className="text-emerald-600 hover:underline">support@mintmart.app</a>
                </p>

                <div className="mt-12 pt-8 border-t border-slate-100">
                    <Link href="/" className="text-emerald-600 font-medium hover:underline">
                        &larr; Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
