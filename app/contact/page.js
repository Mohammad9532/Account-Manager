import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: "Contact Us | MintAccounts",
    description: "Get in touch with the MintAccounts team.",
};

export default function Contact() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">Contact Us</h1>

                <p className="text-slate-600 mb-6 text-lg">
                    Have questions about MintAccounts? We're here to help.
                </p>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800 mb-2">Email Support</h2>
                        <p className="text-slate-600">
                            For general inquiries and support:<br />
                            <a href="mailto:support@mintmart.app" className="text-emerald-600 font-medium hover:underline">support@mintmart.app</a>
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-800 mb-2">Business Address</h2>
                        <p className="text-slate-600">
                            MintAccounts<br />
                            Dubai Silicon Oasis<br />
                            Dubai, UAE
                        </p>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100">
                    <Link href="/" className="text-emerald-600 font-medium hover:underline">
                        &larr; Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
