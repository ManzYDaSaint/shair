import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { THEME } from '../constants/theme';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Lock,
  MoveVertical,
  Columns,
  Layers,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from 'lucide-react-native';

export const CustomColumnsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { customColumns, settings, addCustomColumn, toggleCustomColumn, reorderCustomColumn, deleteCustomColumn } = useApp();
  const currency = settings?.currency_symbol || '$';

  const [modalVisible, setModalVisible] = useState(false);
  const [columnName, setColumnName] = useState('');
  const [defaultAmount, setDefaultAmount] = useState('');

  const handleAddColumn = async () => {
    const num = parseFloat(defaultAmount) || 0;
    if (!columnName.trim()) {
      Alert.alert('Required', 'Please enter a name for the column (e.g. Welfare, Uniform, Party Levy)');
      return;
    }
    await addCustomColumn(columnName.trim(), num);
    setColumnName('');
    setDefaultAmount('');
    setModalVisible(false);
  };

  const handleDelete = (id: number, label: string) => {
    Alert.alert(
      'Remove Column',
      `Delete "${label}"? Any payment records logged under this column will be removed from totals.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteCustomColumn(id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={20} color={THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customize Ledger Columns</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus size={16} color="#FFF" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Tailor Your Table Columns</Text>
          <Text style={styles.bannerDesc}>
            Add specialized funds like Welfare, Uniforms, Emergency Levies, or Party fees. They automatically show up on the ledger table and calculate in member totals.
          </Text>
        </View>

        {/* Section: Locked Standard Columns */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Core System Columns (Locked)</Text>
          
          <View style={styles.columnCardLocked}>
            <View style={styles.columnIconLocked}>
              <Lock size={16} color={THEME.colors.textMuted} />
            </View>
            <View style={styles.columnInfo}>
              <Text style={styles.columnTitle}>SR & Member Name</Text>
              <Text style={styles.columnSub}>Sticky identity identifiers on matrix left</Text>
            </View>
            <View style={styles.defaultPill}>
              <Text style={styles.defaultPillText}>LOCKED</Text>
            </View>
          </View>

          <View style={styles.columnCardLocked}>
            <View style={styles.columnIconLocked}>
              <Lock size={16} color={THEME.colors.textMuted} />
            </View>
            <View style={styles.columnInfo}>
              <Text style={styles.columnTitle}>Membership Fee</Text>
              <Text style={styles.columnSub}>{currency}{settings?.default_membership_fee || 5000} base annual / entry dues</Text>
            </View>
            <View style={styles.defaultPill}>
              <Text style={styles.defaultPillText}>REQUIRED</Text>
            </View>
          </View>

          <View style={styles.columnCardLocked}>
            <View style={styles.columnIconLocked}>
              <Lock size={16} color={THEME.colors.textMuted} />
            </View>
            <View style={styles.columnInfo}>
              <Text style={styles.columnTitle}>Months of the Year (Jan – Dec)</Text>
              <Text style={styles.columnSub}>12 individual monthly contribution columns</Text>
            </View>
            <View style={styles.defaultPill}>
              <Text style={styles.defaultPillText}>12 COLS</Text>
            </View>
          </View>
        </View>

        {/* Section: Customizable Columns */}
        <View style={styles.section}>
          <View style={styles.customSectionHeader}>
            <Text style={styles.sectionHeader}>Custom Fund Columns ({customColumns.length})</Text>
            <Text style={styles.sectionSubHint}>Toggle switches to show or hide in ledger</Text>
          </View>

          {customColumns.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No custom columns added yet.</Text>
              <Text style={styles.emptySub}>Tap "+ New" above to add Welfare, Events, or Penalties.</Text>
            </View>
          ) : (
            customColumns.map((col, index) => (
              <View key={col.id} style={styles.columnCard}>
                {/* Reorder Buttons */}
                <View style={styles.reorderColumnBox}>
                  <TouchableOpacity
                    style={[styles.reorderBtn, index === 0 && { opacity: 0.3 }]}
                    disabled={index === 0}
                    onPress={() => reorderCustomColumn(col.id, 'up')}
                  >
                    <ArrowUp size={14} color={THEME.colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reorderBtn, index === customColumns.length - 1 && { opacity: 0.3 }]}
                    disabled={index === customColumns.length - 1}
                    onPress={() => reorderCustomColumn(col.id, 'down')}
                  >
                    <ArrowDown size={14} color={THEME.colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.columnIcon}>
                  <Columns size={16} color={THEME.colors.secondary} />
                </View>
                <View style={styles.columnInfo}>
                  <Text style={styles.columnTitle}>{col.column_label}</Text>
                  <Text style={styles.columnSub}>
                    Default target: {currency}{col.default_amount} per member
                  </Text>
                </View>

                {/* Switch to enable/disable */}
                <Switch
                  value={col.is_enabled === 1}
                  onValueChange={(val) => toggleCustomColumn(col.id, val)}
                  trackColor={{ false: '#E2DCD8', true: THEME.colors.secondary }}
                  thumbColor="#FFF"
                />

                <TouchableOpacity
                  style={styles.deleteColBtn}
                  onPress={() => handleDelete(col.id, col.column_label)}
                >
                  <Trash2 size={16} color={THEME.colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Column Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Column</Text>
            <Text style={styles.modalSub}>
              This will create a new editable column in the contribution table
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Column Name (e.g. Welfare, Uniform, Party Levy)"
              placeholderTextColor="#9A8E89"
              value={columnName}
              onChangeText={setColumnName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Default Amount Due per contributor (e.g. 10)"
              placeholderTextColor="#9A8E89"
              keyboardType="numeric"
              value={defaultAmount}
              onChangeText={setDefaultAmount}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveColBtn} onPress={handleAddColumn}>
                <Text style={styles.saveColBtnText}>Add Column</Text>
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
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.secondary,
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
  content: {
    flex: 1,
    padding: THEME.spacing.lg,
  },
  banner: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.full,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 6,
  },
  bannerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.secondary,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 18,
  },
  section: {
    marginBottom: THEME.spacing.lg,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: 8,
  },
  customSectionHeader: {
    marginBottom: 8,
  },
  sectionSubHint: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  columnCardLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceContainer,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 8,
    opacity: 0.85,
  },
  columnIconLocked: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  columnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  reorderColumnBox: {
    flexDirection: 'column',
    marginRight: 8,
    gap: 4,
  },
  reorderBtn: {
    padding: 3,
    backgroundColor: THEME.colors.surfaceContainer,
    borderRadius: THEME.borderRadius.sm,
  },
  columnIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  columnInfo: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  columnSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  defaultPill: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.sm,
  },
  defaultPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
  },
  deleteColBtn: {
    padding: 8,
    marginLeft: 8,
  },
  emptyCard: {
    backgroundColor: THEME.colors.surface,
    padding: 20,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
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
  modalInput: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
    color: THEME.colors.text,
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
  saveColBtn: {
    backgroundColor: THEME.colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: THEME.borderRadius.sm,
  },
  saveColBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
