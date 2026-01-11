'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Chrome, Phone, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [isMobileLogin, setIsMobileLogin] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form States
    const [formData, setFormData] = useState({ name: '', phone: '', password: '' });

    const handleGoogleLogin = async () => {
        setLoading(true);
        await signIn('google', { callbackUrl: '/' });
    };

    const handleMobileSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                // Register Flow
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                // Auto login after register
                const loginRes = await signIn('credentials', {
                    phone: formData.phone,
                    password: formData.password,
                    redirect: false
                });

                if (loginRes.error) throw new Error(loginRes.error);
                router.push('/');
            } else {
                // Login Flow
                const res = await signIn('credentials', {
                    phone: formData.phone,
                    password: formData.password,
                    redirect: false
                });

                if (res?.error) throw new Error(res.error);
                router.push('/');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                <p className="text-slate-400">Sign in to manage your accounts</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center">
                    {error}
                </div>
            )}

            {/* Main Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl mb-8">
                <button
                    onClick={() => setIsMobileLogin(false)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${!isMobileLogin ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Google
                </button>
                <button
                    onClick={() => setIsMobileLogin(true)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${isMobileLogin ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Mobile
                </button>
            </div>

            {/* Google Login View */}
            {!isMobileLogin && (
                <div className="space-y-4">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5 text-blue-500" />}
                        Continue with Google
                    </button>
                    <p className="text-xs text-center text-slate-500">
                        Secure access via your Google Account
                    </p>
                </div>
            )}

            {/* Mobile Login View */}
            {isMobileLogin && (
                <form onSubmit={handleMobileSubmit} className="space-y-4">
                    {isRegistering && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="John Doe"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone Number</label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="050 123 4567"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegistering ? 'Create Account' : 'Sign In')}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>

                    <div className="pt-4 text-center">
                        <button
                            type="button"
                            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
