import type { Product, Warehouse, User } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'لپتاپ مدل A' },
  { id: 'p2', name: 'موس بی‌سیم' },
  { id: 'p3', name: 'کیبورد مکانیکی' },
  { id: 'p4', name: 'مانیتور ۲۴ اینچ' },
  { id: 'p5', name: 'هارد اکسترنال ۱ ترابایت' },
];

export const WAREHOUSES: Warehouse[] = [
  { id: 'w1', name: 'انبار ۱ (مرکزی)' },
  { id: 'w2', name: 'انبار ۲ (پشتیبان)' },
];

export const USERS: User[] = [
    { id: 'u1', name: 'علی رضایی', password: '123' },
    { id: 'u2', name: 'مریم احمدی', password: '456' },
];

export const ADMIN_PASSWORD = '19544226378';