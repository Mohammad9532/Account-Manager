import ShareLedgerView from '@/src/components/ShareLedgerView';

export const metadata = {
    title: "Share Ledger Online Securely | Partner Access | BeingReal Account's",
    description: "Share specific ledgers with partners, accountants, or staff securely. Invite-only access, read-only permissions, and live updates. No public links.",
    keywords: ["share ledger online", "online khata sharing", "joint account tracking", "partner ledger access", "secure financial sharing"],
    alternates: {
        canonical: '/share-ledger-online',
    },
    openGraph: {
        title: "Secure Online Ledger Sharing - BeingReal Account's",
        description: "Give access to partners or accountants — without sharing your full account.",
        type: 'website',
    }
};

export default function ShareLedgerOnlinePage() {
    return <ShareLedgerView />;
}
