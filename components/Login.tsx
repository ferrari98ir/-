import React, { useState, useEffect } from 'react';
import { useInventoryContext } from '../context/InventoryContext';

export const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800">ورود به سیستم مدیریت انبار</h1>
          </div>
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 space-x-reverse" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('user')}
                className={`${
                  activeTab === 'user'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                ورود کاربر
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`${
                  activeTab === 'admin'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                ورود مدیر
              </button>
            </nav>
          </div>

          {activeTab === 'user' ? <UserLoginForm /> : <AdminLoginForm />}
        </div>
      </div>
    </div>
  );
};

const UserLoginForm = () => {
  const { login, users } = useInventoryContext();
  const availableUsers = users.filter(u => !u.isDeleted);
  
  const [userId, setUserId] = useState(availableUsers[0]?.id || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId && availableUsers.length > 0) {
        setUserId(availableUsers[0].id);
    }
  }, [users, userId, availableUsers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      login({ userId, password });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="user-select" className="block text-sm font-medium text-gray-700">
          انتخاب کاربر
        </label>
        <select
          id="user-select"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {availableUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="user-password" className="block text-sm font-medium text-gray-700">
          رمز عبور
        </label>
        <input
          type="password"
          id="user-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          ورود
        </button>
      </div>
    </form>
  );
};

const AdminLoginForm = () => {
  const { login } = useInventoryContext();
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      login({ adminPassword });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">
          رمز عبور مدیر
        </label>
        <input
          type="password"
          id="admin-password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          required
          autoFocus
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          ورود به عنوان مدیر
        </button>
      </div>
    </form>
  );
};