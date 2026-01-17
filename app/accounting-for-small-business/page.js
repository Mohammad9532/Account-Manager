import SmallBusinessView from '@/src/components/SmallBusinessView';

export const metadata = {
    title: "Simple Accounting Software for Small Business | MintAccounts",
    description: "The easiest accounting app for small businesses in UAE & India. Track sales, expenses, and profit without complex software or accountants.",
    alternates: {
        canonical: '/accounting-for-small-business',
    },
    openGraph: {
        title: "Simple Accounting for Small Business - MintAccounts",
        description: "Stop struggling with Excel. Manage your business finances with the simplest accounting tool online.",
        url: 'https://mintmart.app/accounting-for-small-business',
    },
    keywords: ["accounting for small business", "small business accounting software", "simple bookkeeping app", "business finance tracker", "sme accounting"],
};

export default function SmallBusinessPage() {
    return <SmallBusinessView />;
}
