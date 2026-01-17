import ReceivablesView from '@/src/components/ReceivablesView';

export const metadata = {
    title: "Track Udhar Jama Online | Simple & Secure | MintAccounts",
    description: "Easily track who owes you money and who you owe. The best free app to manage business receivables and payables (Udhar/Jama) with WhatsApp reminders.",
    alternates: {
        canonical: '/track-receivables-and-payables',
    },
    openGraph: {
        title: "Track Udhar Jama Online | Simple & Secure | MintAccounts",
        description: "Stop forgetting payments. Manage your business debts and collections in one simple app.",
        url: 'https://mintmart.app/track-receivables-and-payables',
    },
    keywords: ["track receivables and payables", "accounts receivable software", "business debt tracker", "udhar jama app", "customer balance tracker"],
};

export default function ReceivablesPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'How do I send payment reminders?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'You can send automatic WhatsApp reminders to your customers directly from the app with one click.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is my customer data shared?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No. Your customer list and financial data are private and secure. We never share your data.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I track both receivables and payables?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, you can track money you are owed (Receivables/Udhar) and money you owe (Payables/Jama) in separate tabs.',
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
            <ReceivablesView />
        </>
    );
}
