import React from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ProductInventory } from './components/ProductInventory';
import { TransactionHistory } from './components/TransactionHistory';
import { useInventory } from './hooks/useInventory';
import { InventoryProvider, useInventoryContext } from './context/InventoryContext';
import { UserManagement } from './components/UserManagement';
import { InboundTransactionForm } from './components/InboundTransactionForm';
import { OutboundTransactionForm } from './components/OutboundTransactionForm';
import { Login } from './components/Login';
import { ToastProvider } from './context/ToastContext';

// A wrapper component to provide the context
const InventoryProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const inventoryData = useInventory();
  return (
    <InventoryProvider value={inventoryData}>
      {children}
    </InventoryProvider>
  );
};

// The main layout for authenticated users
const MainLayout: React.FC = () => {
  const { currentUser } = useInventoryContext();
  const isAdmin = currentUser?.id === 'admin';

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Dashboard />
            </div>
            <div className="lg:col-span-1 space-y-8">
              <InboundTransactionForm />
              <OutboundTransactionForm />
              {isAdmin && <UserManagement />}
              <ProductInventory />
            </div>
          </div>
          <div>
            <TransactionHistory />
          </div>
        </div>
      </main>
    </div>
  );
};

// The component that decides what to render
const AppContent: React.FC = () => {
    const { currentUser, loading } = useInventoryContext();

    if (loading) {
      return (
        <div className="min-h-screen bg-slate-100 flex justify-center items-center">
            <div className="text-center">
                <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-lg text-gray-600">در حال بارگذاری اطلاعات...</p>
            </div>
        </div>
      );
    }
    
    return currentUser ? <MainLayout /> : <Login />;
}

function App() {
  return (
    <InventoryProviderWrapper>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </InventoryProviderWrapper>
  );
}

export default App;