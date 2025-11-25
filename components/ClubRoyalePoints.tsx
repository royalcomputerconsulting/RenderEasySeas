import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, ChevronRight } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TierBadgeGroup } from '@/components/ui/TierBadge';
import { CLUB_ROYALE_TIERS } from '@/constants/clubRoyaleTiers';
import { CROWN_ANCHOR_LEVELS } from '@/constants/crownAnchor';
import { useLoyalty } from '@/state/LoyaltyProvider';

interface ClubRoyalePointsProps {
  onPress?: () => void;
  compact?: boolean;
  showPinnacleProgress?: boolean;
}

export function ClubRoyalePoints({
  onPress,
  compact = false,
  showPinnacleProgress = true,
}: ClubRoyalePointsProps) {
  const {
    clubRoyalePoints,
    clubRoyaleTier,
    crownAnchorPoints,
    crownAnchorLevel,
    pinnacleProgress,
    mastersProgress,
  } = useLoyalty();

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Not scheduled';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const pinnacleETA = pinnacleProgress.nightsToNext === 0 
    ? 'Achieved!' 
    : formatDate(pinnacleProgress.projectedDate);

  const signatureThreshold = CLUB_ROYALE_TIERS.Signature.threshold;
  const isSignatureOrAbove = mastersProgress.currentYearPoints >= signatureThreshold;
  const progressToSignature = isSignatureOrAbove ? 100 : Math.min(100, (mastersProgress.currentYearPoints / signatureThreshold) * 100);

  const content = (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <LinearGradient
        colors={['rgba(0, 31, 63, 0.95)', 'rgba(0, 61, 92, 0.9)']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Crown size={20} color={COLORS.goldAccent} />
          </View>
          <View>
            <Text style={styles.title}>Player & Loyalty Status</Text>
            <Text style={styles.pointsText}>
              {clubRoyalePoints.toLocaleString()} CR pts • {crownAnchorPoints} C&A pts
            </Text>
          </View>
        </View>
        
        <TierBadgeGroup 
          clubRoyaleTier={clubRoyaleTier}
          crownAnchorLevel={crownAnchorLevel}
          size="small"
        />
      </View>

      {!compact && (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{pinnacleProgress.nightsToNext}</Text>
              <Text style={styles.statLabel}>Nights to Pinnacle</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {mastersProgress.pointsToNext.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Points to Masters</Text>
            </View>
          </View>

          {showPinnacleProgress && (
            <View style={styles.progressSection}>
              <ProgressBar
                label={`Progress to Pinnacle (${crownAnchorPoints}/700)`}
                progress={pinnacleProgress.percentComplete}
                eta={pinnacleETA}
                height={6}
                gradientColors={[CROWN_ANCHOR_LEVELS.Pinnacle.color, '#4B5563']}
              />
              
              <View style={styles.progressSpacer} />
              
              <ProgressBar
                label={`Progress to Signature (${mastersProgress.currentYearPoints.toLocaleString()}/${signatureThreshold.toLocaleString()}) ${isSignatureOrAbove ? '✓' : ''}`}
                progress={progressToSignature}
                eta={isSignatureOrAbove ? 'Achieved!' : `Resets ${formatDate(mastersProgress.resetDate)}`}
                height={6}
                gradientColors={[
                  CLUB_ROYALE_TIERS.Signature.color,
                  '#6366F1'
                ]}
              />
              
              <View style={styles.progressSpacer} />
              
              <ProgressBar
                label={`Progress to Masters (${mastersProgress.currentYearPoints.toLocaleString()}/${CLUB_ROYALE_TIERS.Masters.threshold.toLocaleString()})`}
                progress={mastersProgress.percentComplete}
                eta={`Resets ${formatDate(mastersProgress.resetDate)}`}
                height={6}
                gradientColors={[
                  CLUB_ROYALE_TIERS.Masters.color,
                  '#8B5CF6'
                ]}
              />
            </View>
          )}
        </>
      )}

      {onPress && (
        <View style={styles.chevron}>
          <ChevronRight size={20} color={COLORS.textSecondary} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.lg,
  },
  containerCompact: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  pointsText: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: SPACING.md,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSizeXXL,
    color: COLORS.beigeWarm,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progressSection: {
    marginTop: SPACING.sm,
  },
  progressSpacer: {
    height: SPACING.md,
  },
  chevron: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    marginTop: -10,
  },
});
