'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LandingPage from '@/src/components/LandingPage';

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-emerald-400">Loading...</div>;
    }

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard');
        }
    }, [status, router]);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: "BeingReal Accounts",
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'AED',
        },
        description: 'A simple, secure account manager for growing businesses in UAE & India. Track expenses, ledger, and sales.',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <LandingPage sessionStatus={status} />
        </>
    );
}
