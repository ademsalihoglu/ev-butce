import * as SQLite from 'expo-sqlite';
import { Category, Note, Repository, ShoppingItem, Transaction } from './types';
import { createId, defaultCategories } from './seed';

let scope: string | null = null;
let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbForScope: string | null = null;

function dbName(): string {
  return `ev_butce_${scope ?? 'anon'}.db`;
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance || dbForScope !== scope) {
    dbInstance = await SQLite.openDatabaseAsync(dbName());
    dbForScope = scope;
  }
  return dbInstance;
}

export const repository: Repository = {
  setScope(next: string | null) {
    scope = next;
    dbInstance = null;
    dbForScope = null;
  },

  async init() {
    const db = await getDb();
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        type TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        type TEXT NOT NULL,
        noteId TEXT
      );
      CREATE TABLE IF NOT EXISTS shopping_items (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        estimatedPrice REAL NOT NULL,
        note TEXT NOT NULL,
        bought INTEGER NOT NULL,
        convertedTransactionId TEXT,
        createdAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        pinned INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        linkedTransactionId TEXT,
        linkedDate TEXT
      );
    `);
    // Best-effort migration for an older DB that predates the noteId column.
    try {
      await db.execAsync('ALTER TABLE transactions ADD COLUMN noteId TEXT');
    } catch {
      // column already exists — ignore
    }
    const countRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories'
    );
    if (!countRow || countRow.count === 0) {
      for (const cat of defaultCategories) {
        await db.runAsync(
          'INSERT INTO categories (id, name, color, icon, type) VALUES (?, ?, ?, ?, ?)',
          [createId(), cat.name, cat.color, cat.icon, cat.type]
        );
      }
    }
  },

  async listCategories() {
    const db = await getDb();
    return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY type DESC, name ASC');
  },

  async addCategory(category) {
    const db = await getDb();
    const id = createId();
    await db.runAsync(
      'INSERT INTO categories (id, name, color, icon, type) VALUES (?, ?, ?, ?, ?)',
      [id, category.name, category.color, category.icon, category.type]
    );
    return { id, ...category };
  },

  async updateCategory(category) {
    const db = await getDb();
    await db.runAsync(
      'UPDATE categories SET name = ?, color = ?, icon = ?, type = ? WHERE id = ?',
      [category.name, category.color, category.icon, category.type, category.id]
    );
  },

  async deleteCategory(id) {
    const db = await getDb();
    await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  },

  async listTransactions() {
    const db = await getDb();
    return db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC');
  },

  async addTransaction(tx) {
    const db = await getDb();
    const id = createId();
    await db.runAsync(
      'INSERT INTO transactions (id, amount, description, date, categoryId, type, noteId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, tx.amount, tx.description, tx.date, tx.categoryId, tx.type, tx.noteId ?? null]
    );
    return { id, ...tx };
  },

  async updateTransaction(tx) {
    const db = await getDb();
    await db.runAsync(
      'UPDATE transactions SET amount = ?, description = ?, date = ?, categoryId = ?, type = ?, noteId = ? WHERE id = ?',
      [tx.amount, tx.description, tx.date, tx.categoryId, tx.type, tx.noteId ?? null, tx.id]
    );
  },

  async deleteTransaction(id) {
    const db = await getDb();
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  },

  async listShoppingItems() {
    const db = await getDb();
    const rows = await db.getAllAsync<Omit<ShoppingItem, 'bought'> & { bought: number }>(
      'SELECT * FROM shopping_items ORDER BY bought ASC, createdAt DESC'
    );
    return rows.map((r) => ({ ...r, bought: Boolean(r.bought) }));
  },

  async addShoppingItem(item) {
    const db = await getDb();
    const id = createId();
    await db.runAsync(
      'INSERT INTO shopping_items (id, name, quantity, unit, categoryId, estimatedPrice, note, bought, convertedTransactionId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        item.name,
        item.quantity,
        item.unit,
        item.categoryId,
        item.estimatedPrice,
        item.note,
        item.bought ? 1 : 0,
        item.convertedTransactionId ?? null,
        item.createdAt,
      ]
    );
    return { id, ...item };
  },

  async updateShoppingItem(item) {
    const db = await getDb();
    await db.runAsync(
      'UPDATE shopping_items SET name = ?, quantity = ?, unit = ?, categoryId = ?, estimatedPrice = ?, note = ?, bought = ?, convertedTransactionId = ? WHERE id = ?',
      [
        item.name,
        item.quantity,
        item.unit,
        item.categoryId,
        item.estimatedPrice,
        item.note,
        item.bought ? 1 : 0,
        item.convertedTransactionId ?? null,
        item.id,
      ]
    );
  },

  async deleteShoppingItem(id) {
    const db = await getDb();
    await db.runAsync('DELETE FROM shopping_items WHERE id = ?', [id]);
  },

  async listNotes() {
    const db = await getDb();
    const rows = await db.getAllAsync<Omit<Note, 'pinned'> & { pinned: number }>(
      'SELECT * FROM notes ORDER BY pinned DESC, updatedAt DESC'
    );
    return rows.map((r) => ({ ...r, pinned: Boolean(r.pinned) }));
  },

  async addNote(note) {
    const db = await getDb();
    const id = createId();
    await db.runAsync(
      'INSERT INTO notes (id, title, body, pinned, createdAt, updatedAt, linkedTransactionId, linkedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        note.title,
        note.body,
        note.pinned ? 1 : 0,
        note.createdAt,
        note.updatedAt,
        note.linkedTransactionId ?? null,
        note.linkedDate ?? null,
      ]
    );
    return { id, ...note };
  },

  async updateNote(note) {
    const db = await getDb();
    await db.runAsync(
      'UPDATE notes SET title = ?, body = ?, pinned = ?, updatedAt = ?, linkedTransactionId = ?, linkedDate = ? WHERE id = ?',
      [
        note.title,
        note.body,
        note.pinned ? 1 : 0,
        note.updatedAt,
        note.linkedTransactionId ?? null,
        note.linkedDate ?? null,
        note.id,
      ]
    );
  },

  async deleteNote(id) {
    const db = await getDb();
    await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
  },

  async reset() {
    const db = await getDb();
    await db.execAsync(
      'DELETE FROM transactions; DELETE FROM categories; DELETE FROM shopping_items; DELETE FROM notes;'
    );
    for (const cat of defaultCategories) {
      await db.runAsync(
        'INSERT INTO categories (id, name, color, icon, type) VALUES (?, ?, ?, ?, ?)',
        [createId(), cat.name, cat.color, cat.icon, cat.type]
      );
    }
  },
};
