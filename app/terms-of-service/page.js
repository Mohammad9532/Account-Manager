import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: "Terms of Service | MintAccounts",
    description: "Terms of Service for using MintAccounts.",
};

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">Terms of Service</h1>
                <p className="text-slate-600 mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">1. Acceptance of Terms</h2>
                <p className="text-slate-600 mb-4">
                    By accessing or using MintAccounts, you agree to be bound by these Terms of Service. If you do not agree, do not use our services.
                </p>

                <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">2. Nature of Service</h2>
                <p className="text-slate-600 mb-4">
                    MintAccounts is a software tool for accounting, record-keeping, and business management.
                    <strong> We do not provide financial, investment, legal, or tax advice.</strong>
                    Users are responsible for verifying the accuracy of their own data and reports.
                </p>

                <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">3. User Responsibilities</h2>
                <p className="text-slate-600 mb-4">
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>

                <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">4. Limitation of Liability</h2>
                <p className="text-slate-600 mb-4">
                    MintAccounts is provided "as is". We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
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
