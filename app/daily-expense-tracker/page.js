import ExpenseTrackerView from '@/src/components/ExpenseTrackerView';

export const metadata = {
    title: {
        absolute: "Daily Expense Tracker | Know Your Profit | MintAccounts"
    },
    description: "Track daily business expenses easily online. The best free expense tracker for small businesses to manage cash flow and calculate real profit.",
    alternates: {
        canonical: '/daily-expense-tracker',
    },
    openGraph: {
        title: "Daily Expense Tracker | Know Your Profit | MintAccounts",
        description: "Where did the cash go? Track every small expense and know your true profit.",
        url: 'https://mintmart.app/daily-expense-tracker',
    },
    keywords: ["daily expense tracker", "expense manager app", "business expense tracker", "petty cash book", "online kharcha book"],
};

export default function ExpenseTrackerPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'Does this app work offline?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Currently, you need an internet connection to sync your data securely to the cloud.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I export my expense reports?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, you can download a daily or monthly expense report as a PDF to share or print.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is it simple to use?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, it is designed for speed. You can add a new expense in less than 5 seconds.',
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
            <ExpenseTrackerView />
        </>
    );
}
