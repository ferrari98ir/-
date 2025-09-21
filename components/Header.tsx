import React from 'react';
import { useInventoryContext } from '../context/InventoryContext';

export const Header: React.FC = () => {
  const { currentUser, logout } = useInventoryContext();

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          سیستم مدیریت انبار
        </h1>
        {currentUser && (
          <div className="flex items-center space-x-4 space-x-reverse">
            <span className="text-sm text-gray-600">
              خوش آمدید، <span className="font-semibold">{currentUser.name}</span>
            </span>
            <button
              onClick={logout}
              className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              خروج
            </button>
          </div>
        )}
      </div>
    </header>
  );
};