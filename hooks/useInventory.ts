import { useState, useCallback, useMemo } from 'react';
import type { Transaction, Product, User, InventoryData } from '../types';
import { TransactionType } from '../types';
import { WAREHOUSES, ADMIN_PASSWORD } from '../constants';

type CurrentUser = User | { id: 'admin'; name: 'مدیر کل' };

// --- MOCK DATA ---
const MOCK_USERS: User[] = [
  { id: 'u-1', name: 'علی رضایی', password: '123', isDeleted: false },
  { id: 'u-2', name: 'سارا محمدی', password: '456', isDeleted: false },
  { id: 'u-3', name: 'کاربر غیرفعال', password: '789', isDeleted: true },
].sort((a, b) => a.name.localeCompare(b.name));

const MOCK_PRODUCTS: Product[] = [
  { id: 'p-1', name: 'لپتاپ مدل A', isDeleted: false },
  { id: 'p-2', name: 'موس بی‌سیم', isDeleted: false },
  { id: 'p-3', name: 'کیبورد مکانیکی', isDeleted: false },
  { id: 'p-4', name: 'مانیتور گیمینگ', isDeleted: false },
].sort((a, b) => a.name.localeCompare(b.name));

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', productId: 'p-1', warehouseId: 'w1', userId: 'u-1', type: TransactionType.IN, quantity: 10, timestamp: Date.now() - 200000, description: 'ورود اولیه' },
  { id: 'tx-2', productId: 'p-2', warehouseId: 'w1', userId: 'u-2', type: TransactionType.IN, quantity: 50, timestamp: Date.now() - 180000, description: 'خرید جدید' },
  { id: 'tx-3', productId: 'p-1', warehouseId: 'w2', userId: 'u-1', type: TransactionType.IN, quantity: 5, timestamp: Date.now() - 150000, description: 'انتقال از تامین کننده' },
  { id: 'tx-4', productId: 'p-2', warehouseId: 'w1', userId: 'u-2', type: TransactionType.OUT, quantity: 10, timestamp: Date.now() - 100000, description: 'فروش به مشتری' },
  { id: 'tx-5', productId: 'p-3', warehouseId: 'w2', userId: 'u-1', type: TransactionType.IN, quantity: 20, timestamp: Date.now() - 50000, description: 'موجودی اولیه' },
].sort((a, b) => b.timestamp - a.timestamp);


export const useInventory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // No more loading or errors from a database
  const loading = false;
  const dbError = null;

  const inventoryData = useMemo<InventoryData>(() => {
    const inventory: InventoryData = {};
    products.forEach(product => {
        if (!product.isDeleted) {
            inventory[product.id] = { productName: product.name, total: 0, stock: {} };
            WAREHOUSES.forEach(warehouse => {
                inventory[product.id].stock[warehouse.id] = 0;
            });
        }
    });
    transactions.forEach(tx => {
      if (tx.type !== TransactionType.IN && tx.type !== TransactionType.OUT) return;
      if (!inventory[tx.productId]) return;

      const currentQuantity = inventory[tx.productId].stock[tx.warehouseId] || 0;
      const currentTotal = inventory[tx.productId].total || 0;
      if (tx.type === TransactionType.IN) {
        inventory[tx.productId].stock[tx.warehouseId] = currentQuantity + tx.quantity;
        inventory[tx.productId].total = currentTotal + tx.quantity;
      } else {
        inventory[tx.productId].stock[tx.warehouseId] = currentQuantity - tx.quantity;
        inventory[tx.productId].total = currentTotal - tx.quantity;
      }
    });
    return inventory;
  }, [transactions, products]);

  const login = useCallback(async (credentials: { userId?: string; password?: string; adminPassword?: string }) => {
    if (credentials.adminPassword) {
      if (credentials.adminPassword === ADMIN_PASSWORD) {
        setCurrentUser({ id: 'admin', name: 'مدیر کل' });
      } else {
        throw new Error('رمز عبور مدیر صحیح نیست.');
      }
    } else if (credentials.userId && credentials.password) {
      const user = users.find(u => u.id === credentials.userId && !u.isDeleted);
      if (user && user.password === credentials.password) {
        setCurrentUser(user);
      } else {
        throw new Error('نام کاربری یا رمز عبور صحیح نیست.');
      }
    } else {
      throw new Error('اطلاعات ورود نامعتبر است.');
    }
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const addTransaction = useCallback(async (newTransaction: Omit<Transaction, 'id' | 'timestamp'>, authorizerPassword: string) => {
    const { userId, productId, warehouseId, type, quantity } = newTransaction;
    if (!currentUser) throw new Error('برای ثبت تراکنش باید وارد شوید.');
    
    if (currentUser.id === 'admin') {
      if (authorizerPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر برای ثبت تراکنش صحیح نیست.');
    } else {
      if (currentUser.id !== userId) throw new Error('شما مجاز به ثبت تراکنش برای کاربر دیگری نیستید.');
      const user = users.find(u => u.id === userId);
      if (!user || user.password !== authorizerPassword) throw new Error('رمز عبور شما صحیح نیست.');
    }
    
    if (type === TransactionType.OUT) {
      const currentStock = inventoryData[productId]?.stock?.[warehouseId] ?? 0;
      if (currentStock < quantity) throw new Error('موجودی انبار کافی نیست.');
    }
    
    const transactionForState: Transaction = { 
        ...newTransaction, 
        id: `tx-${Date.now()}`,
        timestamp: Date.now() 
    };
    
    setTransactions(prev => [transactionForState, ...prev].sort((a, b) => b.timestamp - a.timestamp));
  }, [inventoryData, users, currentUser]);

  const addUser = useCallback(async (name: string, password: string, adminPassword: string) => {
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    if (!name.trim()) throw new Error('نام کاربر نمی‌تواند خالی باشد.');
    if (!password.trim()) throw new Error('رمز عبور نمی‌تواند خالی باشد.');
    const newUser: User = { 
        id: `u-${Date.now()}`,
        name: name.trim(), 
        password, 
        isDeleted: false 
    };
    
    setUsers(prev => [...prev, newUser].sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const updateUser = useCallback(async (userId: string, updates: { name?: string; password?: string }, adminPassword: string) => {
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    const updateData: { name?: string; password?: string } = {};
    if (updates.name?.trim()) updateData.name = updates.name.trim();
    if (updates.password) updateData.password = updates.password;

    if (Object.keys(updateData).length > 0) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updateData } : u));
    }
  }, []);

  const deleteUser = useCallback(async (userId: string, adminPassword: string) => {
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    const activeUsers = users.filter(u => !u.isDeleted);
    if (activeUsers.length <= 1) throw new Error('حداقل یک کاربر فعال باید در سیستم وجود داشته باشد.');
    
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isDeleted: true } : u));
  }, [users]);

  const addProduct = useCallback(async (name: string) => {
    if (!currentUser || currentUser.id !== 'admin') throw new Error('فقط مدیر مجاز به افزودن کالا است.');
    if (!name.trim()) throw new Error('نام کالا نمی‌تواند خالی باشد.');
    if (products.some(p => !p.isDeleted && p.name.toLowerCase() === name.toLowerCase().trim())) {
      throw new Error('کالایی با این نام از قبل وجود دارد.');
    }
    const newProduct: Product = { 
        id: `p-${Date.now()}`,
        name: name.trim(), 
        isDeleted: false 
    };
    
    setProducts(prev => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
  }, [products, currentUser]);

  const updateProduct = useCallback(async (id: string, name: string) => {
    if (!currentUser || currentUser.id !== 'admin') throw new Error('فقط مدیر مجاز به ویرایش کالا است.');
    if (!name.trim()) throw new Error('نام کالا نمی‌تواند خالی باشد.');
    
    setProducts(prev => prev.map(p => p.id === id ? { ...p, name: name.trim() } : p));
  }, [currentUser]);

  const deleteProduct = useCallback(async (id: string, adminPassword: string) => {
    if (!currentUser || currentUser.id !== 'admin') throw new Error('فقط مدیر مجاز به حذف کالا است.');
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    
    const timestamp = Date.now();
    const newTransactions: Transaction[] = [];
    const productInventory = inventoryData[id];

    if (productInventory && productInventory.total > 0) {
      WAREHOUSES.forEach(warehouse => {
        const stock = productInventory.stock[warehouse.id] || 0;
        if (stock > 0) {
          newTransactions.push({
            id: `tx-del-out-${id}-${warehouse.id}-${timestamp}`,
            productId: id,
            warehouseId: warehouse.id,
            userId: currentUser.id,
            type: TransactionType.OUT,
            quantity: stock,
            timestamp: timestamp,
            description: 'حذف کالا و صفر کردن موجودی',
          });
        }
      });
    }

    newTransactions.push({
      id: `tx-del-${id}-${timestamp}`,
      productId: id,
      userId: currentUser.id,
      type: TransactionType.DELETE,
      quantity: 0,
      warehouseId: WAREHOUSES[0]?.id || 'w1',
      timestamp: timestamp + 1,
      description: 'ثبت حذف کالا در سیستم',
    });
    
    setTransactions(prev => [...newTransactions, ...prev].sort((a, b) => b.timestamp - a.timestamp));
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isDeleted: true } : p));
  }, [inventoryData, currentUser]);

  const deleteTransaction = useCallback(async (transactionId: string, adminPassword: string) => {
    if (!currentUser || currentUser.id !== 'admin') throw new Error('فقط مدیر مجاز به حذف تراکنش است.');
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    
    setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
  }, [currentUser]);

  const warehouseTotals = useMemo(() => {
    const totals: { [key: string]: { name: string, total: number } } = {};
    WAREHOUSES.forEach(w => {
      totals[w.id] = { name: w.name, total: 0 };
    });
    Object.values(inventoryData).forEach(productData => {
      WAREHOUSES.forEach(w => {
        totals[w.id].total += productData.stock[w.id] || 0;
      });
    });
    return Object.values(totals);
  }, [inventoryData]);

  const totalInventoryCount = useMemo(() => {
    return warehouseTotals.reduce((sum, w) => sum + w.total, 0);
  }, [warehouseTotals]);

  return {
    transactions, addTransaction, inventoryData, products, warehouses: WAREHOUSES, users, addUser, updateUser,
    deleteUser, addProduct, updateProduct, deleteProduct, deleteTransaction, warehouseTotals,
    totalInventoryCount, currentUser, login, logout, loading, dbError,
  };
};