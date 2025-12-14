import * as SQLite from "expo-sqlite";

export interface ExtractedExpense {
  id?: number;
  amount: number;
  merchant: string;
  originalMessage: string;
  timestamp: string;
  date: string; // Store as ISO string for SQLite compatibility
}

class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync("expenses.db");

      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          merchant TEXT NOT NULL,
          originalMessage TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          date TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create index for better query performance
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
      `);

      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  async insertExpense(expense: Omit<ExtractedExpense, "id">): Promise<number> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Basic deduplication: skip insert if an expense with the same originalMessage already exists
      const orig = (expense.originalMessage || "").trim();
      if (orig.length > 0) {
        const existing = await this.db.getFirstAsync(
          `SELECT id FROM expenses WHERE originalMessage = ? LIMIT 1`,
          [orig]
        );

        if (existing && (existing as any).id) {
          console.log(
            "Duplicate expense detected, skipping insert. Existing ID:",
            (existing as any).id
          );
          return (existing as any).id;
        }
      }
      const result = await this.db.runAsync(
        `INSERT INTO expenses (amount, merchant, originalMessage, timestamp, date) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          expense.amount,
          expense.merchant,
          expense.originalMessage,
          expense.timestamp,
          expense.date,
        ]
      );

      console.log("Expense inserted with ID:", result.lastInsertRowId);
      return result.lastInsertRowId;
    } catch (error) {
      console.error("Error inserting expense:", error);
      throw error;
    }
  }

  async getAllExpenses(): Promise<ExtractedExpense[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.getAllAsync(
        "SELECT * FROM expenses ORDER BY created_at DESC LIMIT 100"
      );

      return result.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        merchant: row.merchant,
        originalMessage: row.originalMessage,
        timestamp: row.timestamp,
        date: row.date,
      }));
    } catch (error) {
      console.error("Error fetching expenses:", error);
      throw error;
    }
  }

  async getExpensesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ExtractedExpense[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.getAllAsync(
        "SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY created_at DESC",
        [startDate, endDate]
      );

      return result.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        merchant: row.merchant,
        originalMessage: row.originalMessage,
        timestamp: row.timestamp,
        date: row.date,
      }));
    } catch (error) {
      console.error("Error fetching expenses by date range:", error);
      throw error;
    }
  }

  async getMonthlyExpenses(
    year: number,
    month: number
  ): Promise<ExtractedExpense[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Create date range for the month
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      return await this.getExpensesByDateRange(startDate, endDate);
    } catch (error) {
      console.error("Error fetching monthly expenses:", error);
      throw error;
    }
  }

  async deleteExpense(id: number): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      await this.db.runAsync("DELETE FROM expenses WHERE id = ?", [id]);
      console.log("Expense deleted with ID:", id);
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  }

  async clearAllExpenses(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      await this.db.runAsync("DELETE FROM expenses");
      console.log("All expenses cleared");
    } catch (error) {
      console.error("Error clearing expenses:", error);
      throw error;
    }
  }

  async getExpenseCount(): Promise<number> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.getFirstAsync(
        "SELECT COUNT(*) as count FROM expenses"
      );
      return (result as any)?.count || 0;
    } catch (error) {
      console.error("Error getting expense count:", error);
      throw error;
    }
  }

  async getTotalExpenseAmount(): Promise<number> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.getFirstAsync(
        "SELECT SUM(amount) as total FROM expenses"
      );
      return (result as any)?.total || 0;
    } catch (error) {
      console.error("Error getting total expense amount:", error);
      throw error;
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log("Database closed");
    }
  }
}

// Create a singleton instance
export const databaseManager = new DatabaseManager();
