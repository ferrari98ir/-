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
    const { currentUser, loading, dbError } = useInventoryContext();

    if (dbError) {
      return (
        <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4">
            <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-lg">
                <svg className="h-12 w-12 text-red-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <h2 className="mt-4 text-xl font-bold text-gray-800">خطا در اتصال به پایگاه داده</h2>
                <p className="mt-2 text-sm text-gray-600">
                  هنگام بارگذاری اطلاعات برنامه خطایی رخ داد. این مشکل معمولاً به دلیل پیکربندی نادرست پایگاه داده است.
                </p>
                <div className="mt-4 text-xs text-left text-red-700 bg-red-50 p-3 rounded-md font-mono" dir="ltr">
                  <p className="font-sans font-semibold text-right mb-1">پیام خطا:</p>
                  {dbError}
                </div>
                <p className="mt-4 text-sm text-gray-600">
                    برای رفع مشکل، لطفاً اطمینان حاصل کنید که پالیسی‌های <strong>Row Level Security (RLS)</strong> برای جداول <code>products</code>, <code>users</code>, و <code>transactions</code> در پنل Supabase شما برای نقش <code>anon</code> جهت خواندن اطلاعات (SELECT) فعال شده باشند.
                </p>
            </div>
        </div>
      );
    }

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