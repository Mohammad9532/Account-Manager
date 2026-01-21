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
        default: "BeingReal Account's - Ledger Book Online",
        template: "%s | BeingReal Account's"
    },
    description: "The simplest ledger book online for growing businesses. Track income, expenses, and profit in multiple currencies without Excel.",
    keywords: ["ledger book online", "online khata book", "business accounting software", "daily expense tracker", "currency dealer software"],
    authors: [{ name: "BeingReal Team" }],
    creator: "BeingReal Account's",
    publisher: "BeingReal Account's",
    metadataBase: new URL('https://accounts.beingreal.in'),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: "BeingReal Account's - Smart Ledger Book Online",
        description: "Track money, manage partners, and calculate profit—simple, secure, and built for real businesses.",
        url: 'https://accounts.beingreal.in',
        siteName: "BeingReal Account's",
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
        title: "BeingReal Account's - Ledger Book Online",
        description: "Stop using Excel. Start using BeingReal Account's to track your business finances.",
        // images: ['/twitter-image.png'],
    },
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "BeingReal Account's",
    },
    verification: {
        google: [
            'zuMJP9M3wfmFsmqZ7xhjgi3HDF53ckjRZhPWhNlxJ2I',
            'wpO74RNoUe-uIcpkMRsOsSd_vgWf7jRG8W0MNzKGmSc',
        ],
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
