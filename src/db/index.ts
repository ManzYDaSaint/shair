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
      recorded_by TEXT,
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
        ('col_welfare', 'Welfare', 10, 1, 1),
        ('col_party', 'End Year Party', 25, 2, 0);
    `);

    // Seed initial members matching the template
    const initialMembers = [
      { sr: 1, name: 'Priya Sharma', phone: '+1 555-0148', role: 'Treasurer', initials: 'PS' },
      { sr: 2, name: 'Fatima Noor', phone: '+1 555-0903', role: 'Elder', initials: 'FN' },
      { sr: 3, name: 'Elena Rostova', phone: '+1 555-0192', role: 'Member', initials: 'ER' },
      { sr: 4, name: 'Grace Mutua', phone: '+1 555-0119', role: 'Member', initials: 'GM' },
      { sr: 5, name: 'Ananya Roy', phone: '+1 555-0234', role: 'Secretary', initials: 'AR' },
      { sr: 6, name: 'Amara Okafor', phone: '+1 555-0144', role: 'Member', initials: 'AO' },
      { sr: 7, name: 'Sunita Rao', phone: '+1 555-0812', role: 'Member', initials: 'SR' },
    ];

    for (const m of initialMembers) {
      const res = await db.runAsync(
        `INSERT INTO members (sr_number, name, phone_number, avatar_initials, role, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
        [m.sr, m.name, m.phone, m.initials, m.role]
      );
      const memberId = res.lastInsertRowId;

      // Seed Membership Fee
      await db.runAsync(
        `INSERT INTO payments (member_id, item_key, year, amount_paid, target_amount, status) VALUES (?, 'fee', 2025, ?, 50, 'paid')`,
        [memberId, 50]
      );

      // Seed Jan, Feb, Mar as paid
      for (const month of ['jan', 'feb', 'mar']) {
        await db.runAsync(
          `INSERT INTO payments (member_id, item_key, year, amount_paid, target_amount, status) VALUES (?, ?, 2025, 100, 100, 'paid')`,
          [memberId, month]
        );
      }

      // Seed April: some paid, some due
      const isDue = m.sr === 3 || m.sr === 5;
      await db.runAsync(
        `INSERT INTO payments (member_id, item_key, year, amount_paid, target_amount, status) VALUES (?, 'apr', 2025, ?, 100, ?)`,
        [memberId, isDue ? 0 : 100, isDue ? 'unpaid' : 'paid']
      );

      // Seed Welfare
      await db.runAsync(
        `INSERT INTO payments (member_id, item_key, year, amount_paid, target_amount, status) VALUES (?, 'col_welfare', 2025, 10, 10, 'paid')`,
        [memberId]
      );
    }

    // Seed realistic sample expenses
    await db.runAsync(`
      INSERT INTO expenses (title, amount, category, expense_date, recorded_by, notes)
      VALUES 
        ('Hall B Rental & Chairs', 12000, 'Venue', '2025-04-14', 'Priya Sharma', 'April Meeting Space'),
        ('Refreshments & Tea', 4500, 'Refreshments', '2025-04-14', 'Fatima Noor', 'Snacks and water bottles'),
        ('Ledger Book & Stationery', 2500, 'Supplies', '2025-03-10', 'Ananya Roy', 'Receipt pads and pens');
    `);
  } else if (settings.currency_symbol !== 'MWK ') {
    await db.runAsync(`UPDATE group_settings SET currency_symbol = 'MWK ' WHERE id = 1`);
  }
}
