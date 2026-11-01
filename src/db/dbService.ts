import { getDatabase } from './index';
import { GroupSettings, Member, CustomColumn, PaymentRecord, Expense, MemberStatus } from '../types';

export const DbService = {
  async getSettings(): Promise<GroupSettings> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<GroupSettings>('SELECT * FROM group_settings WHERE id = 1');
    return row!;
  },

  async updateSettings(settings: Partial<GroupSettings>): Promise<void> {
    const db = await getDatabase();
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await db.runAsync(
      `UPDATE group_settings SET group_name = ?, currency_symbol = ?, active_year = ?, default_membership_fee = ?, default_monthly_contribution = ? WHERE id = 1`,
      [updated.group_name, updated.currency_symbol, updated.active_year, updated.default_membership_fee, updated.default_monthly_contribution]
    );
  },

  async getMembers(): Promise<Member[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Member>('SELECT * FROM members WHERE is_active = 1 ORDER BY sr_number ASC');
  },

  async addMember(name: string, phone: string, role?: string): Promise<Member> {
    const db = await getDatabase();
    const maxSrRow = await db.getFirstAsync<{ maxSr: number | null }>('SELECT MAX(sr_number) as maxSr FROM members');
    const nextSr = (maxSrRow?.maxSr || 0) + 1;
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const result = await db.runAsync(
      'INSERT INTO members (sr_number, name, phone_number, avatar_initials, role, status, is_active) VALUES (?, ?, ?, ?, ?, "active", 1)',
      [nextSr, name, phone, initials, role || 'Member']
    );

    const settings = await this.getSettings();
    // Default membership fee
    await db.runAsync(
      'INSERT INTO payments (member_id, item_key, year, amount_paid, target_amount, status) VALUES (?, "fee", ?, 0, ?, "unpaid")',
      [result.lastInsertRowId, settings.active_year, settings.default_membership_fee]
    );

    return {
      id: result.lastInsertRowId,
      sr_number: nextSr,
      name,
      phone_number: phone,
      avatar_initials: initials,
      role: role || 'Member',
      status: 'active',
      is_active: 1
    };
  },

  async updateMember(
    id: number,
    data: { name?: string; phone_number?: string; role?: string; status?: MemberStatus; status_reason?: string }
  ): Promise<void> {
    const db = await getDatabase();
    const current = await db.getFirstAsync<Member>('SELECT * FROM members WHERE id = ?', [id]);
    if (!current) return;

    const newName = data.name !== undefined ? data.name : current.name;
    const newPhone: string | null = data.phone_number !== undefined ? (data.phone_number ?? null) : (current.phone_number ?? null);
    const newRole: string | null = data.role !== undefined ? (data.role ?? null) : (current.role ?? null);
    const newStatus = data.status !== undefined ? data.status : (current.status || 'active');
    const newReason = data.status_reason !== undefined ? data.status_reason : current.status_reason;
    const initials = newName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    await db.runAsync(
      'UPDATE members SET name = ?, phone_number = ?, role = ?, status = ?, status_reason = ?, avatar_initials = ? WHERE id = ?',
      [newName, newPhone, newRole, newStatus, newReason || '', initials, id]
    );
  },

  async deleteMember(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM payments WHERE member_id = ?', [id]);
    await db.runAsync('DELETE FROM members WHERE id = ?', [id]);
  },

  async getCustomColumns(): Promise<CustomColumn[]> {
    const db = await getDatabase();
    return await db.getAllAsync<CustomColumn>('SELECT * FROM custom_columns ORDER BY sort_order ASC');
  },

  async addCustomColumn(label: string, defaultAmount: number): Promise<CustomColumn> {
    const db = await getDatabase();
    const key = `col_${Date.now()}`;
    const maxOrder = await db.getFirstAsync<{ maxOrder: number | null }>('SELECT MAX(sort_order) as maxOrder FROM custom_columns');
    const nextOrder = (maxOrder?.maxOrder || 0) + 1;

    const res = await db.runAsync(
      'INSERT INTO custom_columns (column_key, column_label, default_amount, sort_order, is_enabled) VALUES (?, ?, ?, ?, 1)',
      [key, label, defaultAmount, nextOrder]
    );

    return {
      id: res.lastInsertRowId,
      column_key: key,
      column_label: label,
      default_amount: defaultAmount,
      sort_order: nextOrder,
      is_enabled: 1
    };
  },

  async toggleCustomColumn(id: number, isEnabled: boolean): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE custom_columns SET is_enabled = ? WHERE id = ?', [isEnabled ? 1 : 0, id]);
  },

  async deleteCustomColumn(id: number): Promise<void> {
    const db = await getDatabase();
    const col = await db.getFirstAsync<CustomColumn>('SELECT * FROM custom_columns WHERE id = ?', [id]);
    if (col) {
      await db.runAsync('DELETE FROM payments WHERE item_key = ?', [col.column_key]);
      await db.runAsync('DELETE FROM custom_columns WHERE id = ?', [id]);
    }
  },

  async reorderCustomColumn(id: number, direction: 'up' | 'down'): Promise<void> {
    const db = await getDatabase();
    const columns = await this.getCustomColumns();
    const index = columns.findIndex(c => c.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;

    const current = columns[index];
    const swap = columns[targetIndex];

    await db.runAsync('UPDATE custom_columns SET sort_order = ? WHERE id = ?', [swap.sort_order, current.id]);
    await db.runAsync('UPDATE custom_columns SET sort_order = ? WHERE id = ?', [current.sort_order, swap.id]);
  },

  async getPayments(year: number): Promise<PaymentRecord[]> {
    const db = await getDatabase();
    return await db.getAllAsync<PaymentRecord>('SELECT * FROM payments WHERE year = ?', [year]);
  },

  async setPayment(memberId: number, itemKey: string, year: number, amount: number, targetAmount: number): Promise<void> {
    const db = await getDatabase();
    const status = amount >= targetAmount && targetAmount > 0 ? 'paid' : amount > 0 ? 'partial' : 'unpaid';
    const now = new Date().toISOString().split('T')[0];

    await db.runAsync(`
      INSERT INTO payments (member_id, item_key, year, amount_paid, target_amount, status, payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(member_id, item_key, year) DO UPDATE SET
        amount_paid = excluded.amount_paid,
        target_amount = excluded.target_amount,
        status = excluded.status,
        payment_date = excluded.payment_date
    `, [memberId, itemKey, year, amount, targetAmount, status, now]);
  },

  async getExpenses(): Promise<Expense[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY expense_date DESC, id DESC');
  },

  async addExpense(title: string, amount: number, category: string, date: string, recordedBy?: string, notes?: string): Promise<Expense> {
    const db = await getDatabase();
    const res = await db.runAsync(
      'INSERT INTO expenses (title, amount, category, expense_date, recorded_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [title, amount, category, date, recordedBy || '', notes || '']
    );
    return {
      id: res.lastInsertRowId,
      title,
      amount,
      category,
      expense_date: date,
      recorded_by: recordedBy,
      notes
    };
  },

  async deleteExpense(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
  },

  async backupData(): Promise<string> {
    const db = await getDatabase();
    const settings = await this.getSettings();
    const members = await db.getAllAsync<Member>('SELECT * FROM members');
    const customColumns = await db.getAllAsync<CustomColumn>('SELECT * FROM custom_columns');
    const payments = await db.getAllAsync<PaymentRecord>('SELECT * FROM payments');
    const expenses = await db.getAllAsync<Expense>('SELECT * FROM expenses');

    const payload = {
      version: 1,
      backupDate: new Date().toISOString(),
      groupName: settings.group_name,
      activeYear: settings.active_year,
      data: {
        settings,
        members,
        customColumns,
        payments,
        expenses,
      },
    };

    return JSON.stringify(payload, null, 2);
  },

  async restoreData(jsonString: string): Promise<void> {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.data) {
      throw new Error('Invalid backup file format');
    }

    const { settings, members, customColumns, payments, expenses } = parsed.data;
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      // Clear current data
      await db.runAsync('DELETE FROM payments');
      await db.runAsync('DELETE FROM expenses');
      await db.runAsync('DELETE FROM members');
      await db.runAsync('DELETE FROM custom_columns');

      // Restore Settings
      if (settings) {
        await db.runAsync(
          `UPDATE group_settings SET group_name = ?, currency_symbol = ?, active_year = ?, default_membership_fee = ?, default_monthly_contribution = ? WHERE id = 1`,
          [settings.group_name, settings.currency_symbol || 'MWK ', settings.active_year || 2026, settings.default_membership_fee || 5000, settings.default_monthly_contribution || 5000]
        );
      }

      // Restore Members
      if (Array.isArray(members)) {
        for (const m of members) {
          await db.runAsync(
            `INSERT INTO members (id, sr_number, name, phone_number, avatar_initials, role, status, status_reason, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [m.id, m.sr_number, m.name, m.phone_number ?? null, m.avatar_initials, m.role || 'Member', m.status || 'active', m.status_reason ?? null, m.is_active ?? 1]
          );
        }
      }

      // Restore Custom Columns
      if (Array.isArray(customColumns)) {
        for (const c of customColumns) {
          await db.runAsync(
            `INSERT INTO custom_columns (id, column_key, column_label, default_amount, sort_order, is_enabled)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [c.id, c.column_key, c.column_label, c.default_amount, c.sort_order, c.is_enabled]
          );
        }
      }

      // Restore Payments
      if (Array.isArray(payments)) {
        for (const p of payments) {
          await db.runAsync(
            `INSERT INTO payments (id, member_id, item_key, year, amount_paid, target_amount, status, payment_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.id, p.member_id, p.item_key, p.year, p.amount_paid, p.target_amount, p.status, p.payment_date]
          );
        }
      }

      // Restore Expenses
      if (Array.isArray(expenses)) {
        for (const e of expenses) {
          await db.runAsync(
            `INSERT INTO expenses (id, title, amount, category, expense_date, recorded_by, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [e.id, e.title, e.amount, e.category, e.expense_date, e.recorded_by ?? '', e.notes ?? '']
          );
        }
      }
    });
  }
};
