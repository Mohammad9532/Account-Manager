import "./globals.css";
import { Inter, Kalam } from "next/font/google";
import { Providers } from "@/src/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const kalam = Kalam({
    subsets: ["latin"],
    weight: ['400', '700'],
    variable: '--font-kalam'
});

export const metadata = {
    title: "MintMart - Account Manager",
    description: "Modern Account Management System",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} ${kalam.variable}`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
