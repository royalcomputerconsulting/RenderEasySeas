import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Bell } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { TierBadgeGroup } from '@/components/ui/TierBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CLUB_ROYALE_TIERS } from '@/constants/clubRoyaleTiers';
import { useLoyalty } from '@/state/LoyaltyProvider';

interface EasySeasHeroProps {
  memberName?: string;
  onSettingsPress?: () => void;
  onAlertsPress?: () => void;
  alertCount?: number;
  availableCruises?: number;
  bookedCruises?: number;
  activeOffers?: number;
  onCruisesPress?: () => void;
  onBookedPress?: () => void;
  onOffersPress?: () => void;
}

export function EasySeasHero({
  memberName = 'Player',
  onSettingsPress,
  onAlertsPress,
  alertCount = 0,
  availableCruises = 0,
  bookedCruises = 0,
  activeOffers = 0,
  onCruisesPress,
  onBookedPress,
  onOffersPress,
}: EasySeasHeroProps) {
  const {
    clubRoyalePoints,
    clubRoyaleTier,
    crownAnchorPoints,
    crownAnchorLevel,
    clubRoyaleProgress,
    pinnacleProgress,
  } = useLoyalty();

  const formatETA = (unitsToNext: number, averagePerMonth: number): string => {
    if (unitsToNext <= 0) return 'Achieved!';
    const monthsNeeded = Math.ceil(unitsToNext / averagePerMonth);
    const eta = new Date();
    eta.setMonth(eta.getMonth() + monthsNeeded);
    return eta.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 31, 63, 0.98)', 'rgba(0, 61, 92, 0.95)']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.topRow}>
        <View style={styles.brandingSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zf6f5olpoe2u2crfpswo2' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.appTitle}>Easy Seas</Text>
            <Text style={styles.appSubtitle}>Manage your Nautical Lifestyle</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          {onAlertsPress && (
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={onAlertsPress}
              activeOpacity={0.7}
            >
              <Bell size={20} color={COLORS.textSecondary} />
              {alertCount > 0 && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>
                    {alertCount > 9 ? '9+' : alertCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          {onSettingsPress && (
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={onSettingsPress}
              activeOpacity={0.7}
            >
              <Settings size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.tierSection}>
        <TierBadgeGroup 
          clubRoyaleTier={clubRoyaleTier}
          crownAnchorLevel={crownAnchorLevel}
          size="medium"
        />
      </View>

      <View style={styles.progressSection}>
        <ProgressBar
          label={`Progress to Pinnacle (${crownAnchorPoints}/700)`}
          progress={pinnacleProgress.percentComplete}
          eta={`ETA: ${formatETA(pinnacleProgress.nightsToNext, 7)} • ${pinnacleProgress.nightsToNext} nights`}
          height={12}
          gradientColors={[COLORS.aquaAccent, COLORS.lightBlue]}
        />
        
        <View style={styles.progressSpacer} />
        
        <ProgressBar
          label={clubRoyaleProgress.nextTier 
            ? `Progress to ${clubRoyaleProgress.nextTier} (${clubRoyalePoints.toLocaleString()}/${CLUB_ROYALE_TIERS[clubRoyaleProgress.nextTier]?.threshold.toLocaleString() || 'Max'})`
            : `Masters Tier (${clubRoyalePoints.toLocaleString()} points)`
          }
          progress={clubRoyaleProgress.percentComplete}
          eta={`ETA: ${formatETA(clubRoyaleProgress.pointsToNext, 1000)} • Resets April 1`}
          height={12}
          gradientColors={[
            clubRoyaleProgress.nextTier 
              ? CLUB_ROYALE_TIERS[clubRoyaleProgress.nextTier]?.color || '#8B5CF6'
              : CLUB_ROYALE_TIERS.Masters.color,
            COLORS.goldAccent
          ]}
        />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{clubRoyalePoints.toLocaleString()}</Text>
          <Text style={styles.statLabel}>CR Points</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{crownAnchorPoints}</Text>
          <Text style={styles.statLabel}>C&A Points</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{pinnacleProgress.nightsToNext}</Text>
          <Text style={styles.statLabel}>To Pinnacle</Text>
        </View>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={onCruisesPress}
          activeOpacity={0.7}
        >
          <Text style={styles.statValue}>{availableCruises.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Available Cruises</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={onBookedPress}
          activeOpacity={0.7}
        >
          <Text style={styles.statValue}>{bookedCruises}</Text>
          <Text style={styles.statLabel}>Booked</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={onOffersPress}
          activeOpacity={0.7}
        >
          <Text style={styles.statValue}>{activeOffers}</Text>
          <Text style={styles.statLabel}>Active Offers</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
    ...SHADOW.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  brandingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    marginRight: SPACING.md,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
  },
  titleContainer: {
    flex: 1,
  },
  appTitle: {
    fontSize: TYPOGRAPHY.fontSizeHeader,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  alertBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.white,
  },
  tierSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  progressSection: {
    marginBottom: SPACING.lg,
  },
  progressSpacer: {
    height: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSizeXXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.aquaAccent,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});
