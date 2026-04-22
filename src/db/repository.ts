import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, Repository, Transaction } from './types';
import { createId, defaultCategories } from './seed';

const CATEGORIES_KEY = 'ev_butce.categories';
const TRANSACTIONS_KEY = 'ev_butce.transactions';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const repository: Repository = {
  async init() {
    const existing = await readJson<Category[]>(CATEGORIES_KEY, []);
    if (existing.length === 0) {
      const seeded: Category[] = defaultCategories.map((c) => ({ ...c, id: createId() }));
      await writeJson(CATEGORIES_KEY, seeded);
    }
    const txs = await readJson<Transaction[]>(TRANSACTIONS_KEY, []);
    await writeJson(TRANSACTIONS_KEY, txs);
  },

  async listCategories() {
    const cats = await readJson<Category[]>(CATEGORIES_KEY, []);
    return [...cats].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
      return a.name.localeCompare(b.name, 'tr');
    });
  },

  async addCategory(category) {
    const cats = await readJson<Category[]>(CATEGORIES_KEY, []);
    const created: Category = { id: createId(), ...category };
    await writeJson(CATEGORIES_KEY, [...cats, created]);
    return created;
  },

  async updateCategory(category) {
    const cats = await readJson<Category[]>(CATEGORIES_KEY, []);
    await writeJson(
      CATEGORIES_KEY,
      cats.map((c) => (c.id === category.id ? category : c))
    );
  },

  async deleteCategory(id) {
    const cats = await readJson<Category[]>(CATEGORIES_KEY, []);
    await writeJson(
      CATEGORIES_KEY,
      cats.filter((c) => c.id !== id)
    );
  },

  async listTransactions() {
    const txs = await readJson<Transaction[]>(TRANSACTIONS_KEY, []);
    return [...txs].sort((a, b) => b.date.localeCompare(a.date));
  },

  async addTransaction(tx) {
    const txs = await readJson<Transaction[]>(TRANSACTIONS_KEY, []);
    const created: Transaction = { id: createId(), ...tx };
    await writeJson(TRANSACTIONS_KEY, [created, ...txs]);
    return created;
  },

  async updateTransaction(tx) {
    const txs = await readJson<Transaction[]>(TRANSACTIONS_KEY, []);
    await writeJson(
      TRANSACTIONS_KEY,
      txs.map((t) => (t.id === tx.id ? tx : t))
    );
  },

  async deleteTransaction(id) {
    const txs = await readJson<Transaction[]>(TRANSACTIONS_KEY, []);
    await writeJson(
      TRANSACTIONS_KEY,
      txs.filter((t) => t.id !== id)
    );
  },

  async reset() {
    await AsyncStorage.multiRemove([CATEGORIES_KEY, TRANSACTIONS_KEY]);
    const seeded: Category[] = defaultCategories.map((c) => ({ ...c, id: createId() }));
    await writeJson(CATEGORIES_KEY, seeded);
    await writeJson(TRANSACTIONS_KEY, []);
  },
};
