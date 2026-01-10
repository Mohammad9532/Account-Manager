import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import Layout from './components/Layout';
import AccountManagerView from './components/AccountManagerView';
import DailyExpensesView from './components/DailyExpensesView';
import ReportsView from './components/ReportsView';

function App() {
  const [activeTab, setActiveTab] = useState('manager'); // Default to manager view

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

export default App;
