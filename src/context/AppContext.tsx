import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { GroupSettings, Member, CustomColumn, PaymentRecord, Expense, MONTH_KEYS, MemberStatus } from '../types';
import { DbService } from '../db/dbService';

interface AppContextType {
  loading: boolean;
  settings: GroupSettings | null;
  members: Member[];
  customColumns: CustomColumn[];
  payments: PaymentRecord[];
  expenses: Expense[];
  
  // Computed Financial Totals
  totalIncome: number;          // Total of all contributions, fees, custom columns
  totalExpenses: number;        // Sum of all group expenses
  netBalance: number;           // totalIncome - totalExpenses
  
  // Helpers
  refreshAll: () => Promise<void>;
  updateGroupSettings: (updated: Partial<GroupSettings>) => Promise<void>;
  addMember: (name: string, phone: string, role?: string) => Promise<void>;
  updateMember: (id: number, data: { name?: string; phone_number?: string; role?: string; status?: MemberStatus; status_reason?: string }) => Promise<void>;
  deleteMember: (id: number) => Promise<void>;
  addCustomColumn: (label: string, defaultAmount: number) => Promise<void>;
  toggleCustomColumn: (id: number, enabled: boolean) => Promise<void>;
  reorderCustomColumn: (id: number, direction: 'up' | 'down') => Promise<void>;
  deleteCustomColumn: (id: number) => Promise<void>;
  recordPayment: (memberId: number, itemKey: string, amount: number, targetAmount: number) => Promise<void>;
  addExpense: (title: string, amount: number, category: string, date: string, recordedBy?: string, notes?: string) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  backupData: () => Promise<string>;
  restoreData: (jsonString: string) => Promise<void>;
  
  // Lookup helpers
  getPaymentForCell: (memberId: number, itemKey: string) => PaymentRecord | undefined;
  getMemberRowTotal: (memberId: number) => { paid: number; target: number; balance: number };
  getColumnTotal: (itemKey: string) => number;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<GroupSettings | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const refreshAll = useCallback(async () => {
    try {
      const s = await DbService.getSettings();
      const m = await DbService.getMembers();
      const c = await DbService.getCustomColumns();
      const p = await DbService.getPayments(s.active_year);
      const e = await DbService.getExpenses();

      setSettings(s);
      setMembers(m);
      setCustomColumns(c);
      setPayments(p);
      setExpenses(e);
    } catch (err) {
      console.error('Failed to load local SQLite data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Lookup helper for quick access in table
  const paymentMap = useMemo(() => {
    const map = new Map<string, PaymentRecord>();
    for (const p of payments) {
      map.set(`${p.member_id}_${p.item_key}`, p);
    }
    return map;
  }, [payments]);

  const getPaymentForCell = useCallback((memberId: number, itemKey: string) => {
    return paymentMap.get(`${memberId}_${itemKey}`);
  }, [paymentMap]);

  // Calculations
  const totalIncome = useMemo(() => {
    return payments.reduce((acc, p) => acc + (p.amount_paid || 0), 0);
  }, [payments]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [expenses]);

  const netBalance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  const getMemberRowTotal = useCallback((memberId: number) => {
    const memberPayments = payments.filter(p => p.member_id === memberId);
    const paid = memberPayments.reduce((acc, p) => acc + (p.amount_paid || 0), 0);
    const target = memberPayments.reduce((acc, p) => acc + (p.target_amount || 0), 0);
    return {
      paid,
      target,
      balance: Math.max(0, target - paid),
    };
  }, [payments]);

  const getColumnTotal = useCallback((itemKey: string) => {
    return payments
      .filter(p => p.item_key === itemKey)
      .reduce((acc, p) => acc + (p.amount_paid || 0), 0);
  }, [payments]);

  const updateGroupSettings = async (updated: Partial<GroupSettings>) => {
    await DbService.updateSettings(updated);
    await refreshAll();
  };

  const addMember = async (name: string, phone: string, role?: string) => {
    await DbService.addMember(name, phone, role);
    await refreshAll();
  };

  const updateMember = async (
    id: number,
    data: { name?: string; phone_number?: string; role?: string; status?: MemberStatus; status_reason?: string }
  ) => {
    await DbService.updateMember(id, data);
    await refreshAll();
  };

  const deleteMember = async (id: number) => {
    await DbService.deleteMember(id);
    await refreshAll();
  };

  const addCustomColumn = async (label: string, defaultAmount: number) => {
    await DbService.addCustomColumn(label, defaultAmount);
    await refreshAll();
  };

  const toggleCustomColumn = async (id: number, enabled: boolean) => {
    await DbService.toggleCustomColumn(id, enabled);
    await refreshAll();
  };

  const reorderCustomColumn = async (id: number, direction: 'up' | 'down') => {
    await DbService.reorderCustomColumn(id, direction);
    await refreshAll();
  };

  const deleteCustomColumn = async (id: number) => {
    await DbService.deleteCustomColumn(id);
    await refreshAll();
  };

  const recordPayment = async (memberId: number, itemKey: string, amount: number, targetAmount: number) => {
    if (!settings) return;
    await DbService.setPayment(memberId, itemKey, settings.active_year, amount, targetAmount);
    await refreshAll();
  };

  const addExpense = async (title: string, amount: number, category: string, date: string, recordedBy?: string, notes?: string) => {
    await DbService.addExpense(title, amount, category, date, recordedBy, notes);
    await refreshAll();
  };

  const deleteExpense = async (id: number) => {
    await DbService.deleteExpense(id);
    await refreshAll();
  };

  const backupData = async (): Promise<string> => {
    return await DbService.backupData();
  };

  const restoreData = async (jsonString: string): Promise<void> => {
    await DbService.restoreData(jsonString);
    await refreshAll();
  };

  return (
    <AppContext.Provider
      value={{
        loading,
        settings,
        members,
        customColumns,
        payments,
        expenses,
        totalIncome,
        totalExpenses,
        netBalance,
        refreshAll,
        updateGroupSettings,
        addMember,
        updateMember,
        deleteMember,
        addCustomColumn,
        toggleCustomColumn,
        reorderCustomColumn,
        deleteCustomColumn,
        recordPayment,
        addExpense,
        deleteExpense,
        backupData,
        restoreData,
        getPaymentForCell,
        getMemberRowTotal,
        getColumnTotal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
