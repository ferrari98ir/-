import React, { useState, useMemo } from 'react';
import type { Product } from '../types';

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (productId: string) => void;
  products: Product[];
}

export const ProductSearchModal: React.FC<ProductSearchModalProps> = ({ isOpen, onClose, onSelectProduct, products }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

  const handleSelect = (productId: string) => {
    onSelectProduct(productId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-8 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900">جستجوی کالا</h3>
        <div className="mt-4">
          <input
            type="text"
            placeholder="نام کالا را وارد کنید..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            autoFocus
          />
        </div>
        <ul className="mt-4 max-h-80 overflow-y-auto divide-y divide-gray-200">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <li
                key={product.id}
                onClick={() => handleSelect(product.id)}
                className="p-3 hover:bg-indigo-50 cursor-pointer"
              >
                {product.name}
              </li>
            ))
          ) : (
            <li className="p-3 text-center text-gray-500">کالایی یافت نشد.</li>
          )}
        </ul>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};