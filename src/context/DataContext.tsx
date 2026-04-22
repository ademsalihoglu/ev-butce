import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { repository, Category, Transaction } from '../db';

interface DataContextValue {
  loading: boolean;
  categories: Category[];
  transactions: Transaction[];
  refresh: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (cat: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refresh = useCallback(async () => {
    const [cats, txs] = await Promise.all([
      repository.listCategories(),
      repository.listTransactions(),
    ]);
    setCategories(cats);
    setTransactions(txs);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await repository.init();
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id'>) => {
      await repository.addTransaction(tx);
      await refresh();
    },
    [refresh]
  );

  const updateTransaction = useCallback(
    async (tx: Transaction) => {
      await repository.updateTransaction(tx);
      await refresh();
    },
    [refresh]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await repository.deleteTransaction(id);
      await refresh();
    },
    [refresh]
  );

  const addCategory = useCallback(
    async (cat: Omit<Category, 'id'>) => {
      await repository.addCategory(cat);
      await refresh();
    },
    [refresh]
  );

  const updateCategory = useCallback(
    async (cat: Category) => {
      await repository.updateCategory(cat);
      await refresh();
    },
    [refresh]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await repository.deleteCategory(id);
      await refresh();
    },
    [refresh]
  );

  const resetAll = useCallback(async () => {
    await repository.reset();
    await refresh();
  }, [refresh]);

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      categories,
      transactions,
      refresh,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      resetAll,
    }),
    [
      loading,
      categories,
      transactions,
      refresh,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      resetAll,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
