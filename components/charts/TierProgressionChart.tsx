import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, TrendingUp, Calendar, Target } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { CLUB_ROYALE_TIERS, TIER_ORDER } from '@/constants/clubRoyaleTiers';
import { generateTimelineProjections, PlayerContext } from '@/lib/whatIfSimulator';
import type { BookedCruise } from '@/types/models';
import { formatNumber } from '@/lib/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 160;
const CHART_PADDING = 20;

interface TierProgressionChartProps {
  playerContext: PlayerContext;
  bookedCruises: BookedCruise[];
  monthsAhead?: number;
}

export function TierProgressionChart({
  playerContext,
  bookedCruises,
  monthsAhead = 24,
}: TierProgressionChartProps) {
  const projections = useMemo(
    () => generateTimelineProjections(playerContext, bookedCruises, monthsAhead),
    [playerContext, bookedCruises, monthsAhead]
  );

  const tierMilestones = useMemo(() => {
    const milestones: { month: number; tier: string; points: number }[] = [];
    let lastTier = projections[0]?.tier || 'Choice';

    projections.forEach((proj) => {
      if (proj.tier !== lastTier) {
        milestones.push({
          month: proj.month,
          tier: proj.tier,
          points: proj.points,
        });
        lastTier = proj.tier;
      }
    });

    return milestones;
  }, [projections]);

  const chartData = useMemo(() => {
    const maxPoints = Math.max(...projections.map((p) => p.points), CLUB_ROYALE_TIERS.Masters.threshold);
    const chartWidth = SCREEN_WIDTH - SPACING.md * 4 - CHART_PADDING * 2;
    const chartHeight = CHART_HEIGHT - CHART_PADDING * 2;

    const points: { x: number; y: number; month: number; pointValue: number; tier: string }[] = [];

    projections.forEach((proj, index) => {
      const x = (index / (projections.length - 1)) * chartWidth + CHART_PADDING;
      const y = chartHeight - (proj.points / maxPoints) * chartHeight + CHART_PADDING;
      points.push({
        x,
        y,
        month: proj.month,
        pointValue: proj.points,
        tier: proj.tier,
      });
    });

    const tierLines = TIER_ORDER.slice(1).map((tier) => {
      const threshold = CLUB_ROYALE_TIERS[tier].threshold;
      const y = chartHeight - (threshold / maxPoints) * chartHeight + CHART_PADDING;
      return {
        tier,
        y,
        threshold,
        color: CLUB_ROYALE_TIERS[tier].color,
      };
    });

    return { points, tierLines, maxPoints, chartWidth, chartHeight };
  }, [projections]);

  const currentTierIndex = TIER_ORDER.indexOf(playerContext.currentTier);
  const nextTier = currentTierIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentTierIndex + 1] : null;
  const nextMilestone = tierMilestones.find((m) => TIER_ORDER.indexOf(m.tier) > currentTierIndex);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Trophy size={18} color="#8B5CF6" />
            </View>
            <Text style={styles.title}>Tier Progression Forecast</Text>
          </View>
          <View style={styles.timeframeBadge}>
            <Calendar size={12} color={COLORS.textSecondary} />
            <Text style={styles.timeframeText}>{monthsAhead} months</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <View style={[styles.chart, { height: CHART_HEIGHT }]}>
            {chartData.tierLines.map((line) => (
              <View key={line.tier} style={styles.tierLineContainer}>
                <View
                  style={[
                    styles.tierLine,
                    { top: line.y, borderColor: line.color },
                  ]}
                />
                <View style={[styles.tierLabelContainer, { top: line.y - 10 }]}>
                  <Text style={[styles.tierLineLabel, { color: line.color }]}>
                    {line.tier}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.progressLine}>
              {chartData.points.map((point, index) => {
                if (index === 0) return null;
                const prevPoint = chartData.points[index - 1];
                const width = Math.sqrt(
                  Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
                );
                const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * (180 / Math.PI);

                return (
                  <View
                    key={index}
                    style={[
                      styles.lineSegment,
                      {
                        width,
                        left: prevPoint.x,
                        top: prevPoint.y,
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  />
                );
              })}
            </View>

            <View
              style={[
                styles.currentPointMarker,
                { left: chartData.points[0].x - 6, top: chartData.points[0].y - 6 },
              ]}
            />

            {tierMilestones.length > 0 && (
              <View
                style={[
                  styles.milestoneMarker,
                  {
                    left:
                      chartData.points[tierMilestones[0].month]?.x - 8 ||
                      chartData.points[chartData.points.length - 1].x - 8,
                    top:
                      chartData.points[tierMilestones[0].month]?.y - 8 ||
                      chartData.points[chartData.points.length - 1].y - 8,
                  },
                ]}
              >
                <Target size={12} color={COLORS.success} />
              </View>
            )}

            <View style={styles.xAxisLabels}>
              <Text style={styles.axisLabel}>Now</Text>
              <Text style={styles.axisLabel}>{Math.round(monthsAhead / 2)}m</Text>
              <Text style={styles.axisLabel}>{monthsAhead}m</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Current</Text>
            <Text style={[styles.statValue, { color: CLUB_ROYALE_TIERS[playerContext.currentTier]?.color || COLORS.textPrimary }]}>
              {playerContext.currentTier}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Current Points</Text>
            <Text style={styles.statValue}>{formatNumber(playerContext.currentPoints)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Projected</Text>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {projections[projections.length - 1]?.tier || playerContext.currentTier}
            </Text>
          </View>
        </View>

        {nextMilestone && (
          <View style={styles.milestoneInfo}>
            <TrendingUp size={14} color={COLORS.success} />
            <Text style={styles.milestoneText}>
              Reach{' '}
              <Text style={{ color: CLUB_ROYALE_TIERS[nextMilestone.tier]?.color || COLORS.success, fontWeight: '700' as const }}>
                {nextMilestone.tier}
              </Text>{' '}
              in ~{nextMilestone.month} months ({formatNumber(nextMilestone.points)} points)
            </Text>
          </View>
        )}

        {!nextMilestone && nextTier && (
          <View style={styles.milestoneInfo}>
            <Target size={14} color={COLORS.aquaAccent} />
            <Text style={styles.milestoneText}>
              Next tier:{' '}
              <Text style={{ color: CLUB_ROYALE_TIERS[nextTier]?.color || COLORS.aquaAccent, fontWeight: '700' as const }}>
                {nextTier}
              </Text>{' '}
              at {formatNumber(CLUB_ROYALE_TIERS[nextTier].threshold)} points
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
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
  },
  timeframeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  timeframeText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
  },
  chartContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  chart: {
    position: 'relative',
  },
  tierLineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  tierLine: {
    position: 'absolute',
    left: CHART_PADDING,
    right: CHART_PADDING,
    height: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.4,
  },
  tierLabelContainer: {
    position: 'absolute',
    right: CHART_PADDING + 4,
  },
  tierLineLabel: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    opacity: 0.8,
  },
  progressLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: COLORS.aquaAccent,
    borderRadius: 1,
    transformOrigin: 'left center',
  },
  currentPointMarker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.aquaAccent,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  milestoneMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: 4,
    left: CHART_PADDING,
    right: CHART_PADDING,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: SPACING.sm,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
  },
  milestoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  milestoneText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    flex: 1,
  },
});
