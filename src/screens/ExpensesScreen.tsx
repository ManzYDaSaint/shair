import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { THEME } from '../constants/theme';
import { Expense } from '../types';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  TrendingDown,
  Tag,
  Receipt,
  User,
} from 'lucide-react-native';

const CATEGORIES = ['Venue & Hall', 'Refreshments & Food', 'Welfare & Support', 'Supplies & Stationery', 'Transport', 'Other'];

export const ExpensesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { expenses, totalExpenses, totalIncome, netBalance, settings, addExpense, deleteExpense } = useApp();
  const currency = (settings?.currency_symbol || 'MWK').trim();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [recordedBy, setRecordedBy] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddExpense = async () => {
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid expense title and amount');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    await addExpense(title.trim(), numAmount, category, today, recordedBy.trim(), notes.trim());

    setTitle('');
    setAmount('');
    setRecordedBy('');
    setNotes('');
    setModalVisible(false);
  };

  const handleDelete = (id: number, expenseTitle: string) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to remove "${expenseTitle}"? The deducted amount will be returned to the Net Balance.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExpense(id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={20} color={THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Circle Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus size={16} color="#FFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Impact Card */}
      <View style={styles.impactCard}>
        <View style={styles.impactTop}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.impactLabel} numberOfLines={1}>TOTAL EXPENSES DEDUCTED</Text>
            <Text style={styles.impactAmount} numberOfLines={1} adjustsFontSizeToFit>
              -{currency}{totalExpenses.toLocaleString()}
            </Text>
          </View>
          <View style={styles.impactIconCircle}>
            <TrendingDown size={22} color={THEME.colors.error} />
          </View>
        </View>

        <View style={styles.impactBottom}>
          <View style={[styles.impactStat, { flex: 1 }]}>
            <Text style={styles.statLabel}>Collected:</Text>
            <Text style={styles.statVal} numberOfLines={1}>
              {currency}{totalIncome.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.impactStat, { flex: 1, justifyContent: 'flex-end' }]}>
            <Text style={styles.statLabel}>Balance:</Text>
            <Text style={[styles.statVal, { color: THEME.colors.tertiary, fontWeight: '800' }]} numberOfLines={1}>
              {currency}{netBalance.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Expense List */}
      <View style={styles.listSection}>
        <View style={styles.listSectionHeader}>
          <Text style={styles.sectionTitle}>Expenditure History ({expenses.length})</Text>
          <Text style={styles.sectionSubtitle}>Deducted automatically from total funds</Text>
        </View>

        <ScrollView style={styles.expenseList} showsVerticalScrollIndicator={false}>
          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Receipt size={40} color={THEME.colors.border} />
              <Text style={styles.emptyText}>No expenses recorded yet.</Text>
              <Text style={styles.emptySub}>All contributions remain fully intact.</Text>
            </View>
          ) : (
            expenses.map((item) => (
              <View key={item.id} style={styles.expenseItem}>
                <View style={styles.expenseMain}>
                  <View style={styles.expenseTitleRow}>
                    <Text style={styles.expenseTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.expenseAmount} numberOfLines={1}>
                      -{currency}{item.amount.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.expenseMetaRow}>
                    <View style={styles.tagPill}>
                      <Tag size={10} color={THEME.colors.primary} />
                      <Text style={styles.tagText}>{item.category}</Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Calendar size={11} color={THEME.colors.textMuted} />
                      <Text style={styles.metaText}>{item.expense_date}</Text>
                    </View>

                    {item.recorded_by ? (
                      <View style={styles.metaItem}>
                        <User size={11} color={THEME.colors.textMuted} />
                        <Text style={styles.metaText}>{item.recorded_by}</Text>
                      </View>
                    ) : null}
                  </View>

                  {item.notes ? (
                    <Text style={styles.expenseNotes}>{item.notes}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id, item.title)}
                >
                  <Trash2 size={16} color={THEME.colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Add Expense Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Expense</Text>
            <Text style={styles.modalSub}>This amount will be deducted from the Net Balance</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="What was this expense for? (e.g. Refreshments)"
              placeholderTextColor="#9A8E89"
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.amountInputRow}>
              <Text style={styles.amountPrefix}>{currency}</Text>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginBottom: 0, fontSize: 18, fontWeight: '700' }]}
                placeholder="0.00"
                placeholderTextColor="#9A8E89"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Category selection */}
            <Text style={styles.categoryLabel}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, category === cat && styles.catChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.modalInput}
              placeholder="Recorded by (e.g. Priya Sharma)"
              placeholderTextColor="#9A8E89"
              value={recordedBy}
              onChangeText={setRecordedBy}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Optional notes or receipt details"
              placeholderTextColor="#9A8E89"
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveExpenseBtn} onPress={handleAddExpense}>
                <Text style={styles.saveExpenseBtnText}>Deduct & Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backBtn: {
    padding: 6,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceContainer,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    gap: 4,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  impactCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    margin: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  impactTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  impactLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  impactAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.error,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  impactIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  impactBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: THEME.spacing.sm,
  },
  impactStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.text,
    fontVariant: ['tabular-nums'],
  },
  listSection: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
  },
  listSectionHeader: {
    marginBottom: THEME.spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  expenseList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.sm,
  },
  expenseMain: {
    flex: 1,
  },
  expenseTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
    flex: 1,
    marginRight: 8,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.error,
    fontVariant: ['tabular-nums'],
  },
  expenseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.full,
    gap: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  expenseNotes: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: THEME.spacing.lg,
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.md,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  amountPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginRight: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
    color: THEME.colors.text,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginBottom: 6,
  },
  catScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceContainer,
    marginRight: 6,
  },
  catChipActive: {
    backgroundColor: THEME.colors.secondary,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  catChipTextActive: {
    color: '#FFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelModalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cancelModalBtnText: {
    color: THEME.colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  saveExpenseBtn: {
    backgroundColor: THEME.colors.error,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: THEME.borderRadius.sm,
  },
  saveExpenseBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
