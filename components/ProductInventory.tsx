import React, { useState, useMemo } from 'react';
import { useInventoryContext } from '../context/InventoryContext';
import { Card } from './Card';
import type { Product } from '../types';
import { ProductModal } from './ProductModal';
import { DeleteProductModal } from './DeleteProductModal';

export const ProductInventory: React.FC = () => {
  const { inventoryData, warehouses, products, deleteProduct, addProduct, updateProduct, currentUser } = useInventoryContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = currentUser?.id === 'admin';

  const productList = useMemo(() => {
    const list = products
      .filter(p => !p.isDeleted)
      .map(p => ({
        ...p,
        ...(inventoryData[p.id] || { stock: {}, total: 0, productName: p.name }),
      }));

    if (!searchTerm.trim()) {
      return list;
    }

    return list.filter(p =>
      p.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
  }, [products, inventoryData, searchTerm]);


  const handleAddNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = (productId: string, adminPassword: string) => {
    // The modal will await this promise and handle toasts
    return deleteProduct(productId, adminPassword);
  };

  const handleSave = (id: string | null, name: string) => {
    // The modal will await this promise and handle toasts
    if (id) {
      return updateProduct(id, name);
    } else {
      return addProduct(name);
    }
  };

  return (
    <>
      {isAdmin && (
        <>
          <ProductModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            product={editingProduct}
          />
          <DeleteProductModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            product={deletingProduct}
          />
        </>
      )}
      <Card title="مدیریت و موجودی کالاها">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="w-full sm:w-auto">
                <input
                    type="text"
                    placeholder="جستجوی کالا..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            {isAdmin && (
              <button
                onClick={handleAddNew}
                className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                افزودن کالای جدید
              </button>
            )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  کالا
                </th>
                {warehouses.map(w => (
                  <th key={w.id} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {w.name.split(' ')[0]} {w.name.split(' ')[1]}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  مجموع
                </th>
                {isAdmin && (
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productList.length > 0 ? productList.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  {warehouses.map(w => (
                    <td key={w.id} className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {product.stock ? (product.stock[w.id] || 0) : 0}
                    </td>
                  ))}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold text-center">
                    {product.total || 0}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center space-x-2 space-x-reverse">
                      <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900">ویرایش</button>
                      <button onClick={() => handleDeleteClick(product)} className="text-red-600 hover:text-red-900">حذف</button>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={isAdmin ? warehouses.length + 3 : warehouses.length + 2} className="text-center py-6 text-gray-500">
                    هیچ کالایی با این مشخصات یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
};
