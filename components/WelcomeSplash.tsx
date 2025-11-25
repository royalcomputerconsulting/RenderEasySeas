import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ship, Anchor, Waves } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface WelcomeSplashProps {
  onAnimationComplete: () => void;
  duration?: number;
}

const { width, height } = Dimensions.get('window');

export function WelcomeSplash({ onAnimationComplete, duration = 2500 }: WelcomeSplashProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const shipSlide = useRef(new Animated.Value(-50)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('[WelcomeSplash] Starting animation');

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shipSlide, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timer = setTimeout(() => {
      console.log('[WelcomeSplash] Animation complete');
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, shipSlide, waveAnim, duration, onAnimationComplete]);

  const waveTranslate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[COLORS.navyDeep, COLORS.navyMedium, COLORS.navyLight]}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: shipSlide },
              ],
            },
          ]}
        >
          <View style={styles.iconRow}>
            <Anchor size={32} color={COLORS.beigeWarm} />
            <Ship size={64} color={COLORS.textPrimary} style={styles.shipIcon} />
            <Anchor size={32} color={COLORS.beigeWarm} />
          </View>
          
          <Text style={styles.title}>Easy Seas</Text>
          <Text style={styles.subtitle}>Manage your Nautical Lifestyle</Text>
          
          <Animated.View
            style={[
              styles.waveContainer,
              { transform: [{ translateY: waveTranslate }] },
            ]}
          >
            <Waves size={100} color={COLORS.beigeWarm} strokeWidth={1} />
          </Animated.View>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Track • Plan • Save</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  shipIcon: {
    marginHorizontal: SPACING.lg,
  },
  title: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.beigeWarm,
    letterSpacing: 1,
  },
  waveContainer: {
    marginTop: SPACING.xxxl,
    opacity: 0.6,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
