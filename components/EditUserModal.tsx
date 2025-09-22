import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { useToast } from '../context/ToastContext';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string, updates: { name?: string; password?: string }, adminPassword: string) => Promise<void>;
  user: User | null;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onConfirm, user }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name);
      setPassword(''); // Clear password field for security
      setAdminPassword('');
      setIsLoading(false);
    }
  }, [isOpen, user]);

  const handleConfirm = async () => {
    if (!name.trim()) {
      addToast('نام کاربر نمی‌تواند خالی باشد.', 'error');
      return;
    }
    if (!adminPassword) {
      addToast('رمز عبور مدیر برای ویرایش الزامی است.', 'error');
      return;
    }
    if (user) {
      const updates: { name?: string; password?: string } = {};
      if (name.trim() !== user.name) {
        updates.name = name.trim();
      }
      if (password) {
        updates.password = password;
      }

      if (Object.keys(updates).length === 0) {
        addToast('هیچ تغییری برای ذخیره وجود ندارد.', 'error');
        return;
      }
      
      setIsLoading(true);
      try {
        await onConfirm(user.id, updates, adminPassword);
        addToast(`کاربر "${name}" با موفقیت ویرایش شد.`, 'success');
        onClose();
      } catch (err: any) {
        addToast(err.message, 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900">ویرایش کاربر: {user.name}</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-user-name" className="block text-sm font-medium text-gray-700">
              نام کاربر
            </label>
            <input
              type="text"
              id="edit-user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="edit-user-password" className="block text-sm font-medium text-gray-700">
              رمز عبور جدید (اختیاری)
            </label>
            <input
              type="password"
              id="edit-user-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="برای تغییر، رمز جدید را وارد کنید"
            />
          </div>
          <div>
            <label htmlFor="edit-admin-password" className="block text-sm font-medium text-gray-700">
              رمز عبور مدیر
            </label>
            <input
              type="password"
              id="edit-admin-password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="برای تایید تغییرات، رمز مدیر را وارد کنید"
              required
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            لغو
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 w-32 flex justify-center items-center"
          >
             {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : 'ذخیره تغییرات'}
          </button>
        </div>
      </div>
    </div>
  );
};