import "./globals.css";
import { Inter, Kalam } from "next/font/google";
import { Providers } from "@/src/components/Providers";
import { ServiceWorkerRegister } from "@/src/components/ServiceWorkerRegister";
import { InstallPrompt } from "@/src/components/InstallPrompt";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const kalam = Kalam({
    subsets: ["latin"],
    weight: ['400', '700'],
    variable: '--font-kalam'
});

export const metadata = {
    title: {
        default: "MintAccounts - Ledger Book Online",
        template: "%s | MintAccounts"
    },
    description: "The simplest ledger book online for growing businesses. Track income, expenses, and profit in multiple currencies without Excel.",
    keywords: ["ledger book online", "online khata book", "business accounting software", "daily expense tracker", "currency dealer software"],
    authors: [{ name: "MintAccounts Team" }],
    creator: "MintAccounts",
    publisher: "MintAccounts",
    metadataBase: new URL('https://mintmart.app'),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: "MintAccounts - Smart Ledger Book Online",
        description: "Track money, manage partners, and calculate profit—simple, secure, and built for real businesses.",
        url: 'https://mintmart.app',
        siteName: 'MintAccounts',
        images: [
            {
                url: '/opengraph-image.png', // We should probably create this or user needs to add it
                width: 1200,
                height: 630,
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: "MintAccounts - Ledger Book Online",
        description: "Stop using Excel. Start using MintAccounts to track your business finances.",
        // images: ['/twitter-image.png'],
    },
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "MintAccounts",
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport = {
    themeColor: "#0f172a",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} ${kalam.variable}`}>
                <Providers>
                    <ServiceWorkerRegister />
                    <InstallPrompt />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
