import * as SQLite from 'expo-sqlite';
import { GroupSettings, Member, CustomColumn, PaymentRecord, Expense, MONTH_KEYS } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('circle_fund.db');
  await initDatabase(dbInstance);
  return dbInstance;
}

export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS group_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      group_name TEXT NOT NULL,
      currency_symbol TEXT NOT NULL,
      active_year INTEGER NOT NULL,
      default_membership_fee REAL NOT NULL,
      default_monthly_contribution REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sr_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone_number TEXT,
      avatar_initials TEXT,
      role TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      status_reason TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS custom_columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      column_key TEXT UNIQUE NOT NULL,
      column_label TEXT NOT NULL,
      default_amount REAL NOT NULL,
      sort_order INTEGER NOT NULL,
      is_enabled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      year INTEGER NOT NULL,
      amount_paid REAL NOT NULL DEFAULT 0,
      target_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'unpaid',
      payment_date TEXT,
      payment_method TEXT,
      notes TEXT,
      UNIQUE(member_id, item_key, year),
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      expense_date TEXT NOT NULL,
      year INTEGER NOT NULL DEFAULT 2026,
      recorded_by TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS financial_years (
      year INTEGER PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'open',
      opening_balance REAL NOT NULL DEFAULT 0,
      total_income REAL NOT NULL DEFAULT 0,
      total_expenses REAL NOT NULL DEFAULT 0,
      closing_balance REAL NOT NULL DEFAULT 0,
      closed_at TEXT,
      closed_by TEXT,
      notes TEXT
    );
  `);

  // Migration: Add status & status_reason columns if members table exists from earlier
  try {
    await db.execAsync(`ALTER TABLE members ADD COLUMN status TEXT NOT NULL DEFAULT 'active';`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE members ADD COLUMN status_reason TEXT;`);
  } catch {}

  // Migration: Add year column to expenses if missing
  try {
    await db.execAsync(`ALTER TABLE expenses ADD COLUMN year INTEGER NOT NULL DEFAULT 2026;`);
  } catch {}

  // Migration: Backfill expenses year based on expense_date if 0 or null
  try {
    await db.execAsync(`UPDATE expenses SET year = CAST(substr(expense_date, 1, 4) AS INTEGER) WHERE year IS NULL OR year = 0;`);
  } catch {}

  // Migration: Ensure default target for membership and monthly contribution is 5000
  try {
    await db.execAsync(`UPDATE group_settings SET default_membership_fee = 5000, default_monthly_contribution = 5000 WHERE default_monthly_contribution = 10000 OR default_membership_fee = 50;`);
  } catch {}

  // Initialize group settings if empty
  const settings = await db.getFirstAsync<GroupSettings>(`SELECT * FROM group_settings WHERE id = 1`);
  if (!settings) {
    await db.runAsync(`
      INSERT INTO group_settings (id, group_name, currency_symbol, active_year, default_membership_fee, default_monthly_contribution)
      VALUES (1, 'Sahodari Circle Fund', 'MWK ', 2026, 5000, 5000);
    `);

    // Seed default custom columns
    await db.runAsync(`
      INSERT INTO custom_columns (column_key, column_label, default_amount, sort_order, is_enabled)
      VALUES 
        ('col_welfare', 'Welfare', 5000, 1, 1),
        ('col_party', 'End Year Party', 5000, 2, 0);
    `);
  } else if (settings.currency_symbol !== 'MWK ') {
    await db.runAsync(`UPDATE group_settings SET currency_symbol = 'MWK ' WHERE id = 1`);
  }
}
