import React, { useState } from 'react';
import { Download, X, MessageCircle } from 'lucide-react';
import { generateStatementPDF } from '../utils/pdfGenerator';

const ShareStatementModal = ({
    isOpen,
    onClose,
    data
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const doc = await generateStatementPDF({
                title: data.title,
                subtitle: data.subtitle,
                dateRange: data.dateRange,
                stats: data.stats,
                transactions: data.transactions
            });
            const filename = `${data.title.replace(/\s+/g, '_')}_Statement.pdf`;
            doc.save(filename);
            // Optional: User feedback handled by UI loading state
        } catch (err) {
            console.error("PDF Generation Error", err);
            alert("Failed to generate PDF");
        } finally {
            setIsGenerating(false);
            onClose();
        }
    };

    const handleWhatsApp = async () => {
        setIsGenerating(true);
        try {
            // WhatsApp sharing usually implies sending text instructions or a link
            // Since we can't attach files directly via web link, we guide the user.
            const text = `Here is the statement for ${data.title}. Please download the attached PDF.`;
            const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
            onClose();
            // Trigger download so they have the file to attach
            const doc = await generateStatementPDF({
                title: data.title,
                subtitle: data.subtitle,
                dateRange: data.dateRange,
                stats: data.stats,
                transactions: data.transactions
            });
            doc.save(`${data.title.replace(/\s+/g, '_')}_Statement.pdf`);
        } catch (err) {
            console.error("WhatsApp Share Error", err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">Share Statement</h3>
                        <p className="text-sm text-slate-400 mt-1">Choose how you want to share</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="w-full group flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl transition-all active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                                <Download className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-white">Download PDF</div>
                                <div className="text-xs text-slate-400">Save to your device</div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={handleWhatsApp}
                        disabled={isGenerating}
                        className="w-full group flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl transition-all active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 text-green-400 rounded-lg group-hover:bg-green-500/20 group-hover:scale-110 transition-all">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-white">Share on WhatsApp</div>
                                <div className="text-xs text-slate-400">Open WhatsApp Web</div>
                            </div>
                        </div>
                    </button>
                </div>

                {isGenerating && (
                    <div className="text-center text-sm text-slate-500 animate-pulse">
                        Generating professional PDF...
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShareStatementModal;
