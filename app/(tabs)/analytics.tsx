import React, { useMemo, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity,
  RefreshControl 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  BarChart3, 
  TrendingUp, 
  Ship, 
  DollarSign, 
  Award, 
  MapPin, 
  Anchor, 
  Trophy,
  Zap,
  PieChart,
  Coins,
  Target,
  ChevronDown
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { useSimpleAnalytics } from '@/state/SimpleAnalyticsProvider';
import { useAppState } from '@/state/AppStateProvider';
import { useCruiseStore } from '@/state/CruiseStore';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format';
import { createDateFromString } from '@/lib/date';
import { TierBadgeGroup } from '@/components/ui/TierBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { 
  CLUB_ROYALE_TIERS, 
  calculateNightsToTier,
  calculateETAToTier,
  getTierProgress
} from '@/constants/clubRoyaleTiers';
import { 
  CROWN_ANCHOR_LEVELS,
  calculateNightsToPinnacle,
  calculateETAToPinnacle,
  getLevelProgress
} from '@/constants/crownAnchor';
import type { BookedCruise } from '@/types/models';
import { WhatIfSimulator } from '@/components/WhatIfSimulator';
import { TierProgressionChart } from '@/components/charts/TierProgressionChart';
import { ROIProjectionChart } from '@/components/charts/ROIProjectionChart';
import { RiskAnalysisChart } from '@/components/charts/RiskAnalysisChart';
import { 
  PlayerContext, 
  runSimulation, 
  SimulationResult 
} from '@/lib/whatIfSimulator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ROIFilter = 'all' | 'high' | 'medium' | 'low';

function calculateCruiseROI(cruise: BookedCruise): number {
  const paid = cruise.totalPrice || cruise.price || 0;
  const retail = cruise.retailValue || cruise.originalPrice || paid;
  if (paid <= 0) return 0;
  return ((retail - paid) / paid) * 100;
}

function getCruiseROILevel(roi: number): 'high' | 'medium' | 'low' {
  if (roi >= 50) return 'high';
  if (roi >= 20) return 'medium';
  return 'low';
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const { analytics, casinoAnalytics } = useSimpleAnalytics();
  const { clubRoyaleProfile } = useAppState();
  const { bookedCruises, isLoading: storeLoading } = useCruiseStore();
  const [roiFilter, setRoiFilter] = useState<ROIFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const currentPoints = clubRoyaleProfile?.tierPoints || 3130;
  const totalNights = clubRoyaleProfile?.lifetimeNights || analytics.totalNights || 78;
  const clubRoyaleTier = clubRoyaleProfile?.tier || 'Prime';
  const crownAnchorLevel = clubRoyaleProfile?.crownAnchorLevel || 'Diamond Plus';

  const cruisesWithROI = useMemo(() => {
    return bookedCruises.map(cruise => ({
      ...cruise,
      calculatedROI: calculateCruiseROI(cruise),
      roiLevel: getCruiseROILevel(calculateCruiseROI(cruise))
    })).sort((a, b) => b.calculatedROI - a.calculatedROI);
  }, [bookedCruises]);

  const filteredCruises = useMemo(() => {
    if (roiFilter === 'all') return cruisesWithROI;
    return cruisesWithROI.filter(c => c.roiLevel === roiFilter);
  }, [cruisesWithROI, roiFilter]);

  const portfolioMetrics = useMemo(() => {
    const highROI = cruisesWithROI.filter(c => c.roiLevel === 'high').length;
    const mediumROI = cruisesWithROI.filter(c => c.roiLevel === 'medium').length;
    const lowROI = cruisesWithROI.filter(c => c.roiLevel === 'low').length;

    return {
      highROI,
      mediumROI,
      lowROI,
      totalCruises: bookedCruises.length
    };
  }, [bookedCruises, cruisesWithROI]);

  const nightsToPinnacle = calculateNightsToPinnacle(totalNights);
  const nightsToSignature = calculateNightsToTier(currentPoints, 'Signature');
  
  const pinnacleETA = calculateETAToPinnacle(totalNights);
  const signatureETA = calculateETAToTier(currentPoints, 'Signature');

  const playerContext: PlayerContext = useMemo(() => {
    const avgPointsPerNight = bookedCruises.length > 0
      ? bookedCruises.reduce((sum, c) => sum + (c.earnedPoints || c.casinoPoints || 0), 0) / 
        Math.max(1, bookedCruises.reduce((sum, c) => sum + (c.nights || 0), 0))
      : 150;
    
    const avgSpend = bookedCruises.length > 0
      ? bookedCruises.reduce((sum, c) => sum + (c.totalPrice || c.price || 0), 0) / bookedCruises.length
      : 2000;

    return {
      currentPoints,
      currentNights: totalNights,
      currentTier: clubRoyaleTier,
      currentLevel: crownAnchorLevel,
      averagePointsPerNight: avgPointsPerNight || 150,
      averageNightsPerMonth: 7,
      averageSpendPerCruise: avgSpend || 2000,
    };
  }, [currentPoints, totalNights, clubRoyaleTier, crownAnchorLevel, bookedCruises]);

  const baselineSimulation = useMemo(() => {
    return runSimulation(playerContext, bookedCruises, { type: 'custom', customPoints: 0, customNights: 0 });
  }, [playerContext, bookedCruises]);

  const handleSimulationComplete = useCallback((result: SimulationResult) => {
    setSimulationResult(result);
    console.log('[Analytics] Simulation result received:', result);
  }, []);

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Achieved!';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  getTierProgress(currentPoints, clubRoyaleTier);
  getLevelProgress(totalNights, crownAnchorLevel);

  const pinnacleProgress = totalNights >= 700 
    ? 100 
    : (totalNights / CROWN_ANCHOR_LEVELS.Pinnacle.cruiseNights) * 100;

  const signatureProgress = clubRoyaleTier === 'Signature' || clubRoyaleTier === 'Masters'
    ? 100
    : Math.min((currentPoints / CLUB_ROYALE_TIERS.Signature.threshold) * 100, 100);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleCruisePress = useCallback((cruiseId: string) => {
    router.push(`/cruise-details?id=${cruiseId}`);
  }, [router]);

  const stats = useMemo(() => [
    {
      icon: Ship,
      label: 'Total Cruises',
      value: analytics.totalCruises.toString(),
      color: COLORS.beigeWarm,
    },
    {
      icon: Award,
      label: 'Total Points',
      value: formatNumber(analytics.totalPoints || currentPoints),
      color: COLORS.aquaAccent,
    },
    {
      icon: TrendingUp,
      label: 'Portfolio ROI',
      value: formatPercentage(analytics.portfolioROI || 0, 1),
      color: COLORS.success,
    },
    {
      icon: DollarSign,
      label: 'Total Savings',
      value: formatCurrency(analytics.totalSaved || 0),
      color: COLORS.goldAccent,
    },
  ], [analytics, currentPoints]);

  const financialStats = useMemo(() => [
    {
      label: 'Total $ Spent on Cruises',
      value: formatCurrency(analytics.totalSpent || 0),
      color: COLORS.beigeWarm,
    },
    {
      label: 'Total $ Spent in Port Taxes',
      value: formatCurrency(analytics.totalPortTaxes || 0),
      color: COLORS.textSecondary,
    },
  ], [analytics]);

  const ROIFilterTabs = () => (
    <View style={styles.filterTabs}>
      {(['all', 'high', 'medium', 'low'] as ROIFilter[]).map((filter) => {
        const isActive = roiFilter === filter;
        const count = filter === 'all' 
          ? portfolioMetrics.totalCruises 
          : portfolioMetrics[`${filter}ROI` as keyof typeof portfolioMetrics];
        const label = filter === 'all' ? 'All' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} ROI`;
        
        return (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, isActive && styles.filterTabActive]}
            onPress={() => setRoiFilter(filter)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
              {label}
            </Text>
            <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
              <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const CruisePortfolioCard = ({ cruise }: { cruise: typeof cruisesWithROI[0] }) => {
    const paid = cruise.totalPrice || cruise.price || 0;
    const retail = cruise.retailValue || cruise.originalPrice || paid;
    const points = cruise.earnedPoints || cruise.casinoPoints || 0;
    const costPerPoint = points > 0 ? paid / points : 0;
    
    const roiColor = cruise.roiLevel === 'high' 
      ? COLORS.success 
      : cruise.roiLevel === 'medium' 
        ? COLORS.warning 
        : COLORS.error;

    return (
      <TouchableOpacity
        style={styles.portfolioCard}
        onPress={() => handleCruisePress(cruise.id)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.portfolioCardHeader}>
          <View style={styles.portfolioCardShip}>
            <Ship size={16} color={COLORS.beigeWarm} />
            <Text style={styles.portfolioCardShipName} numberOfLines={1}>
              {cruise.shipName || 'Unknown Ship'}
            </Text>
          </View>
          <View style={[styles.roiBadge, { backgroundColor: `${roiColor}20` }]}>
            <Text style={[styles.roiBadgeText, { color: roiColor }]}>
              {cruise.calculatedROI.toFixed(0)}% ROI
            </Text>
          </View>
        </View>
        
        <Text style={styles.portfolioCardDate}>
          {cruise.sailDate ? createDateFromString(cruise.sailDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          }) : 'No date'} • {cruise.nights || 0} nights
        </Text>
        
        <View style={styles.portfolioCardMetrics}>
          <View style={styles.portfolioMetric}>
            <Text style={styles.portfolioMetricLabel}>Points</Text>
            <Text style={styles.portfolioMetricValue}>{formatNumber(points)}</Text>
          </View>
          <View style={styles.portfolioMetric}>
            <Text style={styles.portfolioMetricLabel}>Paid</Text>
            <Text style={styles.portfolioMetricValue}>{formatCurrency(paid)}</Text>
          </View>
          <View style={styles.portfolioMetric}>
            <Text style={styles.portfolioMetricLabel}>Retail</Text>
            <Text style={styles.portfolioMetricValue}>{formatCurrency(retail)}</Text>
          </View>
          <View style={styles.portfolioMetric}>
            <Text style={styles.portfolioMetricLabel}>$/Pt</Text>
            <Text style={styles.portfolioMetricValue}>${costPerPoint.toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[COLORS.navyDeep, COLORS.navyMedium, COLORS.navyLight]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.beigeWarm}
              colors={[COLORS.beigeWarm]}
            />
          }
        >
          <View style={styles.header}>
            <View style={styles.brandingRow}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Ship size={24} color={COLORS.beigeWarm} />
                </View>
                <View style={styles.waveDecoration}>
                  <Anchor size={12} color={COLORS.aquaAccent} />
                </View>
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.appTitle}>Easy Seas</Text>
                <Text style={styles.appSubtitle}>Analytics Dashboard</Text>
              </View>
            </View>
            
            <View style={styles.tierBadges}>
              <TierBadgeGroup 
                clubRoyaleTier={clubRoyaleTier}
                crownAnchorLevel={crownAnchorLevel}
                size="small"
              />
            </View>
          </View>

          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                  style={styles.statCardGradient}
                >
                  <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
                    <stat.icon size={20} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>

          <View style={styles.financialRow}>
            {financialStats.map((stat, index) => (
              <View key={index} style={styles.financialCard}>
                <Text style={styles.financialLabel}>{stat.label}</Text>
                <Text style={[styles.financialValue, { color: stat.color }]}>{stat.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Trophy size={20} color={COLORS.beigeWarm} />
              <Text style={styles.sectionTitle}>Player & Loyalty Status</Text>
            </View>
            
            <View style={styles.statusCard}>
              <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>Nights to Pinnacle</Text>
                    <Text style={styles.progressValue}>{nightsToPinnacle} nights</Text>
                  </View>
                </View>
                <ProgressBar
                  progress={pinnacleProgress}
                  eta={formatDate(pinnacleETA)}
                  height={10}
                  gradientColors={[CROWN_ANCHOR_LEVELS.Pinnacle?.color || '#E5E4E2', '#6B7280']}
                />
              </View>
              
              <View style={styles.progressDivider} />
              
              <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>Nights to Signature</Text>
                    <Text style={styles.progressValue}>{nightsToSignature} nights</Text>
                  </View>
                </View>
                <ProgressBar
                  progress={signatureProgress}
                  eta={formatDate(signatureETA)}
                  height={10}
                  gradientColors={[CLUB_ROYALE_TIERS.Signature?.color || '#8B5CF6', '#6366F1']}
                />
              </View>

              <View style={styles.statusStatsRow}>
                <View style={styles.statusStat}>
                  <Text style={styles.statusStatValue}>{formatNumber(currentPoints)}</Text>
                  <Text style={styles.statusStatLabel}>Current Points</Text>
                </View>
                <View style={styles.statusStatDivider} />
                <View style={styles.statusStat}>
                  <Text style={styles.statusStatValue}>{totalNights}</Text>
                  <Text style={styles.statusStatLabel}>Total Nights</Text>
                </View>
                <View style={styles.statusStatDivider} />
                <View style={styles.statusStat}>
                  <Text style={styles.statusStatValue}>{analytics.totalCruises}</Text>
                  <Text style={styles.statusStatLabel}>Cruises</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <PieChart size={20} color={COLORS.beigeWarm} />
              <Text style={styles.sectionTitle}>Portfolio Performance</Text>
            </View>

            <View style={styles.casinoHeader}>
              <Text style={styles.casinoHeaderText}>Casino Performance</Text>
              <Text style={styles.casinoSubtext}>
                Based on {casinoAnalytics.completedCruisesCount} completed cruise{casinoAnalytics.completedCruisesCount !== 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Coins size={18} color={COLORS.goldAccent} />
                <Text style={styles.metricValue}>{formatCurrency(casinoAnalytics.totalCoinIn)}</Text>
                <Text style={styles.metricLabel}>Total Coin-In</Text>
                <Text style={styles.metricSubLabel}>${formatNumber(casinoAnalytics.totalPointsEarned)} pts × $5</Text>
              </View>
              <View style={styles.metricCard}>
                <Target size={18} color={casinoAnalytics.netResult >= 0 ? COLORS.success : COLORS.error} />
                <Text style={[styles.metricValue, { color: casinoAnalytics.netResult >= 0 ? COLORS.success : COLORS.error }]}>
                  {casinoAnalytics.netResult >= 0 ? '+' : ''}{formatCurrency(casinoAnalytics.netResult)}
                </Text>
                <Text style={styles.metricLabel}>Net Win/Loss</Text>
              </View>
              <View style={styles.metricCard}>
                <TrendingUp size={18} color={COLORS.aquaAccent} />
                <Text style={styles.metricValue}>{formatNumber(casinoAnalytics.totalPointsEarned)}</Text>
                <Text style={styles.metricLabel}>Total Points</Text>
              </View>
            </View>

            {casinoAnalytics.completedCruisesCount > 0 && (
              <View style={styles.avgMetricsRow}>
                <View style={styles.avgMetric}>
                  <Text style={styles.avgMetricLabel}>Avg Coin-In/Cruise</Text>
                  <Text style={styles.avgMetricValue}>{formatCurrency(casinoAnalytics.avgCoinInPerCruise)}</Text>
                </View>
                <View style={styles.avgMetricDivider} />
                <View style={styles.avgMetric}>
                  <Text style={styles.avgMetricLabel}>Avg Win/Loss</Text>
                  <Text style={[styles.avgMetricValue, { color: casinoAnalytics.avgWinLossPerCruise >= 0 ? COLORS.success : COLORS.error }]}>
                    {casinoAnalytics.avgWinLossPerCruise >= 0 ? '+' : ''}{formatCurrency(casinoAnalytics.avgWinLossPerCruise)}
                  </Text>
                </View>
                <View style={styles.avgMetricDivider} />
                <View style={styles.avgMetric}>
                  <Text style={styles.avgMetricLabel}>Avg Pts/Cruise</Text>
                  <Text style={styles.avgMetricValue}>{formatNumber(Math.round(casinoAnalytics.avgPointsPerCruise))}</Text>
                </View>
              </View>
            )}

            <Text style={styles.portfolioTitle}>Cruise Portfolio</Text>
            <ROIFilterTabs />
            
            {filteredCruises.length > 0 ? (
              <View style={styles.portfolioList}>
                {filteredCruises.slice(0, 10).map((cruise) => (
                  <CruisePortfolioCard key={cruise.id} cruise={cruise} />
                ))}
                {filteredCruises.length > 10 && (
                  <TouchableOpacity style={styles.viewMoreButton} activeOpacity={0.7}>
                    <Text style={styles.viewMoreText}>
                      View {filteredCruises.length - 10} more cruises
                    </Text>
                    <ChevronDown size={16} color={COLORS.beigeWarm} />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.emptyPortfolio}>
                <Ship size={40} color={COLORS.textSecondary} />
                <Text style={styles.emptyPortfolioText}>No cruises match this filter</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Zap size={20} color={COLORS.beigeWarm} />
              <Text style={styles.sectionTitle}>Predictive What-If Engine</Text>
            </View>
            
            <WhatIfSimulator
              playerContext={playerContext}
              bookedCruises={bookedCruises}
              onSimulationComplete={handleSimulationComplete}
            />
          </View>

          <View style={styles.section}>
            <TierProgressionChart
              playerContext={playerContext}
              bookedCruises={bookedCruises}
              monthsAhead={24}
            />
          </View>

          <View style={styles.section}>
            <ROIProjectionChart
              roiProjection={simulationResult?.roiProjection || baselineSimulation.roiProjection}
              comparisonROI={baselineSimulation.roiProjection.projectedROI}
            />
          </View>

          <View style={styles.section}>
            <RiskAnalysisChart
              riskAnalysis={simulationResult?.riskAnalysis || baselineSimulation.riskAnalysis}
            />
          </View>

          {analytics.destinationDistribution.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin size={20} color={COLORS.beigeWarm} />
                <Text style={styles.sectionTitle}>Top Destinations</Text>
              </View>
              
              <View style={styles.destinationsCard}>
                {analytics.destinationDistribution.slice(0, 5).map((item, index) => (
                  <View key={index} style={styles.destinationRow}>
                    <View style={styles.destinationRank}>
                      <Text style={styles.rankNumber}>{index + 1}</Text>
                    </View>
                    <View style={styles.destinationContent}>
                      <View style={styles.destinationHeader}>
                        <Text style={styles.destinationLabel}>{item.destination}</Text>
                        <Text style={styles.destinationValue}>
                          {item.count} {item.count === 1 ? 'cruise' : 'cruises'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {analytics.totalCruises === 0 && !storeLoading && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <BarChart3 size={64} color={COLORS.beigeWarm} />
              </View>
              <Text style={styles.emptyTitle}>No Analytics Data Yet</Text>
              <Text style={styles.emptyText}>
                Book and complete cruises to see your{'\n'}personalized statistics here
              </Text>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navyDeep,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 165, 116, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.4)',
  },
  waveDecoration: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 206, 209, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  appTitle: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tierBadges: {
    alignItems: 'flex-start',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm) / 2 - SPACING.sm / 2,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.sm,
  },
  statCardGradient: {
    padding: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  financialRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  financialCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  financialLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  financialValue: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
  },
  statusCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.md,
  },
  progressSection: {
    marginBottom: SPACING.md,
  },
  progressRow: {
    marginBottom: SPACING.sm,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  progressValue: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.beigeWarm,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  progressDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.md,
  },
  statusStatsRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  statusStat: {
    flex: 1,
    alignItems: 'center',
  },
  statusStatDivider: {
    width: 1,
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
    marginHorizontal: SPACING.sm,
  },
  statusStatValue: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.beigeWarm,
  },
  statusStatLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metricSubLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
    opacity: 0.7,
  },
  casinoHeader: {
    marginBottom: SPACING.md,
  },
  casinoHeaderText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.goldAccent,
    marginBottom: 2,
  },
  casinoSubtext: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
  },
  avgMetricsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  avgMetric: {
    flex: 1,
    alignItems: 'center',
  },
  avgMetricLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  avgMetricValue: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
  },
  avgMetricDivider: {
    width: 1,
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
    marginHorizontal: SPACING.sm,
  },
  portfolioTitle: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: SPACING.xs,
  },
  filterTabActive: {
    backgroundColor: COLORS.beigeWarm,
  },
  filterTabText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  filterTabTextActive: {
    color: COLORS.navyDeep,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(0,31,63,0.3)',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textSecondary,
  },
  filterBadgeTextActive: {
    color: COLORS.navyDeep,
  },
  portfolioList: {
    gap: SPACING.sm,
  },
  portfolioCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  portfolioCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  portfolioCardShip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  portfolioCardShipName: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  roiBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  roiBadgeText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  portfolioCardDate: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  portfolioCardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  portfolioMetric: {
    alignItems: 'center',
  },
  portfolioMetricLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  portfolioMetricValue: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.md,
  },
  viewMoreText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.beigeWarm,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  emptyPortfolio: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyPortfolioText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
  },
  destinationsCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.md,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  destinationRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rankNumber: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.beigeWarm,
  },
  destinationContent: {
    flex: 1,
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  destinationLabel: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  destinationValue: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.huge,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 100,
  },
});
