import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { THEME } from '../constants/theme';
import { Sparkles, ShieldCheck } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Gentle pulse on emblem
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Auto transition after 2 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, pulseAnim, onFinish]);

  return (
    <View style={styles.container}>
      {/* Decorative ambient glowing accents */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Animated Brand Emblem */}
        <Animated.View
          style={[
            styles.emblemContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.innerEmblem}>
            <Sparkles size={34} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Brand Title */}
        <Text style={styles.brandTitle}>Shair</Text>
        <Text style={styles.brandTagline}>Women's Community Contribution</Text>

        {/* Security & Vault Pill */}
        <View style={styles.secureBadge}>
          <ShieldCheck size={14} color="#34D399" />
          <Text style={styles.secureBadgeText}>100% Private Offline Vault</Text>
        </View>
      </Animated.View>

      {/* Footer copyright / cycle indicator */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made for Treasurers & Sisterhood Groups</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A1017', // Rich deep cocoa/plum
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: THEME.colors.primary,
    opacity: 0.28,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -90,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#7E4F70',
    opacity: 0.25,
  },
  contentWrapper: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emblemContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  innerEmblem: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFDAD2',
    textAlign: 'center',
    marginBottom: 20,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  secureBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  footer: {
    position: 'absolute',
    bottom: 36,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.45)',
  },
});
