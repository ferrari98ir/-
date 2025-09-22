import React, { useState, useEffect } from 'react';
import type { Transaction } from '../types';
import { useToast } from '../context/ToastContext';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transactionId: string, adminPassword: string) => Promise<void>;
  transaction: Transaction | null;
  transactionDetails: { productName: string, userName: string, description: string } | null;
}

export const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({ isOpen, onClose, onConfirm, transaction, transactionDetails }) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setAdminPassword('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!adminPassword) {
      addToast('لطفا رمز عبور مدیر را وارد کنید.', 'error');
      return;
    }
    if (transaction) {
      setIsLoading(true);
      try {
        await onConfirm(transaction.id, adminPassword);
        addToast('تراکنش با موفقیت حذف شد.', 'success');
        onClose(); // Close on success
      } catch (err: any) {
        addToast(err.message, 'error');
      } finally {
        setIsLoading(false);
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
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 w-32 flex justify-center items-center"
          >
            {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : 'حذف تراکنش'}
          </button>
        </div>
      </div>
    </div>
  );
};