import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useApp } from '../context/AppContext';
import { THEME } from '../constants/theme';
import { MONTH_KEYS, MONTH_LABELS, Member } from '../types';
import { SummaryHeaderCard } from '../components/SummaryHeaderCard';
import { QuickPaymentModal } from '../components/QuickPaymentModal';
import {
  Search,
  UserPlus,
  MoreVertical,
  UserCheck,
  UserX,
  ArrowRightLeft,
  Trash2,
  Share2,
  Calendar,
  Database,
  CheckCircle2,
  X,
  Download,
  Lock,
  Unlock,
  AlertCircle,
  ArrowRight,
  FileCheck2,
} from 'lucide-react-native';

// ---------------------------------------------------------------------------
// Constants & Cycle Generation
// ---------------------------------------------------------------------------
const ROW_HEIGHT = 50;
const SR_W = 36;
const NAME_W = 130;
const STATUS_W = 72;
const AMOUNT_W = 88;
const TOTAL_W = 114;

// Financial cycles starting from 2026 onwards (2026 to 2030 = 5 cycles)
export const AVAILABLE_CYCLES = [2026, 2027, 2028, 2029, 2030];

type FilterMode = 'all' | 'active' | 'stopped' | 'transferred' | 'due';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const LedgerMatrixScreen: React.FC<{
  onOpenExpenses: () => void;
  onOpenColumns: () => void;
}> = ({ onOpenExpenses, onOpenColumns }) => {
  const {
    settings,
    members,
    customColumns,
    openingBalance,
    totalIncome,
    totalExpenses,
    netBalance,
    isYearClosed,
    currentFinancialYear,
    allFinancialYears,
    getPaymentForCell,
    getMemberRowTotal,
    getColumnTotal,
    recordPayment,
    addMember,
    updateMember,
    deleteMember,
    updateGroupSettings,
    closeFinancialYear,
    reopenFinancialYear,
    backupData,
    restoreData,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  // Edit Group Name Modal
  const [editGroupNameVisible, setEditGroupNameVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Cycle Switcher Modal
  const [cycleModalVisible, setCycleModalVisible] = useState(false);

  // Close Year Modal & Wizard State
  const [closeYearModalVisible, setCloseYearModalVisible] = useState(false);
  const [carriedForwardInput, setCarriedForwardInput] = useState('');
  const [officerNameInput, setOfficerNameInput] = useState('');
  const [closingNotesInput, setClosingNotesInput] = useState('');

  // Backup / Restore Modal
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [restoreJsonInput, setRestoreJsonInput] = useState('');

  // Member Quick Summary Bottom Sheet
  const [summaryMember, setSummaryMember] = useState<Member | null>(null);

  // Active touch tracking for cell outline
  const [activeCellKey, setActiveCellKey] = useState<string | null>(null);

  // Synchronized vertical scroll refs
  const leftBodyRef = useRef<any>(null);
  const rightBodyRef = useRef<any>(null);
  const isSyncingRef = useRef(false);

  const syncLeft = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    leftBodyRef.current?.scrollTo({ y: e.nativeEvent.contentOffset.y, animated: false });
    isSyncingRef.current = false;
  };
  const syncRight = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    rightBodyRef.current?.scrollTo({ y: e.nativeEvent.contentOffset.y, animated: false });
    isSyncingRef.current = false;
  };

  // Cell payment modal
  const [activeCell, setActiveCell] = useState<{
    member: Member;
    itemKey: string;
    itemTitle: string;
    currentPaid: number;
    targetAmount: number;
  } | null>(null);

  // Member management modal
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'stopped' | 'transferred'>('active');
  const [editReason, setEditReason] = useState('');

  // Add member modal
  const [newMemberModalVisible, setNewMemberModalVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  const currency = (settings?.currency_symbol || 'MWK').trim();
  const activeCustomCols = customColumns.filter((c) => c.is_enabled === 1);
  const defaultFee = settings?.default_membership_fee || 5000;
  const defaultMonthly = settings?.default_monthly_contribution || 5000;
  const currentYear = settings?.active_year || 2026;

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.phone_number && m.phone_number.includes(searchQuery));
    if (!matchesSearch) return false;
    const status = m.status || 'active';
    if (filterMode === 'active') return status === 'active';
    if (filterMode === 'stopped') return status === 'stopped';
    if (filterMode === 'transferred') return status === 'transferred';
    if (filterMode === 'due') return getMemberRowTotal(m.id).balance > 0;
    return true;
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleOpenMemberActions = (member: Member) => {
    setSelectedMember(member);
    setEditName(member.name);
    setEditPhone(member.phone_number || '');
    setEditRole(member.role || 'Member');
    setEditStatus(member.status || 'active');
    setEditReason(member.status_reason || '');
  };

  const handleSaveMemberChanges = async () => {
    if (!selectedMember) return;
    if (!editName.trim()) { Alert.alert('Required', 'Member name cannot be empty'); return; }
    await updateMember(selectedMember.id, {
      name: editName.trim(),
      phone_number: editPhone.trim(),
      role: editRole.trim(),
      status: editStatus,
      status_reason: editReason.trim(),
    });
    setSelectedMember(null);
  };

  const handleDeleteMember = () => {
    if (!selectedMember) return;
    Alert.alert(
      'Delete Member',
      `Remove ${selectedMember.name} and all their ledger records?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => { await deleteMember(selectedMember.id); setSelectedMember(null); },
        },
      ]
    );
  };

  const handleCellPress = (member: Member, itemKey: string, title: string, defaultTarget: number) => {
    if (isYearClosed) {
      Alert.alert(
        'Financial Year Closed',
        `The ${currentYear} cycle has been locked and archived. Reopen the year first to record or modify payments.`
      );
      return;
    }
    const p = getPaymentForCell(member.id, itemKey);
    setActiveCellKey(`${member.id}_${itemKey}`);
    setActiveCell({
      member, itemKey, itemTitle: title,
      currentPaid: p?.amount_paid || 0,
      targetAmount: p?.target_amount || defaultTarget,
    });
  };

  const handleSavePayment = (amount: number) => {
    if (!activeCell) return;
    recordPayment(activeCell.member.id, activeCell.itemKey, amount, activeCell.targetAmount);
  };

  const handleCreateMember = async () => {
    if (!newMemberName.trim()) { Alert.alert('Required', 'Please enter the member full name'); return; }
    await addMember(newMemberName.trim(), newMemberPhone.trim());
    setNewMemberName(''); setNewMemberPhone('');
    setNewMemberModalVisible(false);
  };

  const handleOpenEditGroupName = () => {
    setNewGroupName(settings?.group_name || 'Sahodari Circle Fund');
    setEditGroupNameVisible(true);
  };

  const handleSaveGroupName = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Required', 'Group name cannot be empty');
      return;
    }
    await updateGroupSettings({ group_name: newGroupName.trim() });
    setEditGroupNameVisible(false);
  };

  const handleSelectCycle = async (year: number) => {
    await updateGroupSettings({ active_year: year });
    setCycleModalVisible(false);
  };

  // ---------------------------------------------------------------------------
  // Backup & Restore
  // ---------------------------------------------------------------------------
  const handleExportBackup = async () => {
    try {
      const json = await backupData();
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `shair_backup_${dateStr}.json`;
      const fileUri = `${FileSystem.cacheDirectory || ''}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Save / Share Shair Backup',
        });
      } else {
        Alert.alert('Backup Created', `Saved to ${fileUri}`);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Backup Error', 'Could not create the backup file.');
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreJsonInput.trim()) {
      Alert.alert('Required', 'Please paste the backup JSON text to restore.');
      return;
    }
    Alert.alert(
      'Confirm Restore',
      'Restoring will replace the current ledger, expenses, and members with the backup data. Do you wish to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Now',
          style: 'destructive',
          onPress: async () => {
            try {
              await restoreData(restoreJsonInput.trim());
              setRestoreJsonInput('');
              setBackupModalVisible(false);
              Alert.alert('Success', 'Ledger data restored successfully!');
            } catch (err) {
              Alert.alert('Restore Failed', 'Invalid or corrupted backup JSON data.');
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // Export PDF
  // ---------------------------------------------------------------------------
  const handleExport = async () => {
    try {
      const year = settings?.active_year || 2026;
      const groupName = settings?.group_name || 'Sahodari Circle Fund';

      const thStyle = `style="padding:6px 8px;background:#5C3317;color:#fff;font-size:11px;white-space:nowrap;border:1px solid #8B5A3A"`;
      const tdStyle = (align = 'center') =>
        `style="padding:5px 8px;text-align:${align};font-size:11px;border:1px solid #e0d5cc"`;

      const headers = [
        'SR', 'Member', 'Status', 'Fee',
        ...MONTH_KEYS.map((m) => MONTH_LABELS[m]),
        ...activeCustomCols.map((c) => c.column_label),
        'Total',
      ];

      const headerRow = headers.map((h) => `<th ${thStyle}>${h}</th>`).join('');

      const bodyRows = members.map((member, idx) => {
        const feeRec = getPaymentForCell(member.id, 'fee');
        const feePaid = feeRec?.amount_paid || 0;
        const rowTotal = getMemberRowTotal(member.id);
        const status = member.status || 'active';

        const monthCells = MONTH_KEYS.map((mk) => {
          const rec = getPaymentForCell(member.id, mk);
          const paid = rec?.amount_paid || 0;
          return `<td ${tdStyle()}>${paid > 0 ? `${currency} ${paid.toLocaleString()}` : '-'}</td>`;
        }).join('');

        const customCells = activeCustomCols.map((c) => {
          const rec = getPaymentForCell(member.id, c.column_key);
          const paid = rec?.amount_paid || 0;
          return `<td ${tdStyle()}>${paid > 0 ? `${currency} ${paid.toLocaleString()}` : '-'}</td>`;
        }).join('');

        const rowBg = idx % 2 === 0 ? '#ffffff' : '#fdf8f5';
        return `
          <tr style="background:${rowBg}">
            <td ${tdStyle()}>${idx + 1}</td>
            <td ${tdStyle('left')}>${member.name}</td>
            <td ${tdStyle()}>${status.charAt(0).toUpperCase() + status.slice(1)}</td>
            <td ${tdStyle()}>${feePaid > 0 ? `${currency} ${feePaid.toLocaleString()}` : '-'}</td>
            ${monthCells}
            ${customCells}
            <td ${tdStyle('right')}><strong>${currency} ${rowTotal.paid.toLocaleString()}</strong></td>
          </tr>`;
      }).join('');

      const footerCells = [
        `<td colspan="4" style="padding:6px 8px;background:#5C3317;color:#fff;font-size:11px;border:1px solid #8B5A3A"><strong>TOTALS</strong></td>`,
        ...MONTH_KEYS.map((mk) => `<td style="padding:6px 8px;text-align:center;background:#5C3317;color:#fff;font-size:11px;border:1px solid #8B5A3A"><strong>${currency} ${getColumnTotal(mk).toLocaleString()}</strong></td>`),
        ...activeCustomCols.map((c) => `<td style="padding:6px 8px;text-align:center;background:#5C3317;color:#fff;font-size:11px;border:1px solid #8B5A3A"><strong>${currency} ${getColumnTotal(c.column_key).toLocaleString()}</strong></td>`),
        `<td style="padding:6px 8px;text-align:right;background:#5C3317;color:#fff;font-size:12px;border:1px solid #8B5A3A"><strong>${currency} ${totalIncome.toLocaleString()}</strong></td>`,
      ].join('');

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
  h1 { font-size: 20px; color: #5C3317; margin: 0 0 4px; }
  .sub { font-size: 12px; color: #888; margin: 0 0 20px; }
  table { width: 100%; border-collapse: collapse; }
  .summary { margin-top: 20px; font-size: 13px; color: #444; }
  .summary strong { color: #5C3317; }
</style></head>
<body>
  <h1>${groupName} — Contribution Ledger ${year}</h1>
  <p class="sub">Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
  <table>
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${bodyRows}</tbody>
    <tfoot><tr>${footerCells}</tr></tfoot>
  </table>
  <p class="summary">
    Net Balance: <strong>${currency} ${netBalance.toLocaleString()}</strong>
    &nbsp;&nbsp;|&nbsp;&nbsp;
    Total Collected: <strong>${currency} ${totalIncome.toLocaleString()}</strong>
    &nbsp;&nbsp;|&nbsp;&nbsp;
    Total Expenses: <strong>${currency} ${totalExpenses.toLocaleString()}</strong>
  </p>
</body></html>`;

      await Print.printAsync({ html });
    } catch (err) {
      console.error('Export error:', err);
      Alert.alert('Export Failed', String(err));
    }
  };

  // ---------------------------------------------------------------------------
  // Year-Close Handler
  // ---------------------------------------------------------------------------
  const handleCloseYear = async () => {
    const carried = parseFloat(carriedForwardInput);
    if (isNaN(carried) || carried < 0) {
      Alert.alert('Invalid Amount', 'Enter a valid carry-forward amount (0 or more).');
      return;
    }
    if (!officerNameInput.trim()) {
      Alert.alert('Required', 'Please enter the name of the officer closing the books.');
      return;
    }
    const closingYear = settings?.active_year || 2026;
    const nextYear = closingYear + 1;
    Alert.alert(
      'Confirm Year Close',
      `You are about to close the ${closingYear} financial year and open ${nextYear}.\n\n• ${currency} ${carried.toLocaleString()} will be carried forward\n• This action cannot be undone automatically\n• All ${closingYear} payment records will be preserved`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Close ${closingYear}`,
          style: 'destructive',
          onPress: async () => {
            try {
              await closeFinancialYear({
                closingYear,
                nextYear,
                carriedForwardAmount: carried,
                closedBy: officerNameInput.trim(),
                notes: closingNotesInput.trim(),
              });
              setCloseYearModalVisible(false);
              setCarriedForwardInput('');
              setOfficerNameInput('');
              setClosingNotesInput('');
              Alert.alert(
                'Year Closed',
                `${closingYear} has been archived. You are now recording payments for ${nextYear}.`
              );
            } catch (err) {
              Alert.alert('Error', 'Could not close the financial year. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleReopenYear = () => {
    const yr = settings?.active_year || 2026;
    Alert.alert(
      'Reopen Year',
      `Reopen the ${yr} financial year for editing? The year will be marked active again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reopen',
          onPress: async () => {
            await reopenFinancialYear(yr);
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // Status helpers
  // ---------------------------------------------------------------------------
  const statusLabel = (s?: string) =>
    s === 'stopped' ? 'Stopped' : s === 'transferred' ? 'Moved' : 'Active';

  const statusPillStyle = (s?: string) =>
    s === 'stopped' ? styles.statusPillStopped
    : s === 'transferred' ? styles.statusPillTransferred
    : styles.statusPillActive;

  const statusTextStyle = (s?: string) =>
    s === 'stopped' ? styles.statusPillTextStopped
    : s === 'transferred' ? styles.statusPillTextTransferred
    : styles.statusPillTextActive;

  // ---------------------------------------------------------------------------
  // Table Headers & Footers
  // ---------------------------------------------------------------------------
  const renderHeaderH = 44;

  const LeftHeader = () => (
    <View style={[styles.headerRow, { height: renderHeaderH }]}>
      <View style={[styles.headerCell, { width: SR_W }]}>
        <Text style={styles.headerCellText}>SR</Text>
      </View>
      <View style={[styles.headerCell, { width: NAME_W }]}>
        <Text style={styles.headerCellText}>MEMBER</Text>
      </View>
    </View>
  );

  const RightHeader = () => (
    <View style={[styles.headerRow, { height: renderHeaderH }]}>
      <View style={[styles.headerCell, { width: STATUS_W }]}>
        <Text style={styles.headerCellText}>STATUS</Text>
      </View>
      <View style={[styles.headerCell, { width: AMOUNT_W }]}>
        <Text style={styles.headerCellText}>FEE</Text>
      </View>
      {MONTH_KEYS.map((mk) => (
        <View key={mk} style={[styles.headerCell, { width: AMOUNT_W }]}>
          <Text style={styles.headerCellText}>{MONTH_LABELS[mk].toUpperCase()}</Text>
        </View>
      ))}
      {activeCustomCols.map((c) => (
        <View key={c.column_key} style={[styles.headerCell, { width: AMOUNT_W }, styles.customColHeader]}>
          <Text style={[styles.headerCellText, { color: THEME.colors.secondary }]}>
            {c.column_label.toUpperCase()}
          </Text>
        </View>
      ))}
      <View style={[styles.headerCell, { width: TOTAL_W, alignItems: 'flex-end', paddingRight: 10 }]}>
        <Text style={styles.headerCellText}>TOTAL</Text>
      </View>
    </View>
  );

  const LeftFooter = () => (
    <View style={[styles.footerRow]}>
      <View style={[styles.cell, { width: NAME_W, alignItems: 'flex-start', paddingLeft: 8 }]}>
        <Text style={styles.footerLabel}>All Collections</Text>
      </View>
    </View>
  );

  const RightFooter = () => (
    <View style={[styles.footerRow]}>
      <View style={[styles.cell, { width: STATUS_W }]} />
      <View style={[styles.cell, { width: AMOUNT_W }]}>
        <Text style={styles.footerTotalVal}>{currency} {getColumnTotal('fee').toLocaleString()}</Text>
      </View>
      {MONTH_KEYS.map((mk) => (
        <View key={mk} style={[styles.cell, { width: AMOUNT_W }]}>
          <Text style={styles.footerTotalVal}>{currency} {getColumnTotal(mk).toLocaleString()}</Text>
        </View>
      ))}
      {activeCustomCols.map((c) => (
        <View key={c.column_key} style={[styles.cell, { width: AMOUNT_W }]}>
          <Text style={[styles.footerTotalVal, { color: THEME.colors.secondary }]}>
            {currency} {getColumnTotal(c.column_key).toLocaleString()}
          </Text>
        </View>
      ))}
      <View style={[styles.cell, { width: TOTAL_W, alignItems: 'flex-end', paddingRight: 10 }]}>
        <Text style={styles.grandTotalVal}>{currency} {totalIncome.toLocaleString()}</Text>
      </View>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Modernized Summary Card */}
      <SummaryHeaderCard
        groupName={settings?.group_name || 'Sahodari Circle Fund'}
        currency={currency}
        openingBalance={openingBalance}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        netBalance={netBalance}
        isLocked={isYearClosed}
        onEditGroupName={handleOpenEditGroupName}
      />

      {/* Action Strip */}
      <View style={styles.actionStrip}>
        <TouchableOpacity
          style={styles.pillBadge}
          onPress={() => setCycleModalVisible(true)}
          activeOpacity={0.7}
        >
          <Calendar size={12} color={THEME.colors.primary} />
          <Text style={styles.pillBadgeText}>{currentYear} Cycle</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          {/* Backup Button */}
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={() => setBackupModalVisible(true)}
            activeOpacity={0.7}
          >
            <Database size={13} color={THEME.colors.textMuted} />
            <Text style={styles.actionIconBtnText}>Backup</Text>
          </TouchableOpacity>

          {/* Export PDF Button */}
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Share2 size={13} color={THEME.colors.primary} />
            <Text style={styles.exportBtnText}>PDF</Text>
          </TouchableOpacity>

          {/* Close / Reopen Year Button */}
          <TouchableOpacity
            style={[styles.actionIconButton, isYearClosed && { borderColor: THEME.colors.secondary }]}
            onPress={() => {
              if (isYearClosed) {
                handleReopenYear();
              } else {
                setCarriedForwardInput(String(Math.max(0, Math.round(netBalance))));
                setCloseYearModalVisible(true);
              }
            }}
            activeOpacity={0.7}
          >
            {isYearClosed
              ? <Unlock size={13} color={THEME.colors.secondary} />
              : <FileCheck2 size={13} color={THEME.colors.textMuted} />
            }
            <Text style={[styles.actionIconBtnText, isYearClosed && { color: THEME.colors.secondary }]}>
              {isYearClosed ? 'Unlock' : 'Close Yr'}
            </Text>
          </TouchableOpacity>

          {/* Add Contributor Button */}
          <TouchableOpacity
            style={[styles.stripButton, { backgroundColor: THEME.colors.primary }]}
            onPress={() => setNewMemberModalVisible(true)}
          >
            <UserPlus size={13} color="#FFF" />
            <Text style={[styles.stripButtonText, { color: '#FFF' }]}>Contributor</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Filter Strip */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={16} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contributor or phone..."
            placeholderTextColor="#9A8E89"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
          {(
            [
              { key: 'all' as FilterMode, label: `All (${members.length})` },
              { key: 'active' as FilterMode, label: `Active (${members.filter((m) => (m.status || 'active') === 'active').length})` },
              { key: 'stopped' as FilterMode, label: `Stopped (${members.filter((m) => m.status === 'stopped').length})` },
              { key: 'transferred' as FilterMode, label: `Moved (${members.filter((m) => m.status === 'transferred').length})` },
              { key: 'due' as FilterMode, label: 'Has Balance' },
            ]
          ).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tab,
                filterMode === key && (
                  key === 'active' ? styles.activeTabGreen :
                  key === 'stopped' ? styles.activeTabRed :
                  key === 'transferred' ? styles.activeTabPlum :
                  key === 'due' ? styles.activeTabDue :
                  styles.activeTab
                ),
              ]}
              onPress={() => setFilterMode(key)}
            >
              <Text
                style={[
                  styles.tabText,
                  filterMode === key && (
                    key === 'active' ? styles.activeTabGreenText :
                    key === 'stopped' ? styles.activeTabRedText :
                    key === 'transferred' ? styles.activeTabPlumText :
                    key === 'due' ? styles.activeTabDueText :
                    styles.activeTabText
                  ),
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ─── STICKY TABLE WITH ZEBRA PATTERN & ACTIVE TOUCH ──────────────────── */}
      {filteredMembers.length === 0 ? (
        <View style={styles.emptyTableContainer}>
          <View style={styles.emptyTableIconCircle}>
            <UserPlus size={28} color={THEME.colors.primary} />
          </View>
          <Text style={styles.emptyTableTitle}>No Contributors Found</Text>
          <Text style={styles.emptyTableSub}>
            {members.length === 0
              ? 'Your circle ledger is ready. Add your first group contributor to begin logging payments.'
              : 'No contributors match the current filter or search criteria.'}
          </Text>
          {members.length === 0 && (
            <TouchableOpacity
              style={styles.emptyTableAddBtn}
              onPress={() => setNewMemberModalVisible(true)}
              activeOpacity={0.8}
            >
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={styles.emptyTableAddBtnText}>Add First Contributor</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.tableCard}>
          <View style={{ flex: 1, flexDirection: 'row' }}>

          {/* ── LEFT FIXED PANEL (SR + Member) ── */}
          <View style={styles.leftPanel}>
            <LeftHeader />

            <ScrollView
              ref={leftBodyRef}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
            >
              {filteredMembers.map((member, idx) => {
                const isEven = idx % 2 === 0;
                const rowBg = isEven ? '#FFFFFF' : '#FBF8F5';

                return (
                  <View key={member.id} style={[styles.dataRow, { backgroundColor: rowBg }]}>
                    {/* SR */}
                    <View style={[styles.cell, { width: SR_W }]}>
                      <Text style={styles.srText}>
                        {idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`}
                      </Text>
                    </View>

                    {/* Member name — tap to open quick summary */}
                    <TouchableOpacity
                      style={[styles.cell, styles.nameCell]}
                      onPress={() => setSummaryMember(member)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.initialsCircle,
                        member.status === 'stopped' && { backgroundColor: THEME.colors.errorLight },
                        member.status === 'transferred' && { backgroundColor: THEME.colors.secondaryLight },
                      ]}>
                        <Text style={[
                          styles.initialsText,
                          member.status === 'stopped' && { color: THEME.colors.error },
                          member.status === 'transferred' && { color: THEME.colors.secondary },
                        ]}>
                          {member.avatar_initials || 'M'}
                        </Text>
                      </View>
                      <View style={{ flex: 1, paddingRight: 2 }}>
                        <Text style={styles.memberNameText} numberOfLines={1}>{member.name}</Text>
                        <Text style={styles.memberRoleText} numberOfLines={1}>{member.role || 'Member'}</Text>
                      </View>
                      <MoreVertical size={12} color={THEME.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>

            <LeftFooter />
          </View>

          {/* ── RIGHT SCROLLABLE PANEL ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator style={{ flex: 1 }}>
            <View>
              <RightHeader />

              <ScrollView
                ref={rightBodyRef}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator
                onScroll={syncLeft}
                scrollEventThrottle={16}
              >
                {filteredMembers.map((member, idx) => {
                  const feeRecord = getPaymentForCell(member.id, 'fee');
                  const feePaid = feeRecord?.amount_paid || 0;
                  const feeFull = feePaid >= defaultFee;
                  const rowTotal = getMemberRowTotal(member.id);
                  const isEven = idx % 2 === 0;
                  const rowBg = isEven ? '#FFFFFF' : '#FBF8F5';

                  return (
                    <View key={member.id} style={[styles.dataRow, { backgroundColor: rowBg }]}>
                      {/* Status */}
                      <View style={[styles.cell, { width: STATUS_W }]}>
                        <View style={[styles.statusPill, statusPillStyle(member.status)]}>
                          <Text style={[styles.statusPillText, statusTextStyle(member.status)]}>
                            {statusLabel(member.status)}
                          </Text>
                        </View>
                      </View>

                      {/* Fee */}
                      <TouchableOpacity
                        style={[
                          styles.cell,
                          { width: AMOUNT_W },
                          activeCellKey === `${member.id}_fee` && styles.activeTouchCell,
                        ]}
                        onPress={() => handleCellPress(member, 'fee', 'Membership Fee', defaultFee)}
                      >
                        <View style={[styles.badgePill, feeFull ? styles.badgePaid : feePaid > 0 ? styles.badgePartial : styles.badgeUnpaid]}>
                          <Text style={[styles.badgeText, feePaid > 0 ? styles.badgeTextPaid : styles.badgeTextUnpaid]} numberOfLines={1}>
                            {feePaid > 0 ? `${currency} ${feePaid.toLocaleString()}` : '—'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Months */}
                      {MONTH_KEYS.map((mk) => {
                        const rec = getPaymentForCell(member.id, mk);
                        const paid = rec?.amount_paid || 0;
                        const target = rec?.target_amount || defaultMonthly;
                        const isFull = paid >= target && target > 0;
                        const isPartial = paid > 0 && paid < target;
                        const cellKey = `${member.id}_${mk}`;

                        return (
                          <TouchableOpacity
                            key={mk}
                            style={[
                              styles.cell,
                              { width: AMOUNT_W },
                              activeCellKey === cellKey && styles.activeTouchCell,
                            ]}
                            onPress={() => handleCellPress(member, mk, MONTH_LABELS[mk], target)}
                          >
                            <View style={[styles.badgePill, isFull ? styles.badgePaid : isPartial ? styles.badgePartial : styles.badgeUnpaid]}>
                              <Text style={[styles.badgeText, isFull || isPartial ? styles.badgeTextPaid : styles.badgeTextUnpaid]} numberOfLines={1}>
                                {paid > 0 ? `${currency} ${paid.toLocaleString()}` : '—'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}

                      {/* Custom columns */}
                      {activeCustomCols.map((c) => {
                        const rec = getPaymentForCell(member.id, c.column_key);
                        const paid = rec?.amount_paid || 0;
                        const target = rec?.target_amount || c.default_amount;
                        const isFull = paid >= target && target > 0;
                        const cellKey = `${member.id}_${c.column_key}`;

                        return (
                          <TouchableOpacity
                            key={c.column_key}
                            style={[
                              styles.cell,
                              { width: AMOUNT_W },
                              activeCellKey === cellKey && styles.activeTouchCell,
                            ]}
                            onPress={() => handleCellPress(member, c.column_key, c.column_label, target)}
                          >
                            <View style={[styles.badgePill, isFull ? styles.badgeCustomPaid : paid > 0 ? styles.badgePartial : styles.badgeUnpaid]}>
                              <Text style={[styles.badgeText, paid > 0 ? { color: THEME.colors.secondary } : styles.badgeTextUnpaid]} numberOfLines={1}>
                                {paid > 0 ? `${currency} ${paid.toLocaleString()}` : '—'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}

                      {/* Row total */}
                      <View style={[styles.cell, { width: TOTAL_W, alignItems: 'flex-end', paddingRight: 10 }]}>
                        <Text style={styles.rowTotalPaid} numberOfLines={1}>
                          {currency} {rowTotal.paid.toLocaleString()}
                        </Text>
                        {rowTotal.balance > 0 && (
                          <Text style={styles.rowTotalDue} numberOfLines={1}>
                            Due {currency} {rowTotal.balance.toLocaleString()}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <RightFooter />
            </View>
          </ScrollView>
        </View>
      </View>
      )}

      {/* Quick Payment Modal */}
      {activeCell && (
        <QuickPaymentModal
          visible={!!activeCell}
          onClose={() => {
            setActiveCell(null);
            setActiveCellKey(null);
          }}
          memberName={activeCell.member.name}
          itemTitle={activeCell.itemTitle}
          currentPaid={activeCell.currentPaid}
          targetAmount={activeCell.targetAmount}
          currency={currency}
          onSave={handleSavePayment}
        />
      )}

      {/* Member Quick Summary Sheet */}
      {summaryMember && (
        <Modal visible={!!summaryMember} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.summarySheetContent}>
              <View style={styles.summarySheetHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.summarySheetAvatar}>
                    <Text style={styles.summarySheetAvatarText}>
                      {summaryMember.avatar_initials || 'M'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.summarySheetName}>{summaryMember.name}</Text>
                    <Text style={styles.summarySheetRole}>
                      {summaryMember.role || 'Member'} • {summaryMember.phone_number || 'No phone'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setSummaryMember(null)}
                  style={styles.sheetCloseBtn}
                >
                  <X size={18} color={THEME.colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Financial Stats Cards */}
              {(() => {
                const totals = getMemberRowTotal(summaryMember.id);
                const feeRec = getPaymentForCell(summaryMember.id, 'fee');
                const feePaid = feeRec?.amount_paid || 0;
                const paidMonths = MONTH_KEYS.filter((mk) => {
                  const p = getPaymentForCell(summaryMember.id, mk);
                  return (p?.amount_paid || 0) >= (p?.target_amount || defaultMonthly);
                }).length;

                return (
                  <View style={styles.summaryStatsGrid}>
                    <View style={styles.summaryStatBox}>
                      <Text style={styles.summaryStatLabel}>Total Contributed</Text>
                      <Text style={styles.summaryStatValueGreen}>
                        {currency} {totals.paid.toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.summaryStatBox}>
                      <Text style={styles.summaryStatLabel}>Outstanding Due</Text>
                      <Text style={[styles.summaryStatValue, totals.balance > 0 && { color: THEME.colors.error }]}>
                        {currency} {totals.balance.toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.summaryStatBox}>
                      <Text style={styles.summaryStatLabel}>Months Completed</Text>
                      <Text style={styles.summaryStatValue}>
                        {paidMonths} / 12 Months
                      </Text>
                    </View>

                    <View style={styles.summaryStatBox}>
                      <Text style={styles.summaryStatLabel}>Membership Fee</Text>
                      <Text style={[styles.summaryStatValue, feePaid >= defaultFee ? { color: THEME.colors.tertiary } : { color: THEME.colors.amber }]}>
                        {feePaid >= defaultFee ? 'Paid in Full' : `${currency} ${feePaid.toLocaleString()}`}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Action Buttons */}
              <View style={styles.summaryActionsRow}>
                <TouchableOpacity
                  style={styles.summaryShareBtn}
                  onPress={async () => {
                    try {
                      const m = summaryMember;
                      const totals = getMemberRowTotal(m.id);
                      const groupTitle = settings?.group_name || 'Shair Circle Fund';
                      const year = settings?.active_year || 2026;
                      const message = `*${groupTitle} — Contribution Summary*\nMember: ${m.name}\nCycle: ${year}\nTotal Contributed: ${currency} ${totals.paid.toLocaleString()}\nRemaining Dues: ${currency} ${totals.balance.toLocaleString()}\nStatus: ${m.status ? m.status.toUpperCase() : 'ACTIVE'}\n\nGenerated via Shair.`;
                      
                      if (await Sharing.isAvailableAsync()) {
                        const fileUri = `${FileSystem.cacheDirectory || ''}receipt_${m.id}.txt`;
                        await FileSystem.writeAsStringAsync(fileUri, message);
                        await Sharing.shareAsync(fileUri, {
                          mimeType: 'text/plain',
                          dialogTitle: `Share ${m.name}'s Receipt`,
                        });
                      } else {
                        Alert.alert('Member Summary', message);
                      }
                    } catch (err) {
                      Alert.alert('Share Error', 'Could not share the receipt summary.');
                    }
                  }}
                >
                  <Share2 size={14} color={THEME.colors.primary} />
                  <Text style={styles.summaryShareBtnText}>Share Receipt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.summaryManageBtn}
                  onPress={() => {
                    const m = summaryMember;
                    setSummaryMember(null);
                    handleOpenMemberActions(m);
                  }}
                >
                  <Text style={styles.summaryManageBtnText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Cycle Switcher Modal */}
      <Modal visible={cycleModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.memberModalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.modalTitle}>Financial Cycles</Text>
              <TouchableOpacity onPress={() => setCycleModalVisible(false)}>
                <X size={18} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Select or review your annual contribution cycles</Text>

            {AVAILABLE_CYCLES.map((yr) => {
              const isSelected = yr === currentYear;
              const yearRecord = allFinancialYears.find((fy) => fy.year === yr);
              const isClosed = yearRecord?.status === 'closed';

              return (
                <TouchableOpacity
                  key={yr}
                  style={[styles.cycleRow, isSelected && styles.cycleRowSelected]}
                  onPress={() => handleSelectCycle(yr)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    {isClosed ? (
                      <Lock size={18} color={THEME.colors.secondary} />
                    ) : (
                      <Calendar size={18} color={isSelected ? THEME.colors.primary : THEME.colors.textMuted} />
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.cycleYearText, isSelected && styles.cycleYearTextSelected]}>
                          Cycle {yr}
                        </Text>
                        {isClosed && (
                          <View style={styles.cycleClosedBadge}>
                            <Text style={styles.cycleClosedBadgeText}>Closed & Archived</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cycleSubText}>
                        {isSelected
                          ? (isClosed ? 'Active View (Locked Archive)' : 'Active Cycle • Recording Payments')
                          : isClosed
                          ? `Closing Balance: ${currency} ${(yearRecord?.closing_balance || 0).toLocaleString()}`
                          : 'Switch ledger to this cycle'}
                      </Text>
                    </View>
                  </View>
                  {isSelected && <CheckCircle2 size={18} color={THEME.colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Close Financial Year Wizard Modal */}
      <Modal visible={closeYearModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.memberModalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FileCheck2 size={20} color={THEME.colors.primary} />
                <Text style={styles.modalTitle}>Close Financial Year {currentYear}</Text>
              </View>
              <TouchableOpacity onPress={() => setCloseYearModalVisible(false)}>
                <X size={18} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Archive {currentYear} records and open {currentYear + 1} with carried forward balance.
            </Text>

            {/* Financial Audit Summary Box */}
            <View style={styles.yearCloseSummaryBox}>
              <View style={styles.yearCloseSummaryRow}>
                <Text style={styles.yearCloseSummaryLabel}>Total Income Collected:</Text>
                <Text style={styles.yearCloseSummaryValGreen}>{currency} {totalIncome.toLocaleString()}</Text>
              </View>
              <View style={styles.yearCloseSummaryRow}>
                <Text style={styles.yearCloseSummaryLabel}>Total Expenses Incurred:</Text>
                <Text style={styles.yearCloseSummaryValRed}>{currency} {totalExpenses.toLocaleString()}</Text>
              </View>
              {openingBalance > 0 && (
                <View style={styles.yearCloseSummaryRow}>
                  <Text style={styles.yearCloseSummaryLabel}>Prior Carried Forward:</Text>
                  <Text style={styles.yearCloseSummaryVal}>{currency} {openingBalance.toLocaleString()}</Text>
                </View>
              )}
              <View style={[styles.yearCloseSummaryRow, { borderTopWidth: 1, borderTopColor: THEME.colors.border, paddingTop: 6, marginTop: 4 }]}>
                <Text style={[styles.yearCloseSummaryLabel, { fontWeight: '800', color: THEME.colors.text }]}>Net Balance:</Text>
                <Text style={[styles.yearCloseSummaryVal, { fontWeight: '900', color: THEME.colors.primary }]}>{currency} {netBalance.toLocaleString()}</Text>
              </View>
            </View>

            {/* Carry Forward Amount Input */}
            <Text style={styles.fieldLabel}>Amount to Carry Forward to {currentYear + 1} ({currency})</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={`e.g. ${Math.max(0, Math.round(netBalance))}`}
              placeholderTextColor="#9A8E89"
              keyboardType="numeric"
              value={carriedForwardInput}
              onChangeText={setCarriedForwardInput}
            />

            {/* Closing Officer */}
            <Text style={styles.fieldLabel}>Authorized By (Treasurer / Secretary)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Mary Banda (Treasurer)"
              placeholderTextColor="#9A8E89"
              value={officerNameInput}
              onChangeText={setOfficerNameInput}
            />

            {/* Optional Closing Notes */}
            <Text style={styles.fieldLabel}>Closing Notes & Remarks (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 54, textAlignVertical: 'top' }]}
              placeholder="Audited and approved by general assembly..."
              placeholderTextColor="#9A8E89"
              value={closingNotesInput}
              onChangeText={setClosingNotesInput}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setCloseYearModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveModalBtn, { backgroundColor: THEME.colors.primary }]}
                onPress={handleCloseYear}
              >
                <Text style={styles.saveModalBtnText}>Confirm & Close Year</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Backup & Restore Modal */}
      <Modal visible={backupModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.memberModalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.modalTitle}>Local Backup & Restore</Text>
              <TouchableOpacity onPress={() => setBackupModalVisible(false)}>
                <X size={18} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Save a local snapshot to your device or restore previous data</Text>

            {/* Export action */}
            <TouchableOpacity style={styles.backupExportBtn} onPress={handleExportBackup}>
              <Download size={18} color="#FFFFFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.backupExportBtnText}>Export Backup File (.json)</Text>
                <Text style={styles.backupExportBtnSub}>Share to WhatsApp, Google Drive, or local storage</Text>
              </View>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: THEME.colors.border, marginVertical: 14 }} />

            {/* Restore action */}
            <Text style={styles.fieldLabel}>Restore from JSON Text</Text>
            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Paste backup JSON data here..."
              placeholderTextColor="#9A8E89"
              value={restoreJsonInput}
              onChangeText={setRestoreJsonInput}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setBackupModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveModalBtn, { backgroundColor: THEME.colors.secondary }]}
                onPress={handleRestoreBackup}
              >
                <Text style={styles.saveModalBtnText}>Restore Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Contributor Modal */}
      <Modal visible={newMemberModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.memberModalContent}>
            <Text style={styles.modalTitle}>Add New Contributor</Text>
            <Text style={styles.modalSub}>Enter the contributor's details below</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Full Name (e.g. Grace Banda)"
              placeholderTextColor="#9A8E89"
              value={newMemberName}
              onChangeText={setNewMemberName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number (e.g. +265 999 999 999)"
              placeholderTextColor="#9A8E89"
              keyboardType="phone-pad"
              value={newMemberPhone}
              onChangeText={setNewMemberPhone}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setNewMemberModalVisible(false)}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={handleCreateMember}>
                <Text style={styles.saveModalBtnText}>Add Contributor</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Member Management Modal */}
      {selectedMember && (
        <Modal visible={!!selectedMember} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.memberModalContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.modalTitle}>Manage Contributor</Text>
                <TouchableOpacity onPress={handleDeleteMember} style={styles.deleteMemberPill}>
                  <Trash2 size={13} color={THEME.colors.error} />
                  <Text style={styles.deleteMemberPillText}>Delete</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSub}>Edit identity, status, or add notes</Text>

              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput style={styles.modalInput} placeholder="Full Name" placeholderTextColor="#9A8E89" value={editName} onChangeText={setEditName} />

              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput style={styles.modalInput} placeholder="+265 999 999 999" placeholderTextColor="#9A8E89" keyboardType="phone-pad" value={editPhone} onChangeText={setEditPhone} />

              <Text style={styles.fieldLabel}>Role</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. Member, Treasurer, Secretary" placeholderTextColor="#9A8E89" value={editRole} onChangeText={setEditRole} />

              <Text style={styles.fieldLabel}>Membership Status</Text>
              <View style={styles.statusSelectRow}>
                {(
                  [
                    { key: 'active' as const, Icon: UserCheck, label: 'Active', activeStyle: styles.statusActiveOption },
                    { key: 'stopped' as const, Icon: UserX, label: 'Stopped', activeStyle: styles.statusStoppedOption },
                    { key: 'transferred' as const, Icon: ArrowRightLeft, label: 'Transferred', activeStyle: styles.statusTransferredOption },
                  ]
                ).map(({ key, Icon, label, activeStyle }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.statusOption, editStatus === key && activeStyle]}
                    onPress={() => setEditStatus(key)}
                  >
                    <Icon size={14} color={editStatus === key ? '#FFF' : THEME.colors.textMuted} />
                    <Text style={[styles.statusOptionText, editStatus === key && styles.statusOptionTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {editStatus !== 'active' && (
                <View style={{ marginTop: 4 }}>
                  <Text style={styles.fieldLabel}>Reason / Transfer Destination</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Relocated to Blantyre / Withdrew in March"
                    placeholderTextColor="#9A8E89"
                    value={editReason}
                    onChangeText={setEditReason}
                  />
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setSelectedMember(null)}>
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveMemberChanges}>
                  <Text style={styles.saveModalBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Group Name Modal */}
      <Modal visible={editGroupNameVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.memberModalContent}>
            <Text style={styles.modalTitle}>Edit Group Name</Text>
            <Text style={styles.modalSub}>Customize your organization or circle title</Text>

            <Text style={styles.fieldLabel}>Group / Organization Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Sahodari Circle Fund"
              placeholderTextColor="#9A8E89"
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setEditGroupNameVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveGroupName}>
                <Text style={styles.saveModalBtnText}>Save Title</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },

  actionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.xs,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  pillBadgeText: { fontSize: 11, fontWeight: '700', color: THEME.colors.primary },

  actionIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 4,
  },
  actionIconBtnText: { fontSize: 11, fontWeight: '700', color: THEME.colors.textMuted },

  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 4,
  },
  exportBtnText: { fontSize: 11, fontWeight: '700', color: THEME.colors.primary },

  stripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: THEME.borderRadius.full,
    gap: 4,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  stripButtonText: { fontSize: 11, fontWeight: '700' },

  searchBarContainer: {
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 13, color: THEME.colors.text, marginLeft: 8, padding: 0 },
  filterTabs: { flexDirection: 'row', gap: 6, paddingVertical: 2 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  activeTab: { backgroundColor: THEME.colors.text, borderColor: THEME.colors.text },
  activeTabGreen: { backgroundColor: THEME.colors.tertiary, borderColor: THEME.colors.tertiary },
  activeTabGreenText: { color: '#FFF' },
  activeTabRed: { backgroundColor: THEME.colors.error, borderColor: THEME.colors.error },
  activeTabRedText: { color: '#FFF' },
  activeTabPlum: { backgroundColor: THEME.colors.secondary, borderColor: THEME.colors.secondary },
  activeTabPlumText: { color: '#FFF' },
  activeTabDue: { backgroundColor: THEME.colors.errorLight, borderColor: THEME.colors.errorLight },
  tabText: { fontSize: 11, fontWeight: '700', color: THEME.colors.textMuted },
  activeTabText: { color: '#FFF' },
  activeTabDueText: { color: THEME.colors.error },

  tableCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.borderRadius.lg,
    borderTopRightRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginHorizontal: THEME.spacing.sm,
    overflow: 'hidden',
  },

  leftPanel: {
    backgroundColor: THEME.colors.surface,
    elevation: 4,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  headerRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceContainer,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  headerCellText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  customColHeader: { backgroundColor: 'rgba(126, 79, 112, 0.08)' },

  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
    alignItems: 'center',
    height: ROW_HEIGHT,
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  activeTouchCell: {
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    borderRadius: 6,
    backgroundColor: THEME.colors.primaryLight,
  },

  nameCell: {
    width: NAME_W,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 8,
    gap: 6,
    height: ROW_HEIGHT,
  },

  srText: { fontSize: 11, fontWeight: '700', color: THEME.colors.textMuted },
  initialsCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: THEME.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: { fontSize: 10, fontWeight: '800', color: THEME.colors.primary },
  memberNameText: { fontSize: 12, fontWeight: '700', color: THEME.colors.text },
  memberRoleText: { fontSize: 10, color: THEME.colors.textMuted },

  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.full,
  },
  statusPillText: { fontSize: 9, fontWeight: '800' },
  statusPillActive: { backgroundColor: THEME.colors.tertiaryLight },
  statusPillTextActive: { color: THEME.colors.tertiary },
  statusPillStopped: { backgroundColor: THEME.colors.errorLight },
  statusPillTextStopped: { color: THEME.colors.error },
  statusPillTransferred: { backgroundColor: THEME.colors.secondaryLight },
  statusPillTextTransferred: { color: THEME.colors.secondary },

  badgePill: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.full,
    minWidth: 64,
    alignItems: 'center',
  },
  badgePaid: { backgroundColor: THEME.colors.tertiaryLight },
  badgeCustomPaid: { backgroundColor: THEME.colors.secondaryLight },
  badgePartial: { backgroundColor: THEME.colors.amberLight },
  badgeUnpaid: { backgroundColor: 'transparent' },
  badgeText: { fontSize: 10, fontWeight: '700', fontVariant: ['tabular-nums'] },
  badgeTextPaid: { color: THEME.colors.tertiary },
  badgeTextUnpaid: { color: '#B5ABA5' },

  rowTotalPaid: { fontSize: 11, fontWeight: '800', color: THEME.colors.text, fontVariant: ['tabular-nums'] },
  rowTotalDue: { fontSize: 9, fontWeight: '700', color: THEME.colors.error },

  footerRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceContainer,
    borderTopWidth: 2,
    borderTopColor: THEME.colors.border,
    alignItems: 'center',
    height: 42,
  },
  footerLabel: { fontSize: 10, fontWeight: '800', color: THEME.colors.textMuted, textTransform: 'uppercase' },
  footerTotalVal: { fontSize: 10, fontWeight: '800', color: THEME.colors.tertiary, fontVariant: ['tabular-nums'] },
  grandTotalVal: { fontSize: 12, fontWeight: '800', color: THEME.colors.primary, fontVariant: ['tabular-nums'] },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: THEME.spacing.lg,
  },
  memberModalContent: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: THEME.colors.text },
  modalSub: { fontSize: 12, color: THEME.colors.textMuted, marginBottom: THEME.spacing.md },
  modalInput: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
    color: THEME.colors.text,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelModalBtn: { paddingVertical: 8, paddingHorizontal: 14 },
  cancelModalBtnText: { color: THEME.colors.textMuted, fontWeight: '600', fontSize: 13 },
  saveModalBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: THEME.borderRadius.sm,
  },
  saveModalBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  deleteMemberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.errorLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
  },
  deleteMemberPillText: { fontSize: 11, fontWeight: '700', color: THEME.colors.error },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: THEME.colors.textMuted, marginBottom: 4 },
  statusSelectRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surfaceContainer,
    gap: 4,
  },
  statusActiveOption: { backgroundColor: THEME.colors.tertiary },
  statusStoppedOption: { backgroundColor: THEME.colors.error },
  statusTransferredOption: { backgroundColor: THEME.colors.secondary },
  statusOptionText: { fontSize: 11, fontWeight: '700', color: THEME.colors.textMuted },
  statusOptionTextSelected: { color: '#FFF' },

  // Cycle Switcher Styles
  cycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 8,
  },
  cycleRowSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryLight,
  },
  cycleYearText: { fontSize: 14, fontWeight: '700', color: THEME.colors.text },
  cycleYearTextSelected: { color: THEME.colors.primary },
  cycleSubText: { fontSize: 11, color: THEME.colors.textMuted, marginTop: 1 },

  // Backup & Restore Styles
  backupExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: THEME.colors.primary,
    padding: 14,
    borderRadius: THEME.borderRadius.md,
  },
  backupExportBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  backupExportBtnSub: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, marginTop: 2 },

  // Quick Member Summary Bottom Sheet Styles
  summarySheetContent: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 20,
    padding: 18,
    elevation: 10,
  },
  summarySheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  summarySheetAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summarySheetAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  summarySheetName: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  summarySheetRole: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  summaryStatBox: {
    width: '48%',
    backgroundColor: THEME.colors.surfaceContainer,
    borderRadius: 12,
    padding: 12,
  },
  summaryStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.text,
    fontVariant: ['tabular-nums'],
  },
  summaryStatValueGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.tertiary,
    fontVariant: ['tabular-nums'],
  },
  summaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  summaryShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.sm,
  },
  summaryShareBtnText: {
    color: THEME.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  summaryManageBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: THEME.borderRadius.sm,
  },

  // Empty Table Container Styles
  emptyTableContainer: {
    marginHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyTableIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTableTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.text,
    marginBottom: 6,
  },
  emptyTableSub: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  emptyTableAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: THEME.borderRadius.md,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTableAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  summaryManageBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Cycle switcher badge styles
  cycleClosedBadge: {
    backgroundColor: THEME.colors.secondaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cycleClosedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.secondary,
  },

  // Year close wizard summary styles
  yearCloseSummaryBox: {
    backgroundColor: THEME.colors.surfaceContainer,
    borderRadius: THEME.borderRadius.sm,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  yearCloseSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  yearCloseSummaryLabel: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  yearCloseSummaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  yearCloseSummaryValGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.tertiary,
  },
  yearCloseSummaryValRed: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.error,
  },
});
