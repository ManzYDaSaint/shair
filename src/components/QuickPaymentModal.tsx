import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Check, X, CreditCard, Banknote, ShieldCheck } from 'lucide-react-native';

interface QuickPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  memberName: string;
  itemTitle: string;
  currentPaid: number;
  targetAmount: number;
  currency: string;
  onSave: (amount: number) => void;
}

export const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  visible,
  onClose,
  memberName,
  itemTitle,
  currentPaid,
  targetAmount,
  currency,
  onSave,
}) => {
  const [customAmount, setCustomAmount] = useState<string>(currentPaid > 0 ? String(currentPaid) : '');

  const handleMarkFull = () => {
    onSave(targetAmount);
    onClose();
  };

  const handleCustomSubmit = () => {
    const val = parseFloat(customAmount) || 0;
    onSave(val);
    onClose();
  };

  const handleReset = () => {
    onSave(0);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Update Contribution</Text>
                  <Text style={styles.subtitle}>{memberName} • {itemTitle}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color={THEME.colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Target info */}
              <View style={styles.targetCard}>
                <Text style={styles.targetLabel}>Standard Target Due</Text>
                <Text style={styles.targetValue}>{currency} {targetAmount.toLocaleString()}</Text>
              </View>

              {/* Action 1: Mark Full Paid */}
              <TouchableOpacity style={styles.fullPaidBtn} onPress={handleMarkFull} activeOpacity={0.85}>
                <View style={styles.fullPaidIcon}>
                  <Check size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fullPaidTitle}>Mark Fully Paid</Text>
                  <Text style={styles.fullPaidDesc}>Record full target of {currency} {targetAmount.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>

              {/* Quick Amount Chips */}
              <View style={styles.chipsContainer}>
                <Text style={styles.chipsLabel}>Quick Presets:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                  {[Math.round(targetAmount / 2), targetAmount, 5000, 10000]
                    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                    .map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        style={styles.presetChip}
                        onPress={() => setCustomAmount(String(preset))}
                      >
                        <Text style={styles.presetChipText}>+{preset.toLocaleString()}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>

              {/* Action 2: Custom / Partial Amount */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Or Enter Partial / Custom Amount</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.currencyPrefix}>{currency}</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#A89E99"
                    value={customAmount}
                    onChangeText={setCustomAmount}
                  />
                  <TouchableOpacity style={styles.saveBtn} onPress={handleCustomSubmit}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reset button */}
              {currentPaid > 0 && (
                <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                  <Text style={styles.resetBtnText}>Clear / Mark as Unpaid</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(21, 28, 37, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceContainer,
  },
  targetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceContainer,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
  },
  targetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  targetValue: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  fullPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.tertiary,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  fullPaidIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPaidTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fullPaidDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  inputContainer: {
    marginBottom: THEME.spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.text,
    paddingVertical: 10,
  },
  saveBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.sm,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resetBtnText: {
    color: THEME.colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  chipsContainer: {
    marginBottom: THEME.spacing.md,
  },
  chipsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
});
