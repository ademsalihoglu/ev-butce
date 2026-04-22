import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDb } from '../firebase';
import { Asset, Category, Note, Repository, ShoppingItem, Transaction } from './types';
import { createId, defaultCategories } from './seed';

let groupId: string | null = null;

function requireGroup(): string {
  if (!groupId) throw new Error('Firestore repository: aktif bir grup yok.');
  return groupId;
}

function groupCol(kind: 'categories' | 'transactions' | 'shoppingItems' | 'notes' | 'assets') {
  return collection(getDb(), 'groups', requireGroup(), kind);
}

function stripUndefined<T extends object>(obj: T): { [k: string]: unknown } {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export const firestoreRepository: Repository = {
  setScope(next) {
    groupId = next;
  },

  async init() {
    if (!groupId) return;
    // Seed default categories once per group.
    const snap = await getDocs(groupCol('categories'));
    if (snap.empty) {
      const batch = writeBatch(getDb());
      for (const c of defaultCategories) {
        const id = createId();
        batch.set(doc(groupCol('categories'), id), { id, ...c });
      }
      await batch.commit();
    }
  },

  async listCategories() {
    const snap = await getDocs(groupCol('categories'));
    const cats = snap.docs.map((d) => d.data() as Category);
    return [...cats].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
      return a.name.localeCompare(b.name, 'tr');
    });
  },
  async addCategory(cat) {
    const id = createId();
    const created: Category = { id, ...cat };
    await setDoc(doc(groupCol('categories'), id), stripUndefined(created));
    return created;
  },
  async updateCategory(cat) {
    await setDoc(doc(groupCol('categories'), cat.id), stripUndefined(cat));
  },
  async deleteCategory(id) {
    await deleteDoc(doc(groupCol('categories'), id));
  },

  async listTransactions() {
    const snap = await getDocs(groupCol('transactions'));
    const txs = snap.docs.map((d) => d.data() as Transaction);
    return [...txs].sort((a, b) => b.date.localeCompare(a.date));
  },
  async addTransaction(tx) {
    const id = createId();
    const created: Transaction = { id, ...tx };
    await setDoc(doc(groupCol('transactions'), id), stripUndefined(created));
    return created;
  },
  async updateTransaction(tx) {
    await setDoc(doc(groupCol('transactions'), tx.id), stripUndefined(tx));
  },
  async deleteTransaction(id) {
    await deleteDoc(doc(groupCol('transactions'), id));
  },

  async listShoppingItems() {
    const snap = await getDocs(groupCol('shoppingItems'));
    const items = snap.docs.map((d) => d.data() as ShoppingItem);
    return [...items].sort((a, b) => {
      if (a.bought !== b.bought) return a.bought ? 1 : -1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  },
  async addShoppingItem(item) {
    const id = createId();
    const created: ShoppingItem = { id, ...item };
    await setDoc(doc(groupCol('shoppingItems'), id), stripUndefined(created));
    return created;
  },
  async updateShoppingItem(item) {
    await setDoc(doc(groupCol('shoppingItems'), item.id), stripUndefined(item));
  },
  async deleteShoppingItem(id) {
    await deleteDoc(doc(groupCol('shoppingItems'), id));
  },

  async listNotes() {
    const snap = await getDocs(groupCol('notes'));
    const notes = snap.docs.map((d) => d.data() as Note);
    return [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  },
  async addNote(note) {
    const id = createId();
    const created: Note = { id, ...note };
    await setDoc(doc(groupCol('notes'), id), stripUndefined(created));
    return created;
  },
  async updateNote(note) {
    await setDoc(doc(groupCol('notes'), note.id), stripUndefined(note));
  },
  async deleteNote(id) {
    await deleteDoc(doc(groupCol('notes'), id));
  },

  async listAssets() {
    const snap = await getDocs(groupCol('assets'));
    const assets = snap.docs.map((d) => d.data() as Asset);
    return [...assets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async addAsset(asset) {
    const id = createId();
    const created: Asset = { id, ...asset };
    await setDoc(doc(groupCol('assets'), id), stripUndefined(created));
    return created;
  },
  async updateAsset(asset) {
    await setDoc(doc(groupCol('assets'), asset.id), stripUndefined(asset));
  },
  async deleteAsset(id) {
    await deleteDoc(doc(groupCol('assets'), id));
  },

  async reset() {
    for (const k of ['categories', 'transactions', 'shoppingItems', 'notes', 'assets'] as const) {
      const snap = await getDocs(groupCol(k));
      const batch = writeBatch(getDb());
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await this.init();
  },
};

export async function readGroupName(id: string): Promise<string | null> {
  const snap = await getDoc(doc(getDb(), 'groups', id));
  if (!snap.exists()) return null;
  return (snap.data() as { name?: string }).name ?? null;
}

export async function noopFirestoreTouch(): Promise<void> {
  // Keeps addDoc reference live so tree-shaking doesn't drop it in case we
  // later add append-only collections without setDoc.
  void addDoc;
}
