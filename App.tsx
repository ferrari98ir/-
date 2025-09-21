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
    const { currentUser } = useInventoryContext();
    return currentUser ? <MainLayout /> : <Login />;
}

function App() {
  return (
    <InventoryProviderWrapper>
        <AppContent />
    </InventoryProviderWrapper>
  );
}

export default App;