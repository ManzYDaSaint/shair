import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';
import { ArrowUpRight, ArrowDownRight, Wallet, ShieldCheck, Edit3, Eye, EyeOff, Lock } from 'lucide-react-native';

interface SummaryHeaderCardProps {
  groupName: string;
  currency: string;
  openingBalance?: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  isLocked?: boolean;
  onEditGroupName?: () => void;
}

export const SummaryHeaderCard: React.FC<SummaryHeaderCardProps> = ({
  groupName,
  currency,
  openingBalance = 0,
  totalIncome,
  totalExpenses,
  netBalance,
  isLocked = false,
  onEditGroupName,
}) => {
  const [isBalanceHidden, setIsBalanceHidden] = React.useState(false);

  return (
    <View style={styles.card}>
      {/* Decorative ambient background accents */}
      <View style={styles.ambientGlowPrimary} />
      <View style={styles.ambientGlowPlum} />

      {/* Top Bar: Group Name & Security/Verified Tag */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.titleContainer}
          onPress={onEditGroupName}
          activeOpacity={onEditGroupName ? 0.7 : 1}
        >
          <Text style={styles.greetingText}>SHAIR LEDGER OVERVIEW</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
            <Text style={styles.groupName} numberOfLines={1}>
              {groupName || 'Community Circle Fund'}
            </Text>
            {onEditGroupName && <Edit3 size={13} color="rgba(255, 255, 255, 0.6)" />}
          </View>
        </TouchableOpacity>

        {isLocked ? (
          <View style={[styles.statusPill, { backgroundColor: THEME.colors.secondary }]}>
            <Lock size={12} color="#FFFFFF" />
            <Text style={styles.statusPillText}>Archived & Locked</Text>
          </View>
        ) : (
          <View style={styles.statusPill}>
            <ShieldCheck size={13} color="#FFFFFF" />
            <Text style={styles.statusPillText}>Active Ledger</Text>
          </View>
        )}
      </View>

      {/* Hero Balance Section */}
      <View style={styles.heroSection}>
        <View style={styles.balanceInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.balanceLabel}>NET AVAILABLE BALANCE</Text>
            <TouchableOpacity
              onPress={() => setIsBalanceHidden(!isBalanceHidden)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isBalanceHidden ? (
                <EyeOff size={13} color="rgba(255, 255, 255, 0.7)" />
              ) : (
                <Eye size={13} color="rgba(255, 255, 255, 0.7)" />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.currencySymbol}>{currency}</Text>
            <Text style={[styles.netAmount, netBalance < 0 && styles.negativeBalance]}>
              {isBalanceHidden ? '••••••' : netBalance.toLocaleString()}
            </Text>
          </View>
          {openingBalance > 0 && (
            <Text style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2, fontWeight: '500' }}>
              Includes {currency} {openingBalance.toLocaleString()} carried forward
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => setIsBalanceHidden(!isBalanceHidden)}
          activeOpacity={0.8}
        >
          {isBalanceHidden ? (
            <EyeOff size={20} color="#FFFFFF" />
          ) : (
            <Wallet size={22} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Inflow & Outflow Chips / Split Row */}
      <View style={styles.splitRow}>
        {/* Total Collected */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={styles.iconBadgeGreen}>
              <ArrowUpRight size={13} color="#34D399" />
            </View>
            <Text style={styles.statLabel}>Total Inflow</Text>
          </View>
          <Text style={styles.statValueGreen}>
            {currency} {totalIncome.toLocaleString()}
          </Text>
        </View>

        {/* Expenses Deducted */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={styles.iconBadgeRed}>
              <ArrowDownRight size={13} color="#F87171" />
            </View>
            <Text style={styles.statLabel}>Expenses Out</Text>
          </View>
          <Text style={styles.statValueRed}>
            -{currency} {totalExpenses.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#32141C', // Rich deep cocoa/plum backdrop
    borderRadius: 20,
    padding: 16,
    marginHorizontal: THEME.spacing.md,
    marginTop: 6,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
    elevation: 8,
    shadowColor: '#200A12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  ambientGlowPrimary: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: THEME.colors.primary,
    opacity: 0.35,
  },
  ambientGlowPlum: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#7E4F70',
    opacity: 0.3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  greetingText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 14,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFDAD2',
  },
  netAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  negativeBalance: {
    color: '#FCA5A5',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  iconBadgeGreen: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeRed: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  statValueGreen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34D399',
    fontVariant: ['tabular-nums'],
  },
  statValueRed: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F87171',
    fontVariant: ['tabular-nums'],
  },
});
