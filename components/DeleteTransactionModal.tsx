import React, { useState, useEffect } from 'react';
import type { Transaction } from '../types';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transactionId: string, adminPassword: string) => void;
  transaction: Transaction | null;
  transactionDetails: { productName: string, userName: string, description: string } | null;
}

export const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({ isOpen, onClose, onConfirm, transaction, transactionDetails }) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAdminPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!adminPassword) {
      setError('لطفا رمز عبور مدیر را وارد کنید.');
      return;
    }
    if (transaction) {
      try {
        onConfirm(transaction.id, adminPassword);
        onClose(); // Close on success
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  if (!isOpen || !transaction || !transactionDetails) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900">تایید حذف تراکنش</h3>
        <div className="mt-2 text-sm text-gray-600 space-y-1">
          <p>
            آیا از حذف تراکنش زیر اطمینان دارید؟ این عمل غیرقابل بازگشت است.
          </p>
          <p><strong>کالا:</strong> {transactionDetails.productName}</p>
          <p><strong>کاربر:</strong> {transactionDetails.userName}</p>
          <p><strong>توضیحات:</strong> {transactionDetails.description}</p>
          <p><strong>تاریخ:</strong> {new Date(transaction.timestamp).toLocaleString('fa-IR')}</p>
        </div>
        <div className="mt-4">
            <label htmlFor="admin-password-delete-tx" className="block text-sm font-medium text-gray-700">رمز عبور مدیر</label>
            <input
              type="password"
              id="admin-password-delete-tx"
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
            حذف تراکنش
          </button>
        </div>
      </div>
    </div>
  );
};