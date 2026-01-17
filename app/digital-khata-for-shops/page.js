import DigitalKhataView from '@/src/components/DigitalKhataView';

export const metadata = {
    title: {
        absolute: "Digital Khata for Shops | Secure Online Ledger | MintAccounts"
    },
    description: "Move your shop's physical khata book online. Safe, secure, and accessible from anywhere. The best digital ledger for shops in India & UAE.",
    alternates: {
        canonical: '/digital-khata-for-shops',
    },
    openGraph: {
        title: "Digital Khata for Shops - MintAccounts",
        description: "Secure your business data. Replace your physical notebook with MintAccounts Digital Khata.",
        url: 'https://mintmart.app/digital-khata-for-shops',
    },
    keywords: ["digital khata", "shop ledger book", "online khata for shop", "udhar bahi khata", "secure ledger app"],
};

export default function DigitalKhataPage() {
    return <DigitalKhataView />;
}
