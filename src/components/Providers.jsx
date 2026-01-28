"use client";

import { SessionProvider } from "next-auth/react";
import ToastProvider from "./ToastProvider";

export function Providers({ children }) {
    return (
        <SessionProvider>
            <ToastProvider />
            {children}
        </SessionProvider>
    );
}
