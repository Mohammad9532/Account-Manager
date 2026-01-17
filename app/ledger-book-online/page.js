import LedgerView from '@/src/components/LedgerView';

export const metadata = {
    title: "Free Ledger Book Online | No More Excel | MintAccounts",
    description: "The best free ledger book online. Replace your physical khata with a secure, digital account book. Track daily expenses and customer udhar/jama easily.",
    alternates: {
        canonical: '/ledger-book-online',
    },
    openGraph: {
        title: "Free Ledger Book Online | No More Excel | MintAccounts",
        description: "Secure, simple, and free ledger book online for your business.",
        url: 'https://mintmart.app/ledger-book-online',
    },
    keywords: ["ledger book online", "khata book online", "online udhar jama", "digital ledger", "business account book", "daily finance tracker"],
};

export default function LedgerPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'Is this online ledger book safe?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. MintAccounts uses bank-grade encryption to keep your financial data secure. Only you have access to your data.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I use it on mobile?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Absolutely. Our ledger book online works perfectly on any smartphone, tablet, or computer.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is it free to start?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, you can create your account and start managing your ledger book for free.',
                },
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <LedgerView />
        </>
    );
}
