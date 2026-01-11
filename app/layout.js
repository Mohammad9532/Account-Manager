import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "@/src/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "MintMart - Account Manager",
    description: "Modern Account Management System",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
