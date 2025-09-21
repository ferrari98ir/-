import React, { useState, useMemo } from 'react';
import { useInventoryContext } from '../context/InventoryContext';
import { Card } from './Card';
import { TransactionType, type Transaction } from '../types';
import { DeleteTransactionModal } from './DeleteTransactionModal';

export const TransactionHistory: React.FC = () => {
  const { transactions, products, warehouses, users, deleteTransaction, currentUser } = useInventoryContext();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const isAdmin = currentUser?.id === 'admin';

  const productMap = useMemo(() => 
    products.reduce((acc, p) => {
      acc[p.id] = p.name;
      return acc;
    }, {} as { [key: string]: string }), 
  [products]);

  const warehouseMap = useMemo(() => 
    warehouses.reduce((acc, w) => {
      acc[w.id] = w.name;
      return acc;
    }, {} as { [key: string]: string }), 
  [warehouses]);

  const userMap = useMemo(() =>
    users.reduce((acc, u) => {
        acc[u.id] = u.name;
        return acc;
    }, {} as { [key: string]: string }),
  [users]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        if (selectedProduct && tx.productId !== selectedProduct) {
          return false;
        }
        if (startDate) {
          const txDate = new Date(tx.timestamp);
          const filterDate = new Date(startDate);
          filterDate.setHours(0, 0, 0, 0); // Start of the day
          if (txDate < filterDate) return false;
        }
        if (endDate) {
          const txDate = new Date(tx.timestamp);
          const filterDate = new Date(endDate);
          filterDate.setHours(23, 59, 59, 999); // End of the day
          if (txDate > filterDate) return false;
        }
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, selectedProduct, startDate, endDate]);

  const handleClearFilters = () => {
    setSelectedProduct('');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('هیچ تراکنشی برای خروجی گرفتن وجود ندارد.');
      return;
    }

    const header = ['کالا', 'انبار', 'کاربر', 'نوع', 'تعداد', 'تاریخ', 'توضیحات'];
    const rows = filteredTransactions.map(tx => {
      const productName = productMap[tx.productId] || 'کالای حذف شده';
      const warehouseName = tx.type === TransactionType.DELETE ? '-' : warehouseMap[tx.warehouseId] || 'N/A';
      const userName = userMap[tx.userId] || (tx.userId === 'admin' ? 'مدیر کل' : 'ناشناس');
      const type = tx.type === TransactionType.IN ? 'ورودی' : tx.type === TransactionType.OUT ? 'خروجی' : 'حذف کالا';
      const quantity = tx.type === TransactionType.DELETE ? '-' : tx.quantity.toString();
      const date = new Date(tx.timestamp).toLocaleString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      const description = tx.description || '';

      return [
        `"${productName.replace(/"/g, '""')}"`,
        `"${warehouseName.replace(/"/g, '""')}"`,
        `"${userName.replace(/"/g, '""')}"`,
        `"${type}"`,
        `"${quantity}"`,
        `"${date}"`,
        `"${description.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'transaction-history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenDeleteModal = (tx: Transaction) => {
    setTransactionToDelete(tx);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = (transactionId: string, adminPassword: string) => {
    try {
      deleteTransaction(transactionId, adminPassword);
    } catch (err) {
      throw err; // Re-throw for the modal to display the error message
    }
  };


  return (
    <>
      <DeleteTransactionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        transaction={transactionToDelete}
        transactionDetails={transactionToDelete ? {
          productName: productMap[transactionToDelete.productId] || 'کالای حذف شده',
          userName: userMap[transactionToDelete.userId] || 'ناشناس',
          description: transactionToDelete.description,
        } : null}
      />
      <Card title="تاریخچه تراکنش‌ها">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
          {/* Product Filter */}
          <div>
            <label htmlFor="product-filter" className="block text-sm font-medium text-gray-700">کالا</label>
            <select
              id="product-filter"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">همه کالاها</option>
              {products.filter(p => !p.isDeleted).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {/* Start Date Filter */}
          <div>
            <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700">از تاریخ</label>
            <input
              type="date"
              id="start-date-filter"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          {/* End Date Filter */}
          <div>
            <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700">تا تاریخ</label>
            <input
              type="date"
              id="end-date-filter"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          {/* Action Buttons */}
          <div className="self-end space-y-2 sm:space-y-0 sm:flex sm:space-x-2 sm:space-x-reverse">
              <button
                  onClick={handleExportCSV}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  خروجی CSV
                </button>
              <button
                  onClick={handleClearFilters}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                  پاک کردن فیلترها
              </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">کالا</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">انبار</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">کاربر</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">نوع</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">تعداد</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">توضیحات</th>
                {isAdmin && <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{productMap[tx.productId]}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{tx.type === TransactionType.DELETE ? '-' : warehouseMap[tx.warehouseId]}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{userMap[tx.userId] || (tx.userId === 'admin' ? 'مدیر کل' : 'ناشناس')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tx.type === TransactionType.IN 
                          ? 'bg-green-100 text-green-800' 
                          : tx.type === TransactionType.OUT
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tx.type === TransactionType.IN ? 'ورودی' : tx.type === TransactionType.OUT ? 'خروجی' : 'حذف کالا'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{tx.type === TransactionType.DELETE ? '-' : tx.quantity}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500" dir="ltr">
                      {new Date(tx.timestamp).toLocaleString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={tx.description}>{tx.description}</td>
                    {isAdmin && (
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => handleOpenDeleteModal(tx)}
                          className="text-red-600 hover:text-red-900 text-xs"
                          aria-label={`حذف تراکنش ${tx.id}`}
                        >
                          حذف
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-gray-500">
                    هیچ تراکنشی با فیلترهای مشخص شده یافت نشد.
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