"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);

    useEffect(() => {
        // Check if iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIosDevice);

        // Check if already installed (standalone mode) during initial load
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isStandalone) {
            return; // Don't show prompt if already installed
        }

        // Show iOS prompt on first visit if not installed
        if (isIosDevice) {
            // Only show usually if user explicitly asks, but for visibility we can show a small banner
            // For now, let's just detect it.
            setShowIOSPrompt(true);
        }

        const handleBeforeInstallPrompt = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    // Hide iOS prompt function
    const closeIOSPrompt = () => setShowIOSPrompt(false);

    if (!deferredPrompt && !showIOSPrompt) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-96 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="bg-slate-800 border border-emerald-500/30 shadow-2xl rounded-2xl p-4 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

                <div className="flex items-start gap-4 reltive z-10">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg shrink-0">
                        <Download className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                        <h3 className="font-bold text-slate-100 text-lg mb-1">Install App</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-4">
                            {isIOS
                                ? "Install MintMart to your home screen for quick access and a better experience."
                                : "Install MintMart for a seamless native app experience."}
                        </p>

                        {isIOS ? (
                            <div className="text-xs text-slate-500 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                Tap <span className="inline-block px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 mx-1">Share</span> then <span className="font-bold text-slate-300">Add to Home Screen</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstallClick}
                                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                            >
                                Install Now
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => { setDeferredPrompt(null); setShowIOSPrompt(false); }}
                        className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
