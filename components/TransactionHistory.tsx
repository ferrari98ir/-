import React, { useState, useMemo, useEffect } from 'react';
import { useInventoryContext } from '../context/InventoryContext';
import { Card } from './Card';
import { TransactionType, type Transaction } from '../types';
import { DeleteTransactionModal } from './DeleteTransactionModal';
import { useToast } from '../context/ToastContext';

const ITEMS_PER_PAGE = 10;

export const TransactionHistory: React.FC = () => {
  const { transactions, products, warehouses, users, deleteTransaction, currentUser } = useInventoryContext();
  const { addToast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
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
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    return transactions
      .filter(tx => {
        const product = products.find(p => p.id === tx.productId);
        if (product?.isDeleted && tx.type !== TransactionType.DELETE) {
          return false;
        }

        if (selectedProduct && tx.productId !== selectedProduct) {
          return false;
        }
        if (selectedDate) {
          const txDate = new Date(tx.timestamp);
          const filterDateStart = new Date(selectedDate);
          filterDateStart.setHours(0, 0, 0, 0); // Start of the day
          const filterDateEnd = new Date(selectedDate);
          filterDateEnd.setHours(23, 59, 59, 999); // End of the day
          if (txDate < filterDateStart || txDate > filterDateEnd) return false;
        }

        if (lowerCaseSearch) {
          const productName = (productMap[tx.productId] || '').toLowerCase();
          const userName = (userMap[tx.userId] || (tx.userId === 'admin' ? 'مدیر کل' : '')).toLowerCase();
          const description = (tx.description || '').toLowerCase();
          
          if (
            !productName.includes(lowerCaseSearch) &&
            !userName.includes(lowerCaseSearch) &&
            !description.includes(lowerCaseSearch)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, selectedProduct, selectedDate, searchTerm, products, productMap, userMap]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProduct, selectedDate, searchTerm]);

  const pageCount = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage]);

  const handleClearFilters = () => {
    setSelectedProduct('');
    setSelectedDate('');
    setSearchTerm('');
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      addToast('هیچ تراکنشی برای خروجی گرفتن وجود ندارد.', 'error');
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
    // The modal will await this promise and handle toasts.
    return deleteTransaction(transactionId, adminPassword);
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
          userName: userMap[transactionToDelete.userId] || (transactionToDelete.userId === 'admin' ? 'مدیر کل' : 'ناشناس'),
          description: transactionToDelete.description,
        } : null}
      />
      <Card title="تاریخچه تراکنش‌ها">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
          {/* Product Filter */}
          <div className="md:col-span-1">
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
          {/* Date Filter */}
          <div className="md:col-span-1">
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">تاریخ</label>
            <input
              type="date"
              id="date-filter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          {/* Search Filter */}
          <div className="sm:col-span-2 md:col-span-2">
            <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700">جستجو</label>
            <input
              type="text"
              id="search-filter"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="جستجو در کالا، کاربر یا توضیحات..."
            />
          </div>
          {/* Action Buttons */}
          <div className="sm:col-span-2 md:col-span-4 self-end flex justify-end space-x-2 space-x-reverse">
              <button
                  onClick={handleExportCSV}
                  className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  خروجی CSV
                </button>
              <button
                  onClick={handleClearFilters}
                  className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{productMap[tx.productId] || 'کالای حذف شده'}</td>
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

        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-b-lg">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                قبلی
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                بعدی
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                {filteredTransactions.length > 0 &&
                  <p className="text-sm text-gray-700">
                    نمایش <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> تا <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)}</span> از <span className="font-medium">{filteredTransactions.length}</span> تراکنش
                  </p>
                }
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNumber => (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      aria-current={pageNumber === currentPage ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNumber === currentPage
                          ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                    disabled={currentPage === pageCount}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                       <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-1.06.02L7.47 9.5a.75.75 0 010 1.08l4.25 4.25a.75.75 0 11-1.06-1.06L9.19 10l3.6-3.79a.75.75 0 011.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>
    </>
  );
};