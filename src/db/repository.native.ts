import * as SQLite from 'expo-sqlite';
import { Category, Repository, Transaction } from './types';
import { createId, defaultCategories } from './seed';

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('ev_butce.db');
  }
  return dbInstance;
}

export const repository: Repository = {
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
        type TEXT NOT NULL
      );
    `);
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
      'INSERT INTO transactions (id, amount, description, date, categoryId, type) VALUES (?, ?, ?, ?, ?, ?)',
      [id, tx.amount, tx.description, tx.date, tx.categoryId, tx.type]
    );
    return { id, ...tx };
  },

  async updateTransaction(tx) {
    const db = await getDb();
    await db.runAsync(
      'UPDATE transactions SET amount = ?, description = ?, date = ?, categoryId = ?, type = ? WHERE id = ?',
      [tx.amount, tx.description, tx.date, tx.categoryId, tx.type, tx.id]
    );
  },

  async deleteTransaction(id) {
    const db = await getDb();
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  },

  async reset() {
    const db = await getDb();
    await db.execAsync('DELETE FROM transactions; DELETE FROM categories;');
    for (const cat of defaultCategories) {
      await db.runAsync(
        'INSERT INTO categories (id, name, color, icon, type) VALUES (?, ?, ?, ?, ?)',
        [createId(), cat.name, cat.color, cat.icon, cat.type]
      );
    }
  },
};
