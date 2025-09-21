import React, { useState, useEffect } from 'react';
import type { User } from '../types';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string, adminPassword: string) => Promise<void>;
  user: User | null;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ isOpen, onClose, onConfirm, user }) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAdminPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!adminPassword) {
      setError('لطفا رمز عبور مدیر را وارد کنید.');
      return;
    }
    if (user) {
      try {
        await onConfirm(user.id, adminPassword);
        onClose(); // Close on success
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900">تایید حذف کاربر</h3>
        <p className="mt-2 text-sm text-gray-600">
          آیا از حذف کاربر <span className="font-semibold">{user.name}</span> اطمینان دارید؟ تراکنش‌های این کاربر در سیستم باقی خواهند ماند.
        </p>
        <div className="mt-4">
            <label htmlFor="admin-password-delete-user" className="block text-sm font-medium text-gray-700">رمز عبور مدیر</label>
            <input
              type="password"
              id="admin-password-delete-user"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              autoFocus
            />
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
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            حذف کاربر
          </button>
        </div>
      </div>
    </div>
  );
};