import React, { useState, useEffect } from 'react';
import type { User } from '../types';

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
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name);
      setPassword(''); // Clear password field for security
      setAdminPassword('');
      setError('');
    }
  }, [isOpen, user]);

  const handleConfirm = async () => {
    setError('');
    if (!name.trim()) {
      setError('نام کاربر نمی‌تواند خالی باشد.');
      return;
    }
    if (!adminPassword) {
      setError('رمز عبور مدیر برای ویرایش الزامی است.');
      return;
    }
    if (user) {
      try {
        const updates: { name?: string; password?: string } = {};
        if (name.trim() !== user.name) {
          updates.name = name.trim();
        }
        if (password) {
          updates.password = password;
        }
        if (Object.keys(updates).length > 0) {
          await onConfirm(user.id, updates, adminPassword);
        }
        onClose();
      } catch (err: any) {
        setError(err.message);
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
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            لغو
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            ذخیره تغییرات
          </button>
        </div>
      </div>
    </div>
  );
};