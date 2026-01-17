'use client';

import React, { useState } from 'react';
import { FinanceProvider } from '@/src/context/FinanceContext';
import Layout from '@/src/components/Layout';
import AccountManagerView from '@/src/components/AccountManagerView';
import DailyExpensesView from '@/src/components/DailyExpensesView';
import IncomeView from '@/src/components/IncomeView';
import LedgerBookView from '@/src/components/LedgerBookView';

import ReportsView from '@/src/components/ReportsView';
import CurrencyDealerSection from '@/src/components/CurrencyDealerSection';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('manager');

    const renderContent = () => {
        switch (activeTab) {
            case 'manager':
                return <AccountManagerView />;
            case 'daily':
                return <DailyExpensesView />;
            case 'income':
                return <IncomeView />;
            case 'ledgers':
                return <LedgerBookView />;
            case 'reports':
                return <ReportsView />;
            case 'currency':
                return <CurrencyDealerSection />;
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
