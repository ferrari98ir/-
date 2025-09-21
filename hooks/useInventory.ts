import { useState, useCallback, useMemo } from 'react';
import type { Transaction, InventoryData, Product, User } from '../types';
import { TransactionType } from '../types';
import { INITIAL_PRODUCTS, WAREHOUSES, USERS, ADMIN_PASSWORD } from '../constants';

const initialTransactions: Transaction[] = [
    { id: 't1', productId: 'p1', warehouseId: 'w1', userId: 'u1', type: TransactionType.IN, quantity: 20, timestamp: Date.now() - 50000, description: 'خرید اولیه' },
    { id: 't2', productId: 'p2', warehouseId: 'w1', userId: 'u2', type: TransactionType.IN, quantity: 100, timestamp: Date.now() - 40000, description: 'تامین موجودی' },
    { id: 't3', productId: 'p3', warehouseId: 'w2', userId: 'u1', type: TransactionType.IN, quantity: 50, timestamp: Date.now() - 30000, description: 'انتقال از انبار دیگر' },
    { id: 't4', productId: 'p1', warehouseId: 'w1', userId: 'u2', type: TransactionType.OUT, quantity: 5, timestamp: Date.now() - 20000, description: 'فروش به مشتری' },
    { id: 't5', productId: 'p4', warehouseId: 'w2', userId: 'u1', type: TransactionType.IN, quantity: 30, timestamp: Date.now() - 10000, description: 'خرید جدید' },
];

type CurrentUser = User | { id: 'admin'; name: 'مدیر کل' };

export const useInventory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [users, setUsers] = useState<User[]>(USERS);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const inventoryData = useMemo<InventoryData>(() => {
    const inventory: InventoryData = {};

    products.forEach(product => {
        inventory[product.id] = { productName: product.name, total: 0, stock: {} };
        WAREHOUSES.forEach(warehouse => {
            inventory[product.id].stock[warehouse.id] = 0;
        });
    });

    transactions.forEach(tx => {
      if (tx.type !== TransactionType.IN && tx.type !== TransactionType.OUT) {
        return;
      }
      if (!inventory[tx.productId]) return; // In case a product was deleted

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

  const addTransaction = useCallback((newTransaction: Omit<Transaction, 'id' | 'timestamp'>, authorizerPassword: string) => {
    const { userId, productId, warehouseId, type, quantity } = newTransaction;

    if (!currentUser) {
      throw new Error('برای ثبت تراکنش باید وارد شوید.');
    }

    if (currentUser.id === 'admin') {
      if (authorizerPassword !== ADMIN_PASSWORD) {
        throw new Error('رمز عبور مدیر برای ثبت تراکنش صحیح نیست.');
      }
    } else {
      if (currentUser.id !== userId) {
        throw new Error('شما مجاز به ثبت تراکنش برای کاربر دیگری نیستید.');
      }
      const user = users.find(u => u.id === userId);
      if (!user || user.password !== authorizerPassword) {
        throw new Error('رمز عبور شما صحیح نیست.');
      }
    }
    
    if (type === TransactionType.OUT) {
      const currentStock = inventoryData[productId]?.stock?.[warehouseId] ?? 0;
      if (currentStock < quantity) {
        throw new Error('موجودی انبار کافی نیست.');
      }
    }
    
    const transaction: Transaction = {
      ...newTransaction,
      id: `t${Date.now()}`,
      timestamp: Date.now(),
    };
    setTransactions(prev => [...prev, transaction]);
  }, [inventoryData, users, currentUser]);

  const addUser = useCallback((name: string, password: string, adminPassword: string) => {
    if (adminPassword !== ADMIN_PASSWORD) {
      throw new Error('رمز عبور مدیر صحیح نیست.');
    }
    if (!name.trim()) throw new Error('نام کاربر نمی‌تواند خالی باشد.');
    if (!password.trim()) throw new Error('رمز عبور نمی‌تواند خالی باشد.');
    const newUser: User = { id: `u${Date.now()}`, name, password };
    setUsers(prev => [...prev, newUser]);
  }, []);

  const updateUser = useCallback((userId: string, updates: { name?: string; password?: string }, adminPassword: string) => {
    if (adminPassword !== ADMIN_PASSWORD) {
      throw new Error('رمز عبور مدیر صحیح نیست.');
    }
    setUsers(prevUsers => prevUsers.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          name: updates.name?.trim() || user.name,
          password: updates.password || user.password,
        };
      }
      return user;
    }));
  }, []);

  const deleteUser = useCallback((userId: string, adminPassword: string) => {
    if (adminPassword !== ADMIN_PASSWORD) {
      throw new Error('رمز عبور مدیر صحیح نیست.');
    }
    const activeUsers = users.filter(u => !u.isDeleted);
    if (activeUsers.length <= 1) {
      throw new Error('حداقل یک کاربر فعال باید در سیستم وجود داشته باشد.');
    }
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId ? { ...user, isDeleted: true } : user
    ));
  }, [users]);

  const addProduct = useCallback((name: string) => {
    if (currentUser?.id !== 'admin') throw new Error('فقط مدیر مجاز به افزودن کالا است.');
    if (!name.trim()) throw new Error('نام کالا نمی‌تواند خالی باشد.');
    if (products.some(p => !p.isDeleted && p.name.toLowerCase() === name.toLowerCase().trim())) {
      throw new Error('کالایی با این نام از قبل وجود دارد.');
    }
    const newProduct: Product = { id: `p${Date.now()}`, name: name.trim() };
    setProducts(prev => [...prev, newProduct]);
  }, [products, currentUser]);

  const updateProduct = useCallback((id: string, name: string) => {
    if (currentUser?.id !== 'admin') throw new Error('فقط مدیر مجاز به ویرایش کالا است.');
    if (!name.trim()) throw new Error('نام کالا نمی‌تواند خالی باشد.');
    setProducts(prev => prev.map(p => p.id === id ? { ...p, name: name.trim() } : p));
  }, [currentUser]);

  const deleteProduct = useCallback((id: string, adminPassword: string) => {
    if (currentUser?.id !== 'admin') {
      throw new Error('فقط مدیر مجاز به حذف کالا است.');
    }
    if (adminPassword !== ADMIN_PASSWORD) {
      throw new Error('رمز عبور مدیر صحیح نیست.');
    }
    
    const productInventory = inventoryData[id];
    const newTransactions: Transaction[] = [];

    if (productInventory && productInventory.total > 0) {
        WAREHOUSES.forEach(warehouse => {
            const stock = productInventory.stock[warehouse.id] || 0;
            if (stock > 0) {
                newTransactions.push({
                    id: `t${Date.now()}-${warehouse.id}-writeoff-${Math.random().toString(36).substr(2, 5)}`,
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
        id: `t${Date.now()}-delete`,
        productId: id,
        userId: currentUser.id,
        type: TransactionType.DELETE,
        quantity: 0,
        warehouseId: WAREHOUSES[0]?.id || 'w1',
        timestamp: Date.now() + 1,
        description: 'ثبت حذف کالا در سیستم',
    });

    setTransactions(prev => [...prev, ...newTransactions]);
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, isDeleted: true } : p)));
  }, [inventoryData, currentUser]);

  const deleteTransaction = useCallback((transactionId: string, adminPassword: string) => {
    if (adminPassword !== ADMIN_PASSWORD) {
      throw new Error('رمز عبور مدیر صحیح نیست.');
    }
    setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
  }, []);

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
    transactions,
    addTransaction,
    inventoryData,
    products,
    warehouses: WAREHOUSES,
    users,
    addUser,
    updateUser,
    deleteUser,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteTransaction,
    warehouseTotals,
    totalInventoryCount,
    currentUser,
    login,
    logout,
  };
};