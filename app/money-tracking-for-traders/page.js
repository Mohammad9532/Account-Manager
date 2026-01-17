import TradersView from '@/src/components/TradersView';

export const metadata = {
    title: "Money Tracking for Taders | Multi-Currency Ledger | MintAccounts",
    description: "The best money tracking app for currency traders. Track AED, INR, USD balances and calculate profit in real-time. Secure and fast.",
    alternates: {
        canonical: '/money-tracking-for-traders',
    },
    openGraph: {
        title: "Money Tracking for Traders - MintAccounts",
        description: "Track multiple currencies and dealer balances in one place. Built for high-speed trading math.",
        url: 'https://mintmart.app/money-tracking-for-traders',
    },
    keywords: ["money tracking for traders", "currency trading ledger", "forex account book", "multi currency accounting", "dealer balance tracker"],
};

export default function TradersPage() {
    return <TradersView />;
}
