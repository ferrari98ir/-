import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Transaction, Product, User, InventoryData } from '../types';
import { TransactionType } from '../types';
import { INITIAL_PRODUCTS, WAREHOUSES, USERS, ADMIN_PASSWORD } from '../constants';

const initialTransactions: Omit<Transaction, 'id'>[] = [
    { productId: 'p1', warehouseId: 'w1', userId: 'u1', type: TransactionType.IN, quantity: 20, timestamp: Date.now() - 50000, description: 'خرید اولیه' },
    { productId: 'p2', warehouseId: 'w1', userId: 'u2', type: TransactionType.IN, quantity: 100, timestamp: Date.now() - 40000, description: 'تامین موجودی' },
    { productId: 'p3', warehouseId: 'w2', userId: 'u1', type: TransactionType.IN, quantity: 50, timestamp: Date.now() - 30000, description: 'انتقال از انبار دیگر' },
    { productId: 'p1', warehouseId: 'w1', userId: 'u2', type: TransactionType.OUT, quantity: 5, timestamp: Date.now() - 20000, description: 'فروش به مشتری' },
    { productId: 'p4', warehouseId: 'w2', userId: 'u1', type: TransactionType.IN, quantity: 30, timestamp: Date.now() - 10000, description: 'خرید جدید' },
];

type CurrentUser = User | { id: 'admin'; name: 'مدیر کل' };

export const useInventory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    initialTransactions.map((tx, i) => ({ ...tx, id: `tx-init-${i}`}))
  );
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [users, setUsers] = useState<User[]>(USERS);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data loading for better UX
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

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

  const login = useCallback((credentials: { userId?: string; password?: string; adminPassword?: string }) => {
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
    const transactionForDb: Transaction = { 
        ...newTransaction, 
        id: `tx-${Date.now()}`,
        timestamp: Date.now() 
    };
    setTransactions(prev => [...prev, transactionForDb]);
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
    setUsers(prev => [...prev, newUser]);
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
    if (currentUser?.id !== 'admin') throw new Error('فقط مدیر مجاز به افزودن کالا است.');
    if (!name.trim()) throw new Error('نام کالا نمی‌تواند خالی باشد.');
    if (products.some(p => !p.isDeleted && p.name.toLowerCase() === name.toLowerCase().trim())) {
      throw new Error('کالایی با این نام از قبل وجود دارد.');
    }
    const newProduct: Product = { 
        id: `p-${Date.now()}`,
        name: name.trim(), 
        isDeleted: false 
    };
    setProducts(prev => [...prev, newProduct]);
  }, [products, currentUser]);

  const updateProduct = useCallback(async (id: string, name: string) => {
    if (currentUser?.id !== 'admin') throw new Error('فقط مدیر مجاز به ویرایش کالا است.');
    if (!name.trim()) throw new Error('نام کالا نمی‌تواند خالی باشد.');
    setProducts(prev => prev.map(p => p.id === id ? { ...p, name: name.trim() } : p));
  }, [currentUser]);

  const deleteProduct = useCallback(async (id: string, adminPassword: string) => {
    if (currentUser?.id !== 'admin') throw new Error('فقط مدیر مجاز به حذف کالا است.');
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    
    const newTransactions: Transaction[] = [];
    const productInventory = inventoryData[id];
    if (productInventory && productInventory.total > 0) {
      WAREHOUSES.forEach(warehouse => {
        const stock = productInventory.stock[warehouse.id] || 0;
        if (stock > 0) {
          newTransactions.push({
            id: `tx-del-out-${id}-${warehouse.id}-${Date.now()}`,
            productId: id,
            warehouseId: warehouse.id,
            userId: currentUser.id,
            type: TransactionType.OUT,
            quantity: stock,
            timestamp: Date.now(),
            description: 'حذف کالا و صفر کردن موجودی',
          });
        }
      });
    }

    newTransactions.push({
      id: `tx-del-${id}-${Date.now()}`,
      productId: id,
      userId: currentUser.id,
      type: TransactionType.DELETE,
      quantity: 0,
      warehouseId: WAREHOUSES[0]?.id || 'w1',
      timestamp: Date.now() + 1,
      description: 'ثبت حذف کالا در سیستم',
    });
    
    setTransactions(prev => [...prev, ...newTransactions]);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isDeleted: true } : p));
  }, [inventoryData, currentUser]);

  const deleteTransaction = useCallback(async (transactionId: string, adminPassword: string) => {
    if (currentUser?.id !== 'admin') throw new Error('فقط مدیر مجاز به حذف تراکنش است.');
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
    totalInventoryCount, currentUser, login, logout, loading,
  };
};