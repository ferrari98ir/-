
import { createContext, useContext } from 'react';
import type { useInventory } from '../hooks/useInventory';

type InventoryContextType = ReturnType<typeof useInventory> | null;

export const InventoryContext = createContext<InventoryContextType>(null);

export const InventoryProvider = InventoryContext.Provider;

export const useInventoryContext = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventoryContext must be used within an InventoryProvider');
  }
  return context;
};
