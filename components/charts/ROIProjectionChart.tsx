import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, DollarSign, PiggyBank, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { ROIProjection } from '@/lib/whatIfSimulator';
import { formatCurrency, formatPercentage } from '@/lib/format';



interface ROIProjectionChartProps {
  roiProjection: ROIProjection;
  comparisonROI?: number;
  title?: string;
}

export function ROIProjectionChart({
  roiProjection,
  comparisonROI,
  title = 'ROI Projection',
}: ROIProjectionChartProps) {
  const roiTrend = useMemo(() => {
    if (comparisonROI === undefined) return 'neutral';
    if (roiProjection.projectedROI > comparisonROI) return 'up';
    if (roiProjection.projectedROI < comparisonROI) return 'down';
    return 'neutral';
  }, [roiProjection.projectedROI, comparisonROI]);

  const roiColor = useMemo(() => {
    if (roiProjection.projectedROI >= 50) return COLORS.success;
    if (roiProjection.projectedROI >= 20) return COLORS.warning;
    if (roiProjection.projectedROI >= 0) return COLORS.aquaAccent;
    return COLORS.error;
  }, [roiProjection.projectedROI]);

  const barData = useMemo(() => {
    const maxValue = Math.max(
      roiProjection.totalInvestment,
      roiProjection.projectedValue,
      1
    );
    
    return {
      investmentWidth: (roiProjection.totalInvestment / maxValue) * 100,
      valueWidth: (roiProjection.projectedValue / maxValue) * 100,
      savingsWidth: (roiProjection.savings / maxValue) * 100,
    };
  }, [roiProjection]);

  const valueBreakdown = useMemo(() => {
    const total = roiProjection.projectedValue;
    if (total === 0) return { retail: 33, points: 33, comp: 34 };
    
    const base = roiProjection.totalInvestment;
    const gain = total - base;
    
    return {
      base: Math.min(100, (base / total) * 100),
      gain: Math.min(100 - (base / total) * 100, (gain / total) * 100),
    };
  }, [roiProjection]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(77, 208, 225, 0.15)', 'rgba(77, 208, 225, 0.05)']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <TrendingUp size={18} color={COLORS.aquaAccent} />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={[styles.roiBadge, { backgroundColor: `${roiColor}20` }]}>
            {roiTrend === 'up' && <ArrowUpRight size={12} color={COLORS.success} />}
            {roiTrend === 'down' && <ArrowDownRight size={12} color={COLORS.error} />}
            <Text style={[styles.roiValue, { color: roiColor }]}>
              {formatPercentage(roiProjection.projectedROI, 1)} ROI
            </Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <View style={styles.barChartContainer}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Investment</Text>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    styles.investmentBar,
                    { width: `${barData.investmentWidth}%` },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{formatCurrency(roiProjection.totalInvestment)}</Text>
            </View>
            
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Proj. Value</Text>
              <View style={styles.barWrapper}>
                <LinearGradient
                  colors={[COLORS.success, COLORS.aquaAccent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.bar,
                    { width: `${barData.valueWidth}%`, borderRadius: 4 },
                  ]}
                />
              </View>
              <Text style={[styles.barValue, { color: COLORS.success }]}>
                {formatCurrency(roiProjection.projectedValue)}
              </Text>
            </View>
          </View>

          <View style={styles.valueStackContainer}>
            <Text style={styles.stackLabel}>Value Composition</Text>
            <View style={styles.valueStack}>
              <View
                style={[
                  styles.stackSegment,
                  styles.stackBase,
                  { width: `${valueBreakdown.base}%` },
                ]}
              />
              <View
                style={[
                  styles.stackSegment,
                  styles.stackGain,
                  { width: `${valueBreakdown.gain}%` },
                ]}
              />
            </View>
            <View style={styles.stackLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.textSecondary }]} />
                <Text style={styles.legendText}>Base Investment</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.legendText}>Value Gained</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <DollarSign size={16} color={COLORS.beigeWarm} />
            <Text style={styles.metricValue}>{formatCurrency(roiProjection.savings)}</Text>
            <Text style={styles.metricLabel}>Total Savings</Text>
          </View>
          <View style={styles.metricCard}>
            <PiggyBank size={16} color={COLORS.aquaAccent} />
            <Text style={styles.metricValue}>{formatCurrency(roiProjection.pointsValue)}</Text>
            <Text style={styles.metricLabel}>Points Value</Text>
          </View>
          <View style={styles.metricCard}>
            <Percent size={16} color={COLORS.success} />
            <Text style={styles.metricValue}>{formatPercentage(roiProjection.monthlyROI, 2)}</Text>
            <Text style={styles.metricLabel}>Monthly ROI</Text>
          </View>
        </View>

        {roiProjection.riskAdjustedROI > 0 && (
          <View style={styles.riskAdjustedRow}>
            <Text style={styles.riskAdjustedLabel}>Risk-Adjusted ROI (85% confidence):</Text>
            <Text style={[styles.riskAdjustedValue, { color: roiColor }]}>
              {formatPercentage(roiProjection.riskAdjustedROI, 1)}
            </Text>
          </View>
        )}

        {roiProjection.breakEvenDate && (
          <View style={styles.breakEvenInfo}>
            <Text style={styles.breakEvenText}>
              Break-even projected:{' '}
              <Text style={{ fontWeight: '700' as const, color: COLORS.aquaAccent }}>
                {roiProjection.breakEvenDate.toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.md,
  },
  gradient: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(77, 208, 225, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
  },
  roiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
  },
  roiValue: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  chartSection: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  barChartContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  barLabel: {
    width: 75,
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
  },
  barWrapper: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  investmentBar: {
    backgroundColor: 'rgba(184, 212, 232, 0.5)',
  },
  barValue: {
    width: 70,
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  valueStackContainer: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  stackLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  valueStack: {
    flexDirection: 'row',
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  stackSegment: {
    height: '100%',
  },
  stackBase: {
    backgroundColor: 'rgba(184, 212, 232, 0.4)',
  },
  stackGain: {
    backgroundColor: COLORS.success,
  },
  stackLegend: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  riskAdjustedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  riskAdjustedLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
  },
  riskAdjustedValue: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  breakEvenInfo: {
    backgroundColor: 'rgba(77, 208, 225, 0.1)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.aquaAccent,
  },
  breakEvenText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
  },
});
