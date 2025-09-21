export interface Product {
  id: string;
  name: string;
  isDeleted?: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  password: string;
  isDeleted?: boolean;
}

export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT',
  DELETE = 'DELETE',
}

export interface Transaction {
  id:string;
  productId: string;
  warehouseId: string;
  userId: string;
  type: TransactionType;
  quantity: number;
  timestamp: number;
  description: string;
}

export interface InventoryData {
  [productId: string]: {
    // FIX: Nest warehouse stock data to resolve index signature conflict.
    // The previous flat structure caused a type error because the index signature
    // `[warehouseId: string]: number` conflicted with `productName: string`.
    stock: {
      [warehouseId: string]: number;
    };
    total: number;
    productName: string;
  };
}