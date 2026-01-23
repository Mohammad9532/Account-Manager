'use client';

import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

const AdvisorModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState('form'); // form | success
    const [formData, setFormData] = useState({
        role: '',
        volume: '',
        problem: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Construct WhatsApp Message
        const message = encodeURIComponent(
            `*New BeingReal Accounts Review Request*\n\n` +
            `\uD83D\uDC64 *Business Type:* ${formData.role}\n` +
            `\uD83D\uDCB0 *Monthly Volume:* ${formData.volume}\n` +
            `\u26A0\uFE0F *Main Issue:* ${formData.problem}\n\n` +
            `Hello, I would like to understand how BeingReal Accounts works for my business.`
        );

        // Replace this with your actual WhatsApp number
        const phoneNumber = '917753919089';

        // Open WhatsApp
        window.open(`https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`, '_blank');

        setStep('success');
    };

    const handleClose = () => {
        if (step === 'success') {
            // Reset for next time
            setStep('form');
            setFormData({ role: '', volume: '', problem: '' });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {step === 'form' ? (
                    <>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Get your money system reviewed</h2>
                        <p className="text-slate-600 mb-6">Answer 3 quick questions to help us match you with the right expert.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Question 1: Role */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">What do you do?</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Currency dealer', 'Trader', 'Shop', 'Service business', 'Other'].map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: opt })}
                                            className={`p-3 rounded-lg text-sm font-medium border text-left transition-all ${formData.role === opt
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                                                : 'border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Question 2: Volume */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">How much money moves every month?</label>
                                <div className="flex flex-wrap gap-2">
                                    {['₹1–5 lakh', '₹5–25 lakh', '₹25L+'].map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, volume: opt })}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${formData.volume === opt
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                                                : 'border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Question 3: Problem */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">What is your biggest problem?</label>
                                <div className="space-y-2">
                                    {['Don’t know who owes me', 'Profit is unclear', 'Cash vs bank mismatch', 'Partner disputes'].map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, problem: opt })}
                                            className={`w-full p-3 rounded-lg text-sm font-medium border text-left transition-all ${formData.problem === opt
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                                                : 'border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!formData.role || !formData.volume || !formData.problem}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-lg shadow-emerald-200"
                            >
                                Submit for Review
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Received!</h2>
                        <p className="text-slate-600 text-lg">
                            A BeingReal Accounts expert will contact you within 24 hours.
                        </p>
                        <button
                            onClick={handleClose}
                            className="mt-8 px-6 py-2 text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvisorModal;
