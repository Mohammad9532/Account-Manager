import "./globals.css";
import { Inter, Kalam } from "next/font/google";
import { Providers } from "@/src/components/Providers";
import { ServiceWorkerRegister } from "@/src/components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const kalam = Kalam({
    subsets: ["latin"],
    weight: ['400', '700'],
    variable: '--font-kalam'
});

export const metadata = {
    title: "MintMart - Account Manager",
    description: "Modern Account Management System",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "MintMart",
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
                    {children}
                </Providers>
            </body>
        </html>
    );
}
