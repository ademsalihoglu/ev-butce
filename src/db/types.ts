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
}

export interface Repository {
  init(): Promise<void>;
  listCategories(): Promise<Category[]>;
  addCategory(category: Omit<Category, 'id'>): Promise<Category>;
  updateCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  listTransactions(): Promise<Transaction[]>;
  addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction>;
  updateTransaction(tx: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  reset(): Promise<void>;
}
