import * as SQLite from 'expo-sqlite';

export interface Expense {
  id?: number;
  amount: number;
  category: string;
  description?: string;
  date: string;
  sms_content?: string;
  is_categorized: boolean;
  created_at: string;
}

export interface Category {
  id?: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    if (this.db) return this.db;
    
    this.db = await SQLite.openDatabaseAsync('expenses.db');
    await this.createTables();
    await this.insertDefaultCategories();
    return this.db;
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        sms_content TEXT,
        is_categorized INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  private async insertDefaultCategories() {
    if (!this.db) throw new Error('Database not initialized');

    const defaultCategories = [
      { name: 'Food & Dining', color: '#FF6B6B', icon: 'utensils' },
      { name: 'Transportation', color: '#4ECDC4', icon: 'car' },
      { name: 'Shopping', color: '#45B7D1', icon: 'shopping-bag' },
      { name: 'Entertainment', color: '#96CEB4', icon: 'film' },
      { name: 'Bills & Utilities', color: '#FFEAA7', icon: 'receipt' },
      { name: 'Healthcare', color: '#DDA0DD', icon: 'heart' },
      { name: 'Education', color: '#98D8C8', icon: 'book' },
      { name: 'Other', color: '#F7DC6F', icon: 'more-horizontal' },
    ];

    for (const category of defaultCategories) {
      try {
        await this.db.runAsync(
          'INSERT OR IGNORE INTO categories (name, color, icon) VALUES (?, ?, ?)',
          [category.name, category.color, category.icon]
        );
      } catch (error) {
        console.log('Category already exists:', category.name);
      }
    }
  }

  async addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<number> {
    if (!this.db) await this.init();
    
    const result = await this.db!.runAsync(
      'INSERT INTO expenses (amount, category, description, date, sms_content, is_categorized) VALUES (?, ?, ?, ?, ?, ?)',
      [expense.amount, expense.category, expense.description || '', expense.date, expense.sms_content || '', expense.is_categorized ? 1 : 0]
    );
    
    return result.lastInsertRowId;
  }

  async getExpenses(limit?: number): Promise<Expense[]> {
    if (!this.db) await this.init();
    
    const query = limit 
      ? 'SELECT * FROM expenses ORDER BY created_at DESC LIMIT ?'
      : 'SELECT * FROM expenses ORDER BY created_at DESC';
    
    const result = limit 
      ? await this.db!.getAllAsync(query, [limit])
      : await this.db!.getAllAsync(query);
    
    return result.map(row => ({
      ...row,
      is_categorized: Boolean(row.is_categorized)
    })) as Expense[];
  }

  async getUncategorizedExpenses(): Promise<Expense[]> {
    if (!this.db) await this.init();
    
    const result = await this.db!.getAllAsync(
      'SELECT * FROM expenses WHERE is_categorized = 0 ORDER BY created_at DESC'
    );
    
    return result.map(row => ({
      ...row,
      is_categorized: Boolean(row.is_categorized)
    })) as Expense[];
  }

  async updateExpense(id: number, updates: Partial<Expense>): Promise<void> {
    if (!this.db) await this.init();
    
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await this.db!.runAsync(
      `UPDATE expenses SET ${fields} WHERE id = ?`,
      [...values, id]
    );
  }

  async deleteExpense(id: number): Promise<void> {
    if (!this.db) await this.init();
    
    await this.db!.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
  }

  async getCategories(): Promise<Category[]> {
    if (!this.db) await this.init();
    
    const result = await this.db!.getAllAsync('SELECT * FROM categories ORDER BY name');
    return result as Category[];
  }

  async addCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<number> {
    if (!this.db) await this.init();
    
    const result = await this.db!.runAsync(
      'INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)',
      [category.name, category.color, category.icon]
    );
    
    return result.lastInsertRowId;
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    if (!this.db) await this.init();
    
    const result = await this.db!.getAllAsync(
      'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [startDate, endDate]
    );
    
    return result.map(row => ({
      ...row,
      is_categorized: Boolean(row.is_categorized)
    })) as Expense[];
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    if (!this.db) await this.init();
    
    const result = await this.db!.getAllAsync(
      'SELECT * FROM expenses WHERE category = ? ORDER BY date DESC',
      [category]
    );
    
    return result.map(row => ({
      ...row,
      is_categorized: Boolean(row.is_categorized)
    })) as Expense[];
  }

  async getTotalExpensesByCategory(): Promise<{ category: string; total: number; color: string }[]> {
    if (!this.db) await this.init();
    
    const result = await this.db!.getAllAsync(`
      SELECT 
        e.category,
        SUM(e.amount) as total,
        c.color
      FROM expenses e
      LEFT JOIN categories c ON e.category = c.name
      WHERE e.is_categorized = 1
      GROUP BY e.category
      ORDER BY total DESC
    `);
    
    return result as { category: string; total: number; color: string }[];
  }
}

export const database = new DatabaseManager();