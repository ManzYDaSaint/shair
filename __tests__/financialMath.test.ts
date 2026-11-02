import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateNetBalance,
  calculateMemberRowTotal,
  calculateColumnTotal,
  formatCurrencyAmount,
} from '../src/utils/financialMath.ts';

test('calculateTotalIncome correctly aggregates payments', () => {
  const samplePayments = [
    { id: 1, member_id: 1, item_key: 'fee', year: 2026, amount_paid: 5000, target_amount: 5000, status: 'paid' as const },
    { id: 2, member_id: 1, item_key: 'jan', year: 2026, amount_paid: 2500, target_amount: 5000, status: 'partial' as const },
    { id: 3, member_id: 2, item_key: 'fee', year: 2026, amount_paid: 0, target_amount: 5000, status: 'unpaid' as const },
    { id: 4, member_id: 2, item_key: 'jan', year: 2026, amount_paid: 5000, target_amount: 5000, status: 'paid' as const },
  ];

  const total = calculateTotalIncome(samplePayments);
  assert.equal(total, 12500);
});

test('calculateTotalExpenses sums all expense amounts', () => {
  const sampleExpenses = [
    { id: 1, title: 'Hall Rent', amount: 15000, category: 'Venue', expense_date: '2026-01-10' },
    { id: 2, title: 'Refreshments', amount: 4500, category: 'Food', expense_date: '2026-01-10' },
  ];

  const total = calculateTotalExpenses(sampleExpenses);
  assert.equal(total, 19500);
});

test('calculateNetBalance calculates income minus expenses', () => {
  const income = 50000;
  const expenses = 18000;
  const net = calculateNetBalance(income, expenses);
  assert.equal(net, 32000);
});

test('calculateNetBalance factors in carried forward opening balance', () => {
  const opening = 200000;
  const income = 150000;
  const expenses = 50000;
  const net = calculateNetBalance(income, expenses, opening);
  assert.equal(net, 300000);
});

test('calculateMemberRowTotal computes member paid, target, and remaining balance', () => {
  const samplePayments = [
    { id: 1, member_id: 10, item_key: 'fee', year: 2026, amount_paid: 5000, target_amount: 5000, status: 'paid' as const },
    { id: 2, member_id: 10, item_key: 'jan', year: 2026, amount_paid: 3000, target_amount: 5000, status: 'partial' as const },
    { id: 3, member_id: 10, item_key: 'feb', year: 2026, amount_paid: 0, target_amount: 5000, status: 'unpaid' as const },
    // Different member to ensure filtering works
    { id: 4, member_id: 20, item_key: 'fee', year: 2026, amount_paid: 5000, target_amount: 5000, status: 'paid' as const },
  ];

  const row = calculateMemberRowTotal(samplePayments, 10);
  assert.equal(row.paid, 8000);
  assert.equal(row.target, 15000);
  assert.equal(row.balance, 7000);
});

test('calculateColumnTotal calculates column sum by itemKey', () => {
  const samplePayments = [
    { id: 1, member_id: 1, item_key: 'fee', year: 2026, amount_paid: 5000, target_amount: 5000, status: 'paid' as const },
    { id: 2, member_id: 2, item_key: 'fee', year: 2026, amount_paid: 5000, target_amount: 5000, status: 'paid' as const },
    { id: 3, member_id: 1, item_key: 'jan', year: 2026, amount_paid: 5000, target_amount: 5000, status: 'paid' as const },
  ];

  assert.equal(calculateColumnTotal(samplePayments, 'fee'), 10000);
  assert.equal(calculateColumnTotal(samplePayments, 'jan'), 5000);
  assert.equal(calculateColumnTotal(samplePayments, 'feb'), 0);
});

test('formatCurrencyAmount formats numbers with thousand commas', () => {
  assert.equal(formatCurrencyAmount(5000), '5,000');
  assert.equal(formatCurrencyAmount(1250000), '1,250,000');
  assert.equal(formatCurrencyAmount(0), '0');
});
