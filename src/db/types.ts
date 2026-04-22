export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  type: TransactionType;
  noteId?: string | null;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  categoryId: string;
  estimatedPrice: number;
  note: string;
  bought: boolean;
  convertedTransactionId?: string | null;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  linkedTransactionId?: string | null;
  linkedDate?: string | null;
}

export interface Repository {
  /** Set the per-user namespace. Must be called before init(). Null → signed out / anonymous. */
  setScope(scope: string | null): void;
  init(): Promise<void>;
  listCategories(): Promise<Category[]>;
  addCategory(category: Omit<Category, 'id'>): Promise<Category>;
  updateCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  listTransactions(): Promise<Transaction[]>;
  addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction>;
  updateTransaction(tx: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  listShoppingItems(): Promise<ShoppingItem[]>;
  addShoppingItem(item: Omit<ShoppingItem, 'id'>): Promise<ShoppingItem>;
  updateShoppingItem(item: ShoppingItem): Promise<void>;
  deleteShoppingItem(id: string): Promise<void>;
  listNotes(): Promise<Note[]>;
  addNote(note: Omit<Note, 'id'>): Promise<Note>;
  updateNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  reset(): Promise<void>;
}
