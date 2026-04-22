import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { repository, Category, Note, ShoppingItem, Transaction } from '../db';
import { useAuth } from './AuthContext';

interface DataContextValue {
  loading: boolean;
  categories: Category[];
  transactions: Transaction[];
  shoppingItems: ShoppingItem[];
  notes: Note[];
  refresh: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (cat: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addShoppingItem: (item: Omit<ShoppingItem, 'id'>) => Promise<void>;
  updateShoppingItem: (item: ShoppingItem) => Promise<void>;
  deleteShoppingItem: (id: string) => Promise<void>;
  addNote: (note: Omit<Note, 'id'>) => Promise<Note>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const scope = user?.uid ?? null;

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const refresh = useCallback(async () => {
    const [cats, txs, items, ns] = await Promise.all([
      repository.listCategories(),
      repository.listTransactions(),
      repository.listShoppingItems(),
      repository.listNotes(),
    ]);
    setCategories(cats);
    setTransactions(txs);
    setShoppingItems(items);
    setNotes(ns);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        repository.setScope(scope);
        await repository.init();
        if (!cancelled) await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh, scope]);

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id'>) => {
      const created = await repository.addTransaction(tx);
      await refresh();
      return created;
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

  const addShoppingItem = useCallback(
    async (item: Omit<ShoppingItem, 'id'>) => {
      await repository.addShoppingItem(item);
      await refresh();
    },
    [refresh]
  );

  const updateShoppingItem = useCallback(
    async (item: ShoppingItem) => {
      await repository.updateShoppingItem(item);
      await refresh();
    },
    [refresh]
  );

  const deleteShoppingItem = useCallback(
    async (id: string) => {
      await repository.deleteShoppingItem(id);
      await refresh();
    },
    [refresh]
  );

  const addNote = useCallback(
    async (note: Omit<Note, 'id'>) => {
      const created = await repository.addNote(note);
      await refresh();
      return created;
    },
    [refresh]
  );

  const updateNote = useCallback(
    async (note: Note) => {
      await repository.updateNote(note);
      await refresh();
    },
    [refresh]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await repository.deleteNote(id);
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
      shoppingItems,
      notes,
      refresh,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      addShoppingItem,
      updateShoppingItem,
      deleteShoppingItem,
      addNote,
      updateNote,
      deleteNote,
      resetAll,
    }),
    [
      loading,
      categories,
      transactions,
      shoppingItems,
      notes,
      refresh,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      addShoppingItem,
      updateShoppingItem,
      deleteShoppingItem,
      addNote,
      updateNote,
      deleteNote,
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
