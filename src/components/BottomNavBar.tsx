import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';
import { Table, Receipt, SlidersHorizontal, Users } from 'lucide-react-native';

export type ScreenTab = 'matrix' | 'expenses' | 'columns';

interface BottomNavBarProps {
  currentTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
  totalExpensesCount: number;
  totalColumnsCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  totalExpensesCount,
  totalColumnsCount,
}) => {
  return (
    <View style={styles.container}>
      {/* Tab 1: Contribution Ledger */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('matrix')}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrapper, currentTab === 'matrix' && styles.activeIconWrapper]}>
          <Table
            size={20}
            color={currentTab === 'matrix' ? THEME.colors.primary : THEME.colors.textMuted}
          />
        </View>
        <Text style={[styles.tabLabel, currentTab === 'matrix' && styles.activeTabLabel]}>
          Ledger
        </Text>
      </TouchableOpacity>

      {/* Tab 2: Expenses Log */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('expenses')}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrapper, currentTab === 'expenses' && styles.activeExpensesWrapper]}>
          <Receipt
            size={20}
            color={currentTab === 'expenses' ? THEME.colors.error : THEME.colors.textMuted}
          />
          {totalExpensesCount > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeText}>{totalExpensesCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, currentTab === 'expenses' && styles.activeExpensesLabel]}>
          Expenses
        </Text>
      </TouchableOpacity>

      {/* Tab 3: Customize Columns */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('columns')}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrapper, currentTab === 'columns' && styles.activeColumnsWrapper]}>
          <SlidersHorizontal
            size={20}
            color={currentTab === 'columns' ? THEME.colors.secondary : THEME.colors.textMuted}
          />
          {totalColumnsCount > 0 && (
            <View style={[styles.badgeCount, { backgroundColor: THEME.colors.secondary }]}>
              <Text style={styles.badgeText}>{totalColumnsCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, currentTab === 'columns' && styles.activeColumnsLabel]}>
          Columns
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconWrapper: {
    width: 36,
    height: 28,
    borderRadius: THEME.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  activeIconWrapper: {
    backgroundColor: THEME.colors.primaryLight,
  },
  activeExpensesWrapper: {
    backgroundColor: THEME.colors.errorLight,
  },
  activeColumnsWrapper: {
    backgroundColor: THEME.colors.secondaryLight,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  activeTabLabel: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  activeExpensesLabel: {
    color: THEME.colors.error,
    fontWeight: '700',
  },
  activeColumnsLabel: {
    color: THEME.colors.secondary,
    fontWeight: '700',
  },
  badgeCount: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: THEME.colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
