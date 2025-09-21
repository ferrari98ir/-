import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Transaction, Product, User, InventoryData } from '../types';
import { TransactionType } from '../types';
import { WAREHOUSES, ADMIN_PASSWORD } from '../constants';
import { supabase } from '../firebase';

type CurrentUser = User | { id: 'admin'; name: 'مدیر کل' };

export const useInventory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsRes, usersRes, transactionsRes] = await Promise.all([
                supabase.from('products').select('*').order('name'),
                supabase.from('users').select('*').order('name'),
                supabase.from('transactions').select('*').order('timestamp', { ascending: false })
            ]);

            if (productsRes.error) throw productsRes.error;
            if (usersRes.error) throw usersRes.error;
            if (transactionsRes.error) throw transactionsRes.error;
            
            setProducts(productsRes.data || []);
            setUsers(usersRes.data || []);
            setTransactions(transactionsRes.data || []);

        } catch (error) {
            console.error("Error fetching initial data from Supabase:", error);
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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', credentials.userId)
        .eq('isDeleted', false)
        .single();

      if (error || !data) {
        console.error(error);
        throw new Error('نام کاربری یا رمز عبور صحیح نیست.');
      }

      if (data.password === credentials.password) {
        setCurrentUser(data);
      } else {
        throw new Error('نام کاربری یا رمز عبور صحیح نیست.');
      }
    } else {
      throw new Error('اطلاعات ورود نامعتبر است.');
    }
  }, []);

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
    
    const { error } = await supabase.from('transactions').insert([transactionForDb]);
    if (error) {
        console.error('Supabase error adding transaction:', error);
        throw new Error('خطا در ارتباط با دیتابیس.');
    }
    
    setTransactions(prev => [transactionForDb, ...prev]);
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
    
    const { error } = await supabase.from('users').insert([newUser]);
    if (error) {
        console.error('Supabase error adding user:', error);
        throw new Error('خطا در افزودن کاربر به دیتابیس.');
    }
    
    setUsers(prev => [...prev, newUser].sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const updateUser = useCallback(async (userId: string, updates: { name?: string; password?: string }, adminPassword: string) => {
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    const updateData: { name?: string; password?: string } = {};
    if (updates.name?.trim()) updateData.name = updates.name.trim();
    if (updates.password) updateData.password = updates.password;
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.from('users').update(updateData).eq('id', userId);
      if (error) {
          console.error('Supabase error updating user:', error);
          throw new Error('خطا در ویرایش کاربر در دیتابیس.');
      }
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updateData } : u));
    }
  }, []);

  const deleteUser = useCallback(async (userId: string, adminPassword: string) => {
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    const activeUsers = users.filter(u => !u.isDeleted);
    if (activeUsers.length <= 1) throw new Error('حداقل یک کاربر فعال باید در سیستم وجود داشته باشد.');
    
    const { error } = await supabase.from('users').update({ isDeleted: true }).eq('id', userId);
    if (error) {
        console.error('Supabase error deleting user:', error);
        throw new Error('خطا در حذف کاربر در دیتابیس.');
    }
    
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
    
    const { error } = await supabase.from('products').insert([newProduct]);
    if (error) {
        console.error('Supabase error adding product:', error);
        throw new Error('خطا در افزودن کالا به دیتابیس.');
    }

    setProducts(prev => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
  }, [products, currentUser]);

  const updateProduct = useCallback(async (id: string, name: string) => {
    if (!currentUser || currentUser.id !== 'admin') throw new Error('فقط مدیر مجاز به ویرایش کالا است.');
    if (!name.trim()) throw new Error('نام کالا نمی‌تواند خالی باشد.');
    
    const { error } = await supabase.from('products').update({ name: name.trim() }).eq('id', id);
    if (error) {
        console.error('Supabase error updating product:', error);
        throw new Error('خطا در ویرایش کالا در دیتابیس.');
    }

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
    
    const { error: txError } = await supabase.from('transactions').insert(newTransactions);
    if (txError) {
        console.error('Supabase error adding deletion transactions:', txError);
        throw new Error('خطا در ثبت تراکنش‌های حذف کالا.');
    }
    
    const { error: productError } = await supabase.from('products').update({ isDeleted: true }).eq('id', id);
    if (productError) {
        console.error('Supabase error deleting product:', productError);
        throw new Error('خطا در حذف کالا از دیتابیس.');
    }

    setTransactions(prev => [...newTransactions, ...prev]);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isDeleted: true } : p));
  }, [inventoryData, currentUser]);

  const deleteTransaction = useCallback(async (transactionId: string, adminPassword: string) => {
    if (!currentUser || currentUser.id !== 'admin') throw new Error('فقط مدیر مجاز به حذف تراکنش است.');
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    
    const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (error) {
        console.error('Supabase error deleting transaction:', error);
        throw new Error('خطا در حذف تراکنش از دیتابیس.');
    }
    
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