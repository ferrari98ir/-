import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (productId: string, adminPassword: string) => Promise<void>;
  product: { id: string; name: string } | null;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({ isOpen, onClose, onConfirm, product }) => {
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
    if (product) {
      setIsLoading(true);
      try {
        await onConfirm(product.id, adminPassword);
        addToast(`کالای "${product.name}" با موفقیت حذف شد.`, 'success');
        onClose(); // Close only on success
      } catch (err: any) {
        addToast(err.message, 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900">تایید حذف کالا</h3>
        <p className="mt-2 text-sm text-gray-600">
          برای حذف کالای <span className="font-semibold">{product.name}</span>، لطفا رمز عبور مدیر را وارد کنید. این عمل موجودی کالا را صفر کرده و آن را حذف می‌کند.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="delete-admin-password" className="block text-sm font-medium text-gray-700">رمز عبور مدیر</label>
            <input
              type="password"
              id="delete-admin-password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              autoFocus
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
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 w-28 flex justify-center items-center"
          >
            {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : 'حذف کالا'}
          </button>
        </div>
      </div>
    </div>
  );
};