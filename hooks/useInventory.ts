import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Transaction, Product, User, InventoryData } from '../types';
import { TransactionType } from '../types';
import { WAREHOUSES, ADMIN_PASSWORD } from '../constants';
import { supabase } from '../firebase'; // Using the configured Supabase client

type CurrentUser = User | { id: 'admin'; name: 'مدیر کل' };

// --- HOOK IMPLEMENTATION ---
export const useInventory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Effect to fetch initial data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setDbError("اتصال به پایگاه داده Supabase پیکربندی نشده است. لطفاً متغیرهای محیطی را بررسی کنید.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const [transactionsRes, productsRes, usersRes] = await Promise.all([
          supabase.from('transactions').select('*').order('timestamp', { ascending: false }),
          supabase.from('products').select('*').order('name', { ascending: true }),
          supabase.from('users').select('*').order('name', { ascending: true }),
        ]);

        if (transactionsRes.error) throw new Error(`Transactions: ${transactionsRes.error.message}`);
        if (productsRes.error) throw new Error(`Products: ${productsRes.error.message}`);
        if (usersRes.error) throw new Error(`Users: ${usersRes.error.message}`);
        
        setTransactions(transactionsRes.data || []);
        setProducts(productsRes.data || []);
        setUsers(usersRes.data || []);

      } catch (err: any) {
        setDbError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
    if (!supabase) throw new Error("Database not connected.");
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
    
    const { data, error } = await supabase.from('transactions').insert(newTransaction).select().single();
    if (error) throw new Error(error.message);
    if (data) setTransactions(prev => [data, ...prev].sort((a, b) => b.timestamp - a.timestamp));
  }, [inventoryData, users, currentUser]);

  const addUser = useCallback(async (name: string, password: string, adminPassword: string) => {
    if (!supabase) throw new Error("Database not connected.");
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    if (!name.trim()) throw new Error('نام کاربر نمی‌تواند خالی باشد.');
    if (!password.trim()) throw new Error('رمز عبور نمی‌تواند خالی باشد.');
    
    const { data, error } = await supabase.from('users').insert({ name: name.trim(), password }).select().single();
    if (error) throw new Error(error.message);
    if (data) setUsers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const updateUser = useCallback(async (userId: string, updates: { name?: string; password?: string }, adminPassword: string) => {
    if (!supabase) throw new Error("Database not connected.");
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    const updateData: { name?: string; password?: string } = {};
    if (updates.name?.trim()) updateData.name = updates.name.trim();
    if (updates.password) updateData.password = updates.password;

    if (Object.keys(updateData).length > 0) {
      const { data, error } = await supabase.from('users').update(updateData).eq('id', userId).select().single();
      if (error) throw new Error(error.message);
      if (data) setUsers(prev => prev.map(u => u.id === userId ? data : u));
    }
  }, []);

  const deleteUser = useCallback(async (userId: string, adminPassword: string) => {
    if (!supabase) throw new Error("Database not connected.");
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    const activeUsers = users.filter(u => !u.isDeleted);
    if (activeUsers.length <= 1) throw new Error('حداقل یک کاربر فعال باید در سیستم وجود داشته باشد.');
    
    const { data, error } = await supabase.from('users').update({ isDeleted: true }).eq('id', userId).select().single();
    if (error) throw new Error(error.message);
    if (data) setUsers(prev => prev.map(u => u.id === userId ? data : u));
  }, [users]);

  const addProduct = useCallback(async (name: string) => {
    if (!supabase) throw new Error("Database not connected.");
    if (!currentUser || currentUser.id !== 'admin') throw new Error('فقط مدیر مجاز به افزودن کالا است.');
    if (!name.trim()) throw new Error('نام کالا نمی‌تواند خالی باشد.');
    if (products.some(p => !p.isDeleted && p.name.toLowerCase() === name.toLowerCase().trim())) {
      throw new Error('کالایی با این نام از قبل وجود دارد.');
    }

    const { data, error } = await supabase.from('products').insert({ name: name.trim() }).select().single();
    if (error) throw new Error(error.message);
    if (data) setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  }, [products, currentUser]);

  const updateProduct = useCallback(async (id: string, name: string) => {
    if (!supabase) throw new Error("Database not connected.");
    if (!currentUser || currentUser.id !== 'admin') throw new Error('فقط مدیر مجاز به ویرایش کالا است.');
    if (!name.trim()) throw new Error('نام کالا نمی‌تواند خالی باشد.');
    
    const { data, error } = await supabase.from('products').update({ name: name.trim() }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (data) setProducts(prev => prev.map(p => p.id === id ? data : p));
  }, [currentUser]);

  const deleteProduct = useCallback(async (id: string, adminPassword: string) => {
    if (!supabase) throw new Error("Database not connected.");
    if (!currentUser || currentUser.id !== 'admin') throw new Error('فقط مدیر مجاز به حذف کالا است.');
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    
    const newTransactions: Omit<Transaction, 'id' | 'timestamp'>[] = [];
    const productInventory = inventoryData[id];

    if (productInventory && productInventory.total > 0) {
      WAREHOUSES.forEach(warehouse => {
        const stock = productInventory.stock[warehouse.id] || 0;
        if (stock > 0) {
          newTransactions.push({
            productId: id,
            warehouseId: warehouse.id,
            userId: currentUser.id,
            type: TransactionType.OUT,
            quantity: stock,
            description: 'حذف کالا و صفر کردن موجودی',
          });
        }
      });
    }

    newTransactions.push({
      productId: id,
      userId: currentUser.id,
      type: TransactionType.DELETE,
      quantity: 0,
      warehouseId: WAREHOUSES[0]?.id || 'w1',
      description: 'ثبت حذف کالا در سیستم',
    });
    
    const { data: insertedTxs, error: txError } = await supabase.from('transactions').insert(newTransactions).select();
    if (txError) throw new Error(txError.message);

    const { data: updatedProduct, error: productError } = await supabase.from('products').update({ isDeleted: true }).eq('id', id).select().single();
    if (productError) throw new Error(productError.message);

    if (insertedTxs) setTransactions(prev => [...insertedTxs, ...prev].sort((a, b) => b.timestamp - a.timestamp));
    if (updatedProduct) setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));

  }, [inventoryData, currentUser]);

  const deleteTransaction = useCallback(async (transactionId: string, adminPassword: string) => {
    if (!supabase) throw new Error("Database not connected.");
    if (!currentUser || currentUser.id !== 'admin') throw new Error('فقط مدیر مجاز به حذف تراکنش است.');
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (error) throw new Error(error.message);

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