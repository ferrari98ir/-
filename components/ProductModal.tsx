import React, { useState, useEffect } from 'react';
import type { Product } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string | null, name: string) => Promise<string | void | undefined>;
  product: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(product?.name || '');
      setError('');
    }
  }, [isOpen, product]);

  const handleSave = async () => {
    const saveError = await onSave(product?.id || null, name);
    if (saveError) {
      setError(saveError);
    }
  };
  
  const title = product ? 'ویرایش کالا' : 'افزودن کالای جدید';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
        <div className="mt-4">
          <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">
            نام کالا
          </label>
          <input
            type="text"
            id="product-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            لغو
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            ذخیره
          </button>
        </div>
      </div>
    </div>
  );
};