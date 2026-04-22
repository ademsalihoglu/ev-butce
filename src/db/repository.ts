import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, Note, Repository, ShoppingItem, Transaction } from './types';
import { createId, defaultCategories } from './seed';

let scope: string | null = null;

function keyFor(kind: 'categories' | 'transactions' | 'shopping' | 'notes'): string {
  const ns = scope ?? 'anon';
  return `ev_butce.${ns}.${kind}`;
}

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
  setScope(next: string | null) {
    scope = next;
  },

  async init() {
    const existing = await readJson<Category[]>(keyFor('categories'), []);
    if (existing.length === 0) {
      const seeded: Category[] = defaultCategories.map((c) => ({ ...c, id: createId() }));
      await writeJson(keyFor('categories'), seeded);
    }
    await writeJson(keyFor('transactions'), await readJson<Transaction[]>(keyFor('transactions'), []));
    await writeJson(keyFor('shopping'), await readJson<ShoppingItem[]>(keyFor('shopping'), []));
    await writeJson(keyFor('notes'), await readJson<Note[]>(keyFor('notes'), []));
  },

  async listCategories() {
    const cats = await readJson<Category[]>(keyFor('categories'), []);
    return [...cats].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
      return a.name.localeCompare(b.name, 'tr');
    });
  },

  async addCategory(category) {
    const cats = await readJson<Category[]>(keyFor('categories'), []);
    const created: Category = { id: createId(), ...category };
    await writeJson(keyFor('categories'), [...cats, created]);
    return created;
  },

  async updateCategory(category) {
    const cats = await readJson<Category[]>(keyFor('categories'), []);
    await writeJson(
      keyFor('categories'),
      cats.map((c) => (c.id === category.id ? category : c))
    );
  },

  async deleteCategory(id) {
    const cats = await readJson<Category[]>(keyFor('categories'), []);
    await writeJson(
      keyFor('categories'),
      cats.filter((c) => c.id !== id)
    );
  },

  async listTransactions() {
    const txs = await readJson<Transaction[]>(keyFor('transactions'), []);
    return [...txs].sort((a, b) => b.date.localeCompare(a.date));
  },

  async addTransaction(tx) {
    const txs = await readJson<Transaction[]>(keyFor('transactions'), []);
    const created: Transaction = { id: createId(), ...tx };
    await writeJson(keyFor('transactions'), [created, ...txs]);
    return created;
  },

  async updateTransaction(tx) {
    const txs = await readJson<Transaction[]>(keyFor('transactions'), []);
    await writeJson(
      keyFor('transactions'),
      txs.map((t) => (t.id === tx.id ? tx : t))
    );
  },

  async deleteTransaction(id) {
    const txs = await readJson<Transaction[]>(keyFor('transactions'), []);
    await writeJson(
      keyFor('transactions'),
      txs.filter((t) => t.id !== id)
    );
  },

  async listShoppingItems() {
    const items = await readJson<ShoppingItem[]>(keyFor('shopping'), []);
    return [...items].sort((a, b) => {
      if (a.bought !== b.bought) return a.bought ? 1 : -1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  },

  async addShoppingItem(item) {
    const items = await readJson<ShoppingItem[]>(keyFor('shopping'), []);
    const created: ShoppingItem = { id: createId(), ...item };
    await writeJson(keyFor('shopping'), [created, ...items]);
    return created;
  },

  async updateShoppingItem(item) {
    const items = await readJson<ShoppingItem[]>(keyFor('shopping'), []);
    await writeJson(
      keyFor('shopping'),
      items.map((it) => (it.id === item.id ? item : it))
    );
  },

  async deleteShoppingItem(id) {
    const items = await readJson<ShoppingItem[]>(keyFor('shopping'), []);
    await writeJson(
      keyFor('shopping'),
      items.filter((it) => it.id !== id)
    );
  },

  async listNotes() {
    const notes = await readJson<Note[]>(keyFor('notes'), []);
    return [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  },

  async addNote(note) {
    const notes = await readJson<Note[]>(keyFor('notes'), []);
    const created: Note = { id: createId(), ...note };
    await writeJson(keyFor('notes'), [created, ...notes]);
    return created;
  },

  async updateNote(note) {
    const notes = await readJson<Note[]>(keyFor('notes'), []);
    await writeJson(
      keyFor('notes'),
      notes.map((n) => (n.id === note.id ? note : n))
    );
  },

  async deleteNote(id) {
    const notes = await readJson<Note[]>(keyFor('notes'), []);
    await writeJson(
      keyFor('notes'),
      notes.filter((n) => n.id !== id)
    );
  },

  async reset() {
    await AsyncStorage.multiRemove([
      keyFor('categories'),
      keyFor('transactions'),
      keyFor('shopping'),
      keyFor('notes'),
    ]);
    const seeded: Category[] = defaultCategories.map((c) => ({ ...c, id: createId() }));
    await writeJson(keyFor('categories'), seeded);
    await writeJson(keyFor('transactions'), []);
    await writeJson(keyFor('shopping'), []);
    await writeJson(keyFor('notes'), []);
  },
};
