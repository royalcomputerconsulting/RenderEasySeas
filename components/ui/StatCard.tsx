import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import type { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
  compact?: boolean;
  highlight?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = COLORS.beigeWarm,
  trend,
  trendValue,
  onPress,
  compact = false,
  highlight = false,
}: StatCardProps) {
  const content = (
    <View style={[styles.container, compact && styles.containerCompact, highlight && styles.containerHighlight]}>
      {highlight && (
        <LinearGradient
          colors={['rgba(212, 165, 116, 0.15)', 'rgba(212, 165, 116, 0.05)']}
          style={StyleSheet.absoluteFill}
        />
      )}
      
      <View style={styles.header}>
        {Icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
            <Icon size={compact ? 16 : 20} color={iconColor} />
          </View>
        )}
        {trend && (
          <View style={[
            styles.trendBadge,
            trend === 'up' && styles.trendUp,
            trend === 'down' && styles.trendDown,
          ]}>
            <Text style={[
              styles.trendText,
              trend === 'up' && styles.trendTextUp,
              trend === 'down' && styles.trendTextDown,
            ]}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.value, compact && styles.valueCompact]} numberOfLines={1}>
        {value}
      </Text>
      
      <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={1}>
        {title}
      </Text>
      
      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  containerCompact: {
    padding: SPACING.sm,
  },
  containerHighlight: {
    borderColor: COLORS.beigeWarm,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  trendUp: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  trendDown: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  trendText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  trendTextUp: {
    color: COLORS.success,
  },
  trendTextDown: {
    color: COLORS.error,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSizeTitle,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    marginBottom: 2,
  },
  valueCompact: {
    fontSize: TYPOGRAPHY.fontSizeXL,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  titleCompact: {
    fontSize: TYPOGRAPHY.fontSizeXS,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginTop: 2,
    opacity: 0.7,
  },
});
