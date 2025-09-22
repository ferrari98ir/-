import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Transaction, Product, User, InventoryData } from '../types';
import { TransactionType } from '../types';
import { WAREHOUSES, ADMIN_PASSWORD } from '../constants';

type CurrentUser = User | { id: 'admin'; name: 'مدیر کل' };

// --- MOCK DATA ---
const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'لپتاپ مدل X' },
  { id: 'p2', name: 'مانیتور ۲۴ اینچ' },
  { id: 'p3', name: 'کیبورد مکانیکی' },
  { id: 'p4', name: 'ماوس بی‌سیم', isDeleted: true },
];

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'علی رضایی', password: '123' },
  { id: 'u2', name: 'مریم احمدی', password: '456' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', productId: 'p1', warehouseId: 'w1', userId: 'u1', type: TransactionType.IN, quantity: 10, timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, description: 'خرید اولیه' },
  { id: 't2', productId: 'p2', warehouseId: 'w1', userId: 'u1', type: TransactionType.IN, quantity: 20, timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, description: 'خرید اولیه' },
  { id: 't3', productId: 'p3', warehouseId: 'w2', userId: 'u2', type: TransactionType.IN, quantity: 15, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, description: 'انتقال از انبار دیگر' },
  { id: 't4', productId: 'p1', warehouseId: 'w1', userId: 'u2', type: TransactionType.OUT, quantity: 2, timestamp: Date.now() - 12 * 60 * 60 * 1000, description: 'فروش به مشتری' },
  { id: 't5', productId: 'p4', warehouseId: 'w1', userId: 'admin', type: TransactionType.DELETE, quantity: 0, timestamp: Date.now() - 10 * 60 * 60 * 1000, description: 'حذف کالا به دلیل توقف تولید' },
];


// --- HOOK IMPLEMENTATION ---
export const useInventory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Effect to load mock data
  useEffect(() => {
    setLoading(true);
    // Simulate loading from a local source
    setTimeout(() => {
        setProducts(MOCK_PRODUCTS);
        setUsers(MOCK_USERS);
        setTransactions(MOCK_TRANSACTIONS);
        setLoading(false);
    }, 500); // 500ms delay to show loading indicator
  }, []);

  const inventoryData = useMemo<InventoryData>(() => {
    const data: InventoryData = {};
    products.forEach(p => {
      if (!p.isDeleted) {
        data[p.id] = { 
          productName: p.name, 
          stock: {},
          total: 0
        };
      }
    });

    transactions.forEach(t => {
      const productData = data[t.productId];
      if (productData) {
        if (t.type === TransactionType.IN) {
          productData.stock[t.warehouseId] = (productData.stock[t.warehouseId] || 0) + t.quantity;
          productData.total += t.quantity;
        } else if (t.type === TransactionType.OUT) {
          productData.stock[t.warehouseId] = (productData.stock[t.warehouseId] || 0) - t.quantity;
          productData.total -= t.quantity;
        }
      }
    });
    return data;
  }, [transactions, products]);

  const totalInventoryCount = useMemo(() => 
    Object.values(inventoryData).reduce((sum, data) => sum + data.total, 0), 
  [inventoryData]);

  const warehouseTotals = useMemo(() => WAREHOUSES.map(warehouse => {
    const total = Object.values(inventoryData).reduce((sum, productData) => {
      return sum + (productData.stock[warehouse.id] || 0);
    }, 0);
    return { ...warehouse, total };
  }), [inventoryData]);

  const login = useCallback(async (credentials: { userId?: string; password?: string; adminPassword?: string }) => {
    if (credentials.adminPassword) {
      if (credentials.adminPassword === ADMIN_PASSWORD) {
        setCurrentUser({ id: 'admin', name: 'مدیر کل' });
        return;
      }
      throw new Error('رمز عبور مدیر اشتباه است.');
    }

    if (credentials.userId && credentials.password) {
      const user = users.find(u => u.id === credentials.userId && !u.isDeleted);
      if (user && user.password === credentials.password) {
        setCurrentUser(user);
        return;
      }
      throw new Error('نام کاربری یا رمز عبور اشتباه است.');
    }
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);
  
  const validatePassword = useCallback((password: string): boolean => {
      const isAdmin = currentUser?.id === 'admin';
      if (isAdmin) {
          return password === ADMIN_PASSWORD;
      }
      const user = users.find(u => u.id === currentUser?.id);
      return !!user && user.password === password;
  }, [currentUser, users]);

  const addTransaction = useCallback(async (newTransactionData: Omit<Transaction, 'id' | 'timestamp'>, password: string) => {
    if (!currentUser) throw new Error('برای ثبت تراکنش باید وارد شوید.');
    if (!validatePassword(password)) throw new Error('رمز عبور وارد شده صحیح نیست.');
    
    if (newTransactionData.type === TransactionType.OUT) {
        const currentStock = inventoryData[newTransactionData.productId]?.stock[newTransactionData.warehouseId] || 0;
        if (newTransactionData.quantity > currentStock) {
            throw new Error(`موجودی کالا در انبار کافی نیست. (موجودی: ${currentStock})`);
        }
    }

    const newTransaction: Transaction = {
        ...newTransactionData,
        id: `tx_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
  }, [currentUser, inventoryData, validatePassword]);
  
  const deleteTransaction = useCallback(async (transactionId: string, adminPassword: string) => {
    if (currentUser?.id !== 'admin' || adminPassword !== ADMIN_PASSWORD) {
      throw new Error('فقط مدیر کل می‌تواند تراکنش‌ها را حذف کند و رمز عبور مدیر الزامی است.');
    }

    const txToDelete = transactions.find(tx => tx.id === transactionId);
    if (!txToDelete) throw new Error('تراکنش مورد نظر یافت نشد.');
    
    // Create a reversal transaction
    const reversalType = txToDelete.type === TransactionType.IN ? TransactionType.OUT : TransactionType.IN;
    
    // Deleting a DELETE transaction is not supported in this local model
    if (txToDelete.type === TransactionType.DELETE) {
        throw new Error('حذف تراکنش‌های "حذف کالا" پشتیبانی نمی‌شود.');
    }

    const reversalTransaction: Transaction = {
      ...txToDelete,
      id: `rev_${Date.now()}`,
      type: reversalType,
      timestamp: Date.now(),
      description: `حذف تراکنش "${txToDelete.description}"`,
      userId: 'admin',
    };
    
    setTransactions(prev => [reversalTransaction, ...prev]);
  }, [currentUser, transactions]);

  const addProduct = useCallback(async (name: string) => {
    if (currentUser?.id !== 'admin') throw new Error('فقط مدیر کل می‌تواند کالا اضافه کند.');
    if (products.some(p => p.name === name.trim() && !p.isDeleted)) {
        throw new Error('کالایی با این نام از قبل وجود دارد.');
    }
    const newProduct: Product = {
        id: `p_${Date.now()}_${Math.random()}`,
        name: name.trim(),
    };
    setProducts(prev => [...prev, newProduct]);
  }, [currentUser, products]);

  const updateProduct = useCallback(async (id: string, name: string) => {
    if (currentUser?.id !== 'admin') throw new Error('فقط مدیر کل می‌تواند کالا را ویرایش کند.');
    if (products.some(p => p.name === name.trim() && p.id !== id && !p.isDeleted)) {
        throw new Error('کالای دیگری با این نام از قبل وجود دارد.');
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, name: name.trim() } : p));
  }, [currentUser, products]);

  const deleteProduct = useCallback(async (productId: string, adminPassword: string) => {
    if (currentUser?.id !== 'admin' || adminPassword !== ADMIN_PASSWORD) {
      throw new Error('فقط مدیر کل می‌تواند کالا را حذف کند و رمز عبور مدیر الزامی است.');
    }

    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) throw new Error('کالا یافت نشد.');
    if (productToDelete.isDeleted) throw new Error('این کالا قبلا حذف شده است.');

    const currentStock = inventoryData[productId]?.total || 0;
    
    // Mark product as deleted
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isDeleted: true } : p));

    // Create a "DELETE" transaction to log the action
    const deleteTransaction: Transaction = {
      id: `del_${Date.now()}`,
      productId,
      warehouseId: '', // Not applicable
      userId: 'admin',
      type: TransactionType.DELETE,
      quantity: currentStock, // Log the stock at time of deletion
      timestamp: Date.now(),
      description: `حذف کالا: ${productToDelete.name} با موجودی ${currentStock}`,
    };
    setTransactions(prev => [deleteTransaction, ...prev]);
  }, [currentUser, products, inventoryData]);

  const addUser = useCallback(async (name: string, password: string, adminPassword: string) => {
    if (currentUser?.id !== 'admin' || adminPassword !== ADMIN_PASSWORD) {
        throw new Error('فقط مدیر کل می‌تواند کاربر اضافه کند و رمز عبور مدیر الزامی است.');
    }
    if (users.some(u => u.name === name.trim() && !u.isDeleted)) {
        throw new Error('کاربری با این نام از قبل وجود دارد.');
    }

    const newUser: User = {
        id: `u_${Date.now()}_${Math.random()}`,
        name: name.trim(),
        password: password,
    };
    setUsers(prev => [...prev, newUser]);
  }, [currentUser, users]);

  const updateUser = useCallback(async (userId: string, updates: { name?: string; password?: string }, adminPassword: string) => {
    if (currentUser?.id !== 'admin' || adminPassword !== ADMIN_PASSWORD) {
      throw new Error('فقط مدیر کل می‌تواند کاربر را ویرایش کند و رمز عبور مدیر الزامی است.');
    }
    
    if (updates.name && users.some(u => u.name === updates.name.trim() && u.id !== userId && !u.isDeleted)) {
       throw new Error('کاربر دیگری با این نام از قبل وجود دارد.');
    }
    
    setUsers(prev => prev.map(u => {
        if (u.id === userId) {
            return {
                ...u,
                name: updates.name?.trim() || u.name,
                password: updates.password || u.password,
            };
        }
        return u;
    }));
  }, [currentUser, users]);

  const deleteUser = useCallback(async (userId: string, adminPassword: string) => {
    if (currentUser?.id !== 'admin' || adminPassword !== ADMIN_PASSWORD) {
      throw new Error('فقط مدیر کل می‌تواند کاربر را حذف کند و رمز عبور مدیر الزامی است.');
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isDeleted: true } : u));
  }, [currentUser]);

  return {
    transactions,
    products,
    users,
    warehouses: WAREHOUSES,
    currentUser,
    inventoryData,
    totalInventoryCount,
    warehouseTotals,
    loading,
    login,
    logout,
    addTransaction,
    deleteTransaction,
    addProduct,
    updateProduct,
    deleteProduct,
    addUser,
    updateUser,
    deleteUser,
  };
};