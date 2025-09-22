import React, { useState, useEffect } from 'react';
import type { Product } from '../types';
import { useToast } from '../context/ToastContext';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string | null, name: string) => Promise<void>;
  product: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product }) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName(product?.name || '');
      setIsLoading(false);
    }
  }, [isOpen, product]);

  const handleSave = async () => {
    if (!name.trim()) {
        addToast("نام کالا نمی‌تواند خالی باشد.", "error");
        return;
    }

    setIsLoading(true);
    try {
        await onSave(product?.id || null, name);
        addToast(product ? "کالا با موفقیت ویرایش شد." : "کالای جدید با موفقیت اضافه شد.", 'success');
        onClose();
    } catch (err: any) {
        addToast(err.message, 'error');
    } finally {
        setIsLoading(false);
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
        </div>
        <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
          <button
            onClick={onClose}
            type="button"
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            لغو
          </button>
          <button
            onClick={handleSave}
            type="button"
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 w-20 flex justify-center items-center"
          >
            {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : 'ذخیره'}
          </button>
        </div>
      </div>
    </div>
  );
};