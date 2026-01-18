'use client';

import React from 'react';

const SEOConversionSection = ({ onTalkToAdvisor }) => {
    return (
        <section className="py-16 bg-emerald-900 text-white text-center px-6">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">Not sure if MintAccounts fits your business?</h2>
                <p className="text-emerald-100 text-lg mb-8">
                    Every business is different. Whether you are a shop, trader, or service provider, let's chat to see if this works for you.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={onTalkToAdvisor}
                        className="px-8 py-4 bg-white text-emerald-900 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors shadow-lg"
                    >
                        Ask a Question on WhatsApp
                    </button>
                    <a
                        href="/dashboard"
                        className="px-8 py-4 bg-transparent border border-emerald-700 text-white rounded-xl font-medium text-lg hover:bg-emerald-800 transition-colors"
                    >
                        See how it works
                    </a>
                </div>
                <p className="mt-6 text-sm text-emerald-300 opacity-80">
                    No sales pressure. Just honest advice.
                </p>
            </div>
        </section>
    );
};

export default SEOConversionSection;
