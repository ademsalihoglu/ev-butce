import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { repository, Asset, Category, Note, ShoppingItem, Transaction } from '../db';
import { firestoreRepository } from '../db/firestoreRepository';
import type { Repository } from '../db/types';
import { useAuth } from './AuthContext';
import { useGroup } from './GroupContext';

interface DataContextValue {
  loading: boolean;
  scopeLabel: 'local' | 'group';
  categories: Category[];
  transactions: Transaction[];
  shoppingItems: ShoppingItem[];
  notes: Note[];
  assets: Asset[];
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
  addAsset: (asset: Omit<Asset, 'id'>) => Promise<Asset>;
  updateAsset: (asset: Asset) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { activeGroupId } = useGroup();
  const userScope = user?.uid ?? null;

  const scopeLabel: 'local' | 'group' = activeGroupId ? 'group' : 'local';
  const activeRepo: Repository = activeGroupId ? firestoreRepository : repository;

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const refresh = useCallback(async () => {
    const [cats, txs, items, ns, as] = await Promise.all([
      activeRepo.listCategories(),
      activeRepo.listTransactions(),
      activeRepo.listShoppingItems(),
      activeRepo.listNotes(),
      activeRepo.listAssets(),
    ]);
    setCategories(cats);
    setTransactions(txs);
    setShoppingItems(items);
    setNotes(ns);
    setAssets(as);
  }, [activeRepo]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        activeRepo.setScope(activeGroupId ?? userScope);
        await activeRepo.init();
        if (!cancelled) await refresh();
      } catch {
        if (!cancelled) {
          setCategories([]);
          setTransactions([]);
          setShoppingItems([]);
          setNotes([]);
          setAssets([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh, userScope, activeGroupId, activeRepo]);

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id'>) => {
      const created = await activeRepo.addTransaction(tx);
      await refresh();
      return created;
    },
    [activeRepo, refresh]
  );

  const updateTransaction = useCallback(
    async (tx: Transaction) => {
      await activeRepo.updateTransaction(tx);
      await refresh();
    },
    [activeRepo, refresh]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await activeRepo.deleteTransaction(id);
      await refresh();
    },
    [activeRepo, refresh]
  );

  const addCategory = useCallback(
    async (cat: Omit<Category, 'id'>) => {
      await activeRepo.addCategory(cat);
      await refresh();
    },
    [activeRepo, refresh]
  );

  const updateCategory = useCallback(
    async (cat: Category) => {
      await activeRepo.updateCategory(cat);
      await refresh();
    },
    [activeRepo, refresh]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await activeRepo.deleteCategory(id);
      await refresh();
    },
    [activeRepo, refresh]
  );

  const addShoppingItem = useCallback(
    async (item: Omit<ShoppingItem, 'id'>) => {
      await activeRepo.addShoppingItem(item);
      await refresh();
    },
    [activeRepo, refresh]
  );

  const updateShoppingItem = useCallback(
    async (item: ShoppingItem) => {
      await activeRepo.updateShoppingItem(item);
      await refresh();
    },
    [activeRepo, refresh]
  );

  const deleteShoppingItem = useCallback(
    async (id: string) => {
      await activeRepo.deleteShoppingItem(id);
      await refresh();
    },
    [activeRepo, refresh]
  );

  const addNote = useCallback(
    async (note: Omit<Note, 'id'>) => {
      const created = await activeRepo.addNote(note);
      await refresh();
      return created;
    },
    [activeRepo, refresh]
  );

  const updateNote = useCallback(
    async (note: Note) => {
      await activeRepo.updateNote(note);
      await refresh();
    },
    [activeRepo, refresh]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await activeRepo.deleteNote(id);
      await refresh();
    },
    [activeRepo, refresh]
  );

  const addAsset = useCallback(
    async (asset: Omit<Asset, 'id'>) => {
      const created = await activeRepo.addAsset(asset);
      await refresh();
      return created;
    },
    [activeRepo, refresh]
  );

  const updateAsset = useCallback(
    async (asset: Asset) => {
      await activeRepo.updateAsset(asset);
      await refresh();
    },
    [activeRepo, refresh]
  );

  const deleteAsset = useCallback(
    async (id: string) => {
      await activeRepo.deleteAsset(id);
      await refresh();
    },
    [activeRepo, refresh]
  );

  const resetAll = useCallback(async () => {
    await activeRepo.reset();
    await refresh();
  }, [activeRepo, refresh]);

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      scopeLabel,
      categories,
      transactions,
      shoppingItems,
      notes,
      assets,
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
      addAsset,
      updateAsset,
      deleteAsset,
      resetAll,
    }),
    [
      loading,
      scopeLabel,
      categories,
      transactions,
      shoppingItems,
      notes,
      assets,
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
      addAsset,
      updateAsset,
      deleteAsset,
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
