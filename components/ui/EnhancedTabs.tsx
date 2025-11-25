import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import type { LucideIcon } from 'lucide-react-native';

interface Tab {
  key: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

interface EnhancedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabPress: (key: string) => void;
  variant?: 'pill' | 'underline' | 'segmented';
}

export function EnhancedTabs({
  tabs,
  activeTab,
  onTabPress,
  variant = 'pill',
}: EnhancedTabsProps) {
  const scaleValues = useRef(tabs.map(() => new Animated.Value(1))).current;

  const handlePressIn = useCallback((index: number) => {
    Animated.spring(scaleValues[index], {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scaleValues]);

  const handlePressOut = useCallback((index: number) => {
    Animated.spring(scaleValues[index], {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scaleValues]);

  const handlePress = useCallback((key: string, index: number) => {
    handlePressOut(index);
    onTabPress(key);
  }, [onTabPress, handlePressOut]);

  if (variant === 'underline') {
    return (
      <View style={styles.underlineContainer}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <Animated.View
              key={tab.key}
              style={{ transform: [{ scale: scaleValues[index] }], flex: 1 }}
            >
              <TouchableOpacity
                style={[styles.underlineTab, isActive && styles.underlineTabActive]}
                onPress={() => handlePress(tab.key, index)}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                activeOpacity={1}
              >
                {Icon && (
                  <Icon 
                    size={16} 
                    color={isActive ? COLORS.beigeWarm : COLORS.textSecondary} 
                  />
                )}
                <Text style={[styles.underlineText, isActive && styles.underlineTextActive]}>
                  {tab.label}
                </Text>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {isActive && <View style={styles.underlineIndicator} />}
            </Animated.View>
          );
        })}
      </View>
    );
  }

  if (variant === 'segmented') {
    return (
      <View style={styles.segmentedContainer}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.2)']}
          style={styles.segmentedBackground}
        />
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <Animated.View
              key={tab.key}
              style={{ transform: [{ scale: scaleValues[index] }], flex: 1 }}
            >
              <TouchableOpacity
                style={styles.segmentedTab}
                onPress={() => handlePress(tab.key, index)}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                activeOpacity={1}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[COLORS.beigeWarm, COLORS.goldDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.segmentedActiveBackground}
                  >
                    {Icon && <Icon size={14} color={COLORS.navyDeep} />}
                    <Text style={styles.segmentedTextActive}>{tab.label}</Text>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <View style={styles.badgeActive}>
                        <Text style={styles.badgeTextActive}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                      </View>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={styles.segmentedInactiveContent}>
                    {Icon && <Icon size={14} color={COLORS.textSecondary} />}
                    <Text style={styles.segmentedText}>{tab.label}</Text>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.pillContainer}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.25)', 'rgba(0, 0, 0, 0.15)']}
        style={styles.pillBackground}
      />
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;
        return (
          <Animated.View
            key={tab.key}
            style={{ transform: [{ scale: scaleValues[index] }], flex: 1 }}
          >
            <TouchableOpacity
              style={styles.pillTab}
              onPress={() => handlePress(tab.key, index)}
              onPressIn={() => handlePressIn(index)}
              onPressOut={() => handlePressOut(index)}
              activeOpacity={1}
            >
              {isActive ? (
                <LinearGradient
                  colors={[COLORS.beigeWarm, COLORS.goldDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.pillActiveBackground}
                >
                  {Icon && <Icon size={14} color={COLORS.navyDeep} />}
                  <Text style={styles.pillTextActive}>{tab.label}</Text>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <View style={styles.badgeActive}>
                      <Text style={styles.badgeTextActive}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                    </View>
                  )}
                </LinearGradient>
              ) : (
                <View style={styles.pillInactiveContent}>
                  {Icon && <Icon size={14} color={COLORS.textSecondary} />}
                  <Text style={styles.pillText}>{tab.label}</Text>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.xl,
    padding: 4,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  pillBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.xl,
  },
  pillTab: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  pillActiveBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: 4,
    ...SHADOW.md,
  },
  pillInactiveContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    gap: 4,
  },
  pillText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textSecondary,
  },
  pillTextActive: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.navyDeep,
  },
  underlineContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 116, 0.2)',
    marginBottom: SPACING.md,
  },
  underlineTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: 6,
  },
  underlineTabActive: {},
  underlineText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textSecondary,
  },
  underlineTextActive: {
    color: COLORS.beigeWarm,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  underlineIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: COLORS.beigeWarm,
    borderRadius: BORDER_RADIUS.round,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: 3,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.15)',
    ...SHADOW.sm,
  },
  segmentedBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.lg,
  },
  segmentedTab: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  segmentedActiveBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
    ...SHADOW.sm,
  },
  segmentedInactiveContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    gap: 4,
  },
  segmentedText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textSecondary,
  },
  segmentedTextActive: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.navyDeep,
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.round,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: COLORS.white,
  },
  badgeActive: {
    backgroundColor: 'rgba(0, 31, 63, 0.3)',
    borderRadius: BORDER_RADIUS.round,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeTextActive: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: COLORS.navyDeep,
  },
});
