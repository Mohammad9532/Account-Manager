'use client';

import React, { useState } from 'react';
import { FinanceProvider } from '@/src/context/FinanceContext';
import Layout from '@/src/components/Layout';
import AccountManagerView from '@/src/components/AccountManagerView';
import DailyExpensesView from '@/src/components/DailyExpensesView';
import ReportsView from '@/src/components/ReportsView';

export default function Home() {
    const [activeTab, setActiveTab] = useState('manager');

    const renderContent = () => {
        switch (activeTab) {
            case 'manager':
                return <AccountManagerView />;
            case 'daily':
                return <DailyExpensesView />;
            case 'reports':
                return <ReportsView />;
            default:
                return <AccountManagerView />;
        }
    };

    return (
        <FinanceProvider>
            <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
                {renderContent()}
            </Layout>
        </FinanceProvider>
    );
}
