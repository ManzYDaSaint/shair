import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppProvider, useApp } from './src/context/AppContext';
import { SplashScreen } from './src/screens/SplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { LedgerMatrixScreen } from './src/screens/LedgerMatrixScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { CustomColumnsScreen } from './src/screens/CustomColumnsScreen';
import { BottomNavBar, ScreenTab } from './src/components/BottomNavBar';
import { THEME } from './src/constants/theme';

const ONBOARDING_STORAGE_KEY = '@shair_has_onboarded_v1';

function MainNavigator() {
  const { loading, expenses, customColumns, updateGroupSettings } = useApp();
  const [currentTab, setCurrentTab] = useState<ScreenTab>('matrix');
  const [appStage, setAppStage] = useState<'splash' | 'onboarding' | 'main'>('splash');
  const [checkingStorage, setCheckingStorage] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const val = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (val === 'true') {
          // Returning treasurer
          setCheckingStorage(false);
        } else {
          // First time treasurer
          setCheckingStorage(false);
        }
      } catch (e) {
        setCheckingStorage(false);
      }
    };
    checkOnboarding();
  }, []);

  const handleSplashFinish = async () => {
    try {
      const val = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (val === 'true') {
        setAppStage('main');
      } else {
        setAppStage('onboarding');
      }
    } catch {
      setAppStage('main');
    }
  };

  const handleOnboardingComplete = async (config: {
    groupName: string;
    activeYear: number;
    monthlyTarget: number;
    membershipFee: number;
  }) => {
    try {
      await updateGroupSettings({
        group_name: config.groupName,
        active_year: config.activeYear,
        default_monthly_contribution: config.monthlyTarget,
        default_membership_fee: config.membershipFee,
      });
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (e) {
      console.error('Error saving onboarding config:', e);
    }
    setAppStage('main');
  };

  // 1. Splash Screen
  if (appStage === 'splash') {
    return (
      <View style={styles.fullScreen}>
        <StatusBar style="light" />
        <SplashScreen onFinish={handleSplashFinish} />
      </View>
    );
  }

  // 2. Onboarding Screen
  if (appStage === 'onboarding') {
    return (
      <View style={[styles.fullScreen, { paddingTop: Math.max(insets.top, 24) }]}>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </View>
    );
  }

  // 3. Database loading indicator
  if (loading || checkingStorage) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loaderText}>Opening Shair Ledger...</Text>
      </View>
    );
  }

  // 4. Main App
  const topBuffer = Math.max(insets.top, Platform.OS === 'android' ? 36 : 24);

  return (
    <View style={[styles.mainWrapper, { paddingTop: topBuffer }]}>
      <StatusBar style="dark" />

      {/* Screen View */}
      <View style={styles.contentContainer}>
        {currentTab === 'matrix' && (
          <LedgerMatrixScreen
            onOpenExpenses={() => setCurrentTab('expenses')}
            onOpenColumns={() => setCurrentTab('columns')}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensesScreen onBack={() => setCurrentTab('matrix')} />
        )}

        {currentTab === 'columns' && (
          <CustomColumnsScreen onBack={() => setCurrentTab('matrix')} />
        )}
      </View>

      {/* Modern Bottom Navigation Bar */}
      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        totalExpensesCount={expenses.length}
        totalColumnsCount={customColumns.length}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#2A1017',
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
});
