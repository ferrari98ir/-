import React, { useState, useMemo } from 'react';
import { useInventoryContext } from '../context/InventoryContext';
import type { Transaction } from '../types';
import { TransactionType } from '../types';
import { Card } from './Card';
import { ProductSearchModal } from './ProductSearchModal';
import { useToast } from '../context/ToastContext';

export const InboundTransactionForm: React.FC = () => {
  const { addTransaction, products, warehouses, users, currentUser, inventoryData } = useInventoryContext();
  const { addToast } = useToast();
  
  const isAdmin = currentUser?.id === 'admin';
  const availableUsers = useMemo(() => users.filter(u => !u.isDeleted), [users]);
  const availableProducts = useMemo(() => products.filter(p => !p.isDeleted), [products]);

  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(''); // Only for admin
  const [quantity, setQuantity] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Derive active product ID. This prevents re-render loops from useEffect.
  const activeProductId = useMemo(() => {
    if (selectedProductId && availableProducts.some(p => p.id === selectedProductId)) {
      return selectedProductId;
    }
    return availableProducts[0]?.id || '';
  }, [selectedProductId, availableProducts]);

  // Derive active user ID. This prevents re-render loops from useEffect.
  const activeUserId = useMemo(() => {
    if (!isAdmin) return currentUser?.id || '';
    if (selectedUserId && availableUsers.some(u => u.id === selectedUserId)) {
      return selectedUserId;
    }
    return availableUsers[0]?.id || '';
  }, [selectedUserId, availableUsers, isAdmin, currentUser]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const numQuantity = parseInt(quantity, 10);

    if (!warehouseId || !activeProductId || !quantity || !activeUserId || !password || !description.trim()) {
      addToast('لطفا تمام فیلدها را پر کنید.', 'error');
      setIsLoading(false);
      return;
    }
    if (isNaN(numQuantity) || numQuantity <= 0) {
      addToast('تعداد باید یک عدد مثبت باشد.', 'error');
      setIsLoading(false);
      return;
    }

    try {
      const newTransaction: Omit<Transaction, 'id' | 'timestamp'> = {
        warehouseId,
        productId: activeProductId,
        userId: activeUserId,
        type: TransactionType.IN,
        quantity: numQuantity,
        description: description.trim(),
      };
      await addTransaction(newTransaction, password);
      addToast('تراکنش ورودی با موفقیت ثبت شد.', 'success');
      setQuantity('');
      setPassword('');
      setDescription('');
    } catch (err: any) {
      addToast(err.message || 'خطایی در ثبت تراکنش رخ داد.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
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
      <Card title="ثبت ورودی کالا">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="in-user" className="block text-sm font-medium text-gray-700">کاربر</label>
            {isAdmin ? (
              <select
                id="in-user"
                value={activeUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            ) : (
              <p className="mt-1 block w-full py-2 px-3 bg-slate-100 rounded-md text-sm text-gray-600">{currentUser?.name}</p>
            )}
          </div>
          <div>
            <label htmlFor="in-password" className="block text-sm font-medium text-gray-700">{passwordLabel}</label>
            <input
              type="password"
              id="in-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={`برای تایید، ${passwordLabel} را وارد کنید`}
            />
          </div>
          <div>
            <label htmlFor="in-warehouse" className="block text-sm font-medium text-gray-700">انبار</label>
            <select
              id="in-warehouse"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="in-product" className="block text-sm font-medium text-gray-700">کالا</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <select
                id="in-product"
                value={activeProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-r-md rounded-l-none"
              >
                {availableProducts.map(p => {
                  const stock = inventoryData[p.id]?.total ?? 0;
                  return <option key={p.id} value={p.id}>{p.name} (موجودی: {stock})</option>;
                })}
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
            <label htmlFor="in-quantity" className="block text-sm font-medium text-gray-700">تعداد</label>
            <input
              type="number"
              id="in-quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              min="1"
            />
          </div>
          <div>
            <label htmlFor="in-description" className="block text-sm font-medium text-gray-700">توضیحات</label>
            <textarea
              id="in-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={2}
              placeholder="مثال: خرید طبق فاکتور ۱۲۳"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400"
          >
            {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : 'ثبت ورودی'}
          </button>
        </form>
      </Card>
    </>
  );
};