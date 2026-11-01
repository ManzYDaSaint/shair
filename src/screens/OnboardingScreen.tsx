import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { THEME } from '../constants/theme';
import {
  Sparkles,
  Users,
  Calendar,
  Banknote,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: (config: {
    groupName: string;
    activeYear: number;
    monthlyTarget: number;
    membershipFee: number;
  }) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Group setup inputs
  const [groupName, setGroupName] = useState('');
  const [activeYear, setActiveYear] = useState(2026);
  const [monthlyTarget, setMonthlyTarget] = useState('5000');
  const [membershipFee, setMembershipFee] = useState('5000');

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      const finalName = groupName.trim() || 'Sahodari Circle Fund';
      const parsedMonthly = parseFloat(monthlyTarget) || 5000;
      const parsedFee = parseFloat(membershipFee) || 5000;

      onComplete({
        groupName: finalName,
        activeYear,
        monthlyTarget: parsedMonthly,
        membershipFee: parsedFee,
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'android' ? undefined : 'padding'}
    >
      {/* Decorative ambient background accents */}
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      {/* Top Header Bar */}
      <View style={styles.topNav}>
        {currentStep > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <ArrowLeft size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}

        <View style={styles.stepIndicators}>
          {[0, 1, 2].map((idx) => (
            <View
              key={idx}
              style={[
                styles.stepDot,
                currentStep === idx && styles.stepDotActive,
                currentStep > idx && styles.stepDotCompleted,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleNext} style={styles.skipBtn}>
          <Text style={styles.skipText}>{currentStep === 2 ? '' : 'Skip'}</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── SLIDE 1: Welcome & Mission ────────────────────────────────────────── */}
        {currentStep === 0 && (
          <View style={styles.slideCard}>
            <View style={styles.iconCircle}>
              <Users size={32} color="#FFFFFF" />
            </View>

            <View style={styles.pillBadge}>
              <Sparkles size={13} color="#FFDAD2" />
              <Text style={styles.pillBadgeText}>WELCOME TREASURER</Text>
            </View>

            <Text style={styles.heroTitle}>Welcome to Shair</Text>
            <Text style={styles.heroDescription}>
              The dead-simple, private mobile ledger crafted specifically for women's monthly
              contributions, membership fees, and group finance.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureBullet}>
                  <CheckCircle2 size={16} color="#34D399" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Full Transparency for All Sisters</Text>
                  <Text style={styles.featureSub}>
                    Track annual cycles, monthly payments, and who is up-to-date at a glance.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureBullet}>
                  <CheckCircle2 size={16} color="#34D399" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>100% Offline & Private</Text>
                  <Text style={styles.featureSub}>
                    All data is securely saved in your phone's local storage. No internet required.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── SLIDE 2: Interactive Group Configuration ─────────────────────────── */}
        {currentStep === 1 && (
          <View style={styles.slideCard}>
            <View style={styles.iconCircle}>
              <Calendar size={30} color="#FFFFFF" />
            </View>

            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>STEP 1 OF 2 • CIRCLE PROFILE</Text>
            </View>

            <Text style={styles.heroTitle}>Set Up Your Circle</Text>
            <Text style={styles.heroDescription}>
              Personalize your association's title and contribution targets for your community.
            </Text>

            {/* Group Title Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Group / Circle Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Sahodari Circle Fund"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>

            {/* Active Financial Cycle */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Starting Financial Cycle</Text>
              <View style={styles.cycleRow}>
                {[2026, 2027, 2028].map((yr) => {
                  const isSelected = activeYear === yr;
                  return (
                    <TouchableOpacity
                      key={yr}
                      style={[styles.cycleChip, isSelected && styles.cycleChipSelected]}
                      onPress={() => setActiveYear(yr)}
                    >
                      <Text style={[styles.cycleChipText, isSelected && styles.cycleChipTextSelected]}>
                        Cycle {yr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Targets Row */}
            <View style={styles.twoColumnRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Monthly Target (MWK)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="5000"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={monthlyTarget}
                  onChangeText={setMonthlyTarget}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Membership Fee (MWK)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="5000"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={membershipFee}
                  onChangeText={setMembershipFee}
                />
              </View>
            </View>
          </View>
        )}

        {/* ─── SLIDE 3: How to Use & Get Started ─────────────────────────────────── */}
        {currentStep === 2 && (
          <View style={styles.slideCard}>
            <View style={styles.iconCircle}>
              <FileSpreadsheet size={30} color="#FFFFFF" />
            </View>

            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>STEP 2 OF 2 • HOW IT WORKS</Text>
            </View>

            <Text style={styles.heroTitle}>Effortless Management</Text>
            <Text style={styles.heroDescription}>
              Three intuitive habits that keep your group organized and error-free:
            </Text>

            <View style={styles.guideSteps}>
              <View style={styles.guideStepItem}>
                <View style={styles.guideStepNum}>
                  <Text style={styles.guideStepNumText}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guideTitle}>Tap Any Cell to Record Payments</Text>
                  <Text style={styles.guideSub}>
                    Mark standard MWK 5,000 paid with 1-tap, or enter partial amounts quickly.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepItem}>
                <View style={styles.guideStepNum}>
                  <Text style={styles.guideStepNumText}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guideTitle}>Log Expenses & Venue Rentals</Text>
                  <Text style={styles.guideSub}>
                    Track refreshment, support, or hall expenses which automatically deduct from the Net Balance.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepItem}>
                <View style={styles.guideStepNum}>
                  <Text style={styles.guideStepNumText}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guideTitle}>Export PDF or Backup Snapshot</Text>
                  <Text style={styles.guideSub}>
                    Generate official PDF reports to share with members in your WhatsApp group.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Footer */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>
            {currentStep === 2 ? 'Enter Shair Ledger' : 'Continue'}
          </Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A1017',
    position: 'relative',
  },
  ambientTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: THEME.colors.primary,
    opacity: 0.25,
  },
  ambientBottom: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#7E4F70',
    opacity: 0.25,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepDotActive: {
    width: 24,
    backgroundColor: THEME.colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: '#34D399',
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  slideCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFDAD2',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 20,
    marginBottom: 20,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 12,
  },
  featureBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 17,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cycleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cycleChip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cycleChipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  cycleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cycleChipTextSelected: {
    color: '#FFFFFF',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  guideSteps: {
    gap: 14,
  },
  guideStepItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  guideStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideStepNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  guideSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 16,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 20 : 34,
    paddingTop: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
