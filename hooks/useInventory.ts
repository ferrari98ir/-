import { useState, useCallback, useMemo, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const seedDatabase = async () => {
      try {
        const productsQuery = query(collection(db, 'products'));
        const productsSnap = await getDocs(productsQuery);
        if (productsSnap.empty) {
          console.log('Database is empty. Seeding initial data...');
          const batch = writeBatch(db);
          
          INITIAL_PRODUCTS.forEach(p => {
              const productRef = doc(collection(db, 'products'));
              batch.set(productRef, { name: p.name, isDeleted: p.isDeleted || false });
          });
          
          USERS.forEach(u => {
              const userRef = doc(collection(db, 'users'));
              batch.set(userRef, { name: u.name, password: u.password, isDeleted: u.isDeleted || false });
          });

          initialTransactions.forEach(tx => {
              const txRef = doc(collection(db, 'transactions'));
              batch.set(txRef, { ...tx, timestamp: Timestamp.fromMillis(tx.timestamp) });
          });
          
          await batch.commit();
          console.log('Seeding complete.');
        }
      } catch (error) {
        console.error("Error seeding or checking database:", error);
      }
    };
    
    seedDatabase();

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
        const productsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                isDeleted: data.isDeleted || false,
            } as Product;
        });
        setProducts(productsData);
    }, (error) => {
      console.error("Error fetching products:", error);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                password: data.password,
                isDeleted: data.isDeleted || false,
            } as User;
        });
        setUsers(usersData);
    }, (error) => {
      console.error("Error fetching users:", error);
    });

    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
        const transactionsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                productId: data.productId,
                warehouseId: data.warehouseId,
                userId: data.userId,
                type: data.type,
                quantity: data.quantity,
                timestamp: (data.timestamp as Timestamp).toMillis(),
                description: data.description,
            } as Transaction;
        });
        setTransactions(transactionsData);
    }, (error) => {
      console.error("Error fetching transactions:", error);
    });

    const timer = setTimeout(() => setLoading(false), 1500); // Give snapshots time to load

    return () => {
        unsubProducts();
        unsubUsers();
        unsubTransactions();
        clearTimeout(timer);
    };
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
    const transactionForDb = { ...newTransaction, timestamp: Timestamp.now() };
    await addDoc(collection(db, 'transactions'), transactionForDb);
  }, [inventoryData, users, currentUser]);

  const addUser = useCallback(async (name: string, password: string, adminPassword: string) => {
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    if (!name.trim()) throw new Error('نام کاربر نمی‌تواند خالی باشد.');
    if (!password.trim()) throw new Error('رمز عبور نمی‌تواند خالی باشد.');
    const newUser = { name, password, isDeleted: false };
    await addDoc(collection(db, 'users'), newUser);
  }, []);

  const updateUser = useCallback(async (userId: string, updates: { name?: string; password?: string }, adminPassword: string) => {
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    const userRef = doc(db, 'users', userId);
    const updateData: { name?: string; password?: string } = {};
    if (updates.name?.trim()) updateData.name = updates.name.trim();
    if (updates.password) updateData.password = updates.password;
    if (Object.keys(updateData).length > 0) {
      await updateDoc(userRef, updateData);
    }
  }, []);

  const deleteUser = useCallback(async (userId: string, adminPassword: string) => {
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    const activeUsers = users.filter(u => !u.isDeleted);
    if (activeUsers.length <= 1) throw new Error('حداقل یک کاربر فعال باید در سیستم وجود داشته باشد.');
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isDeleted: true });
  }, [users]);

  const addProduct = useCallback(async (name: string) => {
    if (currentUser?.id !== 'admin') throw new Error('فقط مدیر مجاز به افزودن کالا است.');
    if (!name.trim()) throw new Error('نام کالا نمی‌تواند خالی باشد.');
    if (products.some(p => !p.isDeleted && p.name.toLowerCase() === name.toLowerCase().trim())) {
      throw new Error('کالایی با این نام از قبل وجود دارد.');
    }
    await addDoc(collection(db, 'products'), { name: name.trim(), isDeleted: false });
  }, [products, currentUser]);

  const updateProduct = useCallback(async (id: string, name: string) => {
    if (currentUser?.id !== 'admin') throw new Error('فقط مدیر مجاز به ویرایش کالا است.');
    if (!name.trim()) throw new Error('نام کالا نمی‌تواند خالی باشد.');
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, { name: name.trim() });
  }, [currentUser]);

  const deleteProduct = useCallback(async (id: string, adminPassword: string) => {
    if (currentUser?.id !== 'admin') throw new Error('فقط مدیر مجاز به حذف کالا است.');
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    
    const batch = writeBatch(db);
    const productInventory = inventoryData[id];
    if (productInventory && productInventory.total > 0) {
      WAREHOUSES.forEach(warehouse => {
        const stock = productInventory.stock[warehouse.id] || 0;
        if (stock > 0) {
          const outTxRef = doc(collection(db, 'transactions'));
          batch.set(outTxRef, {
            productId: id,
            warehouseId: warehouse.id,
            userId: currentUser.id,
            type: TransactionType.OUT,
            quantity: stock,
            timestamp: Timestamp.now(),
            description: 'حذف کالا و صفر کردن موجودی',
          });
        }
      });
    }

    const deleteTxRef = doc(collection(db, 'transactions'));
    batch.set(deleteTxRef, {
      productId: id,
      userId: currentUser.id,
      type: TransactionType.DELETE,
      quantity: 0,
      warehouseId: WAREHOUSES[0]?.id || 'w1',
      timestamp: Timestamp.fromMillis(Date.now() + 1),
      description: 'ثبت حذف کالا در سیستم',
    });

    const productRef = doc(db, 'products', id);
    batch.update(productRef, { isDeleted: true });

    await batch.commit();
  }, [inventoryData, currentUser]);

  const deleteTransaction = useCallback(async (transactionId: string, adminPassword: string) => {
    if (currentUser?.id !== 'admin') throw new Error('فقط مدیر مجاز به حذف تراکنش است.');
    if (adminPassword !== ADMIN_PASSWORD) throw new Error('رمز عبور مدیر صحیح نیست.');
    await deleteDoc(doc(db, 'transactions', transactionId));
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
