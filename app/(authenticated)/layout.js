'use client';

import { FinanceProvider } from '@/src/context/FinanceContext';
import Layout from '@/src/components/Layout';

export default function AuthenticatedLayout({ children }) {
    return (
        <FinanceProvider>
            <Layout>
                {children}
            </Layout>
        </FinanceProvider>
    );
}
