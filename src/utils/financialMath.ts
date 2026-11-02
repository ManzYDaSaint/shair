import type { PaymentRecord, Expense } from '../types/index.ts';

/**
 * Computes the total income collected across all payments.
 */
export function calculateTotalIncome(payments: PaymentRecord[]): number {
  return payments.reduce((acc, p) => acc + (p.amount_paid || 0), 0);
}

/**
 * Computes the total expenses logged.
 */
export function calculateTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
}

/**
 * Computes the net balance available: Opening Balance + Total Income - Total Expenses.
 */
export function calculateNetBalance(totalIncome: number, totalExpenses: number, openingBalance: number = 0): number {
  return openingBalance + totalIncome - totalExpenses;
}

/**
 * Computes the row totals (paid, target, balance) for a specific member.
 */
export function calculateMemberRowTotal(payments: PaymentRecord[], memberId: number): {
  paid: number;
  target: number;
  balance: number;
} {
  const memberPayments = payments.filter((p) => p.member_id === memberId);
  const paid = memberPayments.reduce((acc, p) => acc + (p.amount_paid || 0), 0);
  const target = memberPayments.reduce((acc, p) => acc + (p.target_amount || 0), 0);
  return {
    paid,
    target,
    balance: Math.max(0, target - paid),
  };
}

/**
 * Computes the total contributions collected for a specific column itemKey (e.g. 'fee', 'jan', 'col_welfare').
 */
export function calculateColumnTotal(payments: PaymentRecord[], itemKey: string): number {
  return payments
    .filter((p) => p.item_key === itemKey)
    .reduce((acc, p) => acc + (p.amount_paid || 0), 0);
}

/**
 * Formats monetary amounts with thousand separators (e.g., 5,000).
 */
export function formatCurrencyAmount(amount: number): string {
  return Math.round(amount).toLocaleString('en-US');
}
