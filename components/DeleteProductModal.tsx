import React, { useState, useEffect } from 'react';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (productId: string, adminPassword: string) => Promise<void>;
  product: { id: string; name: string } | null;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({ isOpen, onClose, onConfirm, product }) => {
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
    if (product) {
      try {
        await onConfirm(product.id, adminPassword);
        onClose(); // Close only on success
      } catch (err: any) {
        setError(err.message);
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
            حذف کالا
          </button>
        </div>
      </div>
    </div>
  );
};