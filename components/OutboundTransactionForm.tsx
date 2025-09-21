import React, { useState, useEffect } from 'react';
import { useInventoryContext } from '../context/InventoryContext';
import type { Transaction } from '../types';
import { TransactionType } from '../types';
import { Card } from './Card';
import { ProductSearchModal } from './ProductSearchModal';

export const OutboundTransactionForm: React.FC = () => {
  const { addTransaction, products, warehouses, users, currentUser } = useInventoryContext();
  
  const isAdmin = currentUser?.id === 'admin';
  const availableUsers = users.filter(u => !u.isDeleted);

  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [productId, setProductId] = useState(products.find(p => !p.isDeleted)?.id || '');
  const [userId, setUserId] = useState(isAdmin ? availableUsers[0]?.id : currentUser?.id || '');
  const [quantity, setQuantity] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setUserId(currentUser?.id || '');
    }
  }, [currentUser, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numQuantity = parseInt(quantity, 10);

    if (!warehouseId || !productId || !quantity || !userId || !password || !description.trim()) {
      setError('لطفا تمام فیلدها را پر کنید.');
      return;
    }
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('تعداد باید یک عدد مثبت باشد.');
      return;
    }

    try {
      const newTransaction: Omit<Transaction, 'id' | 'timestamp'> = {
        warehouseId,
        productId,
        userId,
        type: TransactionType.OUT,
        quantity: numQuantity,
        description: description.trim(),
      };
      await addTransaction(newTransaction, password);
      setSuccess('تراکنش خروجی با موفقیت ثبت شد.');
      setQuantity('');
      setPassword('');
      setDescription('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'خطایی در ثبت تراکنش رخ داد.');
    }
  };
    
  const availableProducts = products.filter(p => !p.isDeleted);

  useEffect(() => {
    if (!productId || !availableProducts.some(p => p.id === productId)) {
      setProductId(availableProducts[0]?.id || '');
    }
  }, [products, productId, availableProducts]);

  useEffect(() => {
    if (isAdmin && (!userId || !availableUsers.some(u => u.id === userId))) {
        setUserId(availableUsers[0]?.id || '');
    }
  }, [users, userId, availableUsers, isAdmin]);

  const handleProductSelect = (selectedProductId: string) => {
    setProductId(selectedProductId);
  };
  
  const passwordLabel = isAdmin ? 'رمز عبور مدیر' : 'رمز عبور شما';

  return (
    <>
      <ProductSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectProduct={handleProductSelect}
        products={availableProducts}
      />
      <Card title="ثبت خروجی کالا">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="out-user" className="block text-sm font-medium text-gray-700">کاربر</label>
             {isAdmin ? (
              <select
                id="out-user"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            ) : (
              <p className="mt-1 block w-full py-2 px-3 bg-slate-100 rounded-md text-sm text-gray-600">{currentUser?.name}</p>
            )}
          </div>
          <div>
            <label htmlFor="out-password" className="block text-sm font-medium text-gray-700">{passwordLabel}</label>
            <input
              type="password"
              id="out-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={`برای تایید، ${passwordLabel} را وارد کنید`}
            />
          </div>
          <div>
            <label htmlFor="out-warehouse" className="block text-sm font-medium text-gray-700">انبار</label>
            <select
              id="out-warehouse"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="out-product" className="block text-sm font-medium text-gray-700">کالا</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <select
                id="out-product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-r-md rounded-l-none"
              >
                {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
               <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="relative -mr-px inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-l-md rounded-r-none text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <span>جستجو</span>
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="out-quantity" className="block text-sm font-medium text-gray-700">تعداد</label>
            <input
              type="number"
              id="out-quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              min="1"
            />
          </div>
           <div>
            <label htmlFor="out-description" className="block text-sm font-medium text-gray-700">توضیحات</label>
            <textarea
              id="out-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={2}
              placeholder="مثال: فروش به مشتری X"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <button
            type="submit"
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            ثبت خروجی
          </button>
        </form>
      </Card>
    </>
  );
};