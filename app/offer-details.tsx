import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Ship,
  Calendar,
  MapPin,
  Clock,
  Tag,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { useAppState } from '@/state/AppStateProvider';
import { formatCurrency } from '@/lib/format';
import { createDateFromString, getDaysUntil, formatDate } from '@/lib/date';
import type { Cruise, BookedCruise, CasinoOffer } from '@/types/models';

export default function OfferDetailsScreen() {
  const router = useRouter();
  const { offerCode } = useLocalSearchParams<{ offerCode: string }>();
  const { localData } = useAppState();

  const bookedCruiseIds = useMemo(() => {
    return new Set((localData.booked || []).map((b: BookedCruise) => b.id));
  }, [localData.booked]);

  const offerData = useMemo(() => {
    const cruises = (localData.cruises || []).filter(
      (c: Cruise) => c.offerCode === offerCode
    );
    const offer = (localData.offers || []).find(
      (o: CasinoOffer) => o.offerCode === offerCode
    );
    return { cruises, offer };
  }, [localData.cruises, localData.offers, offerCode]);

  const offerInfo = useMemo(() => {
    const { cruises, offer } = offerData;
    if (offer) {
      return {
        offerCode: offer.offerCode || offerCode,
        offerName: offer.title || offer.offerCode || 'Casino Offer',
        expiryDate: offer.expiryDate || offer.offerExpiryDate,
        tradeInValue: offer.value || offer.tradeInValue,
        freePlay: offer.freePlay || offer.freeplayAmount,
        obc: offer.obcAmount || offer.OBC,
      };
    }
    if (cruises.length > 0) {
      const first = cruises[0];
      return {
        offerCode: first.offerCode || offerCode,
        offerName: first.offerCode || 'Casino Offer',
        expiryDate: first.offerExpiry,
        tradeInValue: 0,
        freePlay: 0,
        obc: first.freeOBC,
      };
    }
    return {
      offerCode: offerCode || 'Unknown',
      offerName: 'Casino Offer',
      expiryDate: undefined,
      tradeInValue: 0,
      freePlay: 0,
      obc: 0,
    };
  }, [offerData, offerCode]);

  const daysUntilExpiry = offerInfo.expiryDate ? getDaysUntil(offerInfo.expiryDate) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7;

  const handleCruisePress = useCallback((cruiseId: string) => {
    console.log('[OfferDetails] Cruise pressed:', cruiseId);
    router.push(`/cruise-details?id=${cruiseId}` as any);
  }, [router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const renderCruiseCard = useCallback(({ item }: { item: Cruise }) => {
    const isBooked = bookedCruiseIds.has(item.id);
    const sailDate = createDateFromString(item.sailDate);
    const daysUntilSail = getDaysUntil(item.sailDate);

    return (
      <TouchableOpacity
        style={[styles.cruiseCard, isBooked && styles.bookedCard]}
        onPress={() => handleCruisePress(item.id)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={isBooked 
            ? ['rgba(76, 175, 80, 0.15)', 'rgba(76, 175, 80, 0.05)'] 
            : ['rgba(0, 31, 63, 0.95)', 'rgba(0, 61, 92, 0.9)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.cruiseHeader}>
          <View style={styles.shipInfo}>
            <Ship size={18} color={COLORS.beigeWarm} />
            <Text style={styles.shipName} numberOfLines={1}>{item.shipName}</Text>
          </View>
          <View style={styles.cruiseHeaderRight}>
            {isBooked && (
              <View style={styles.bookedBadge}>
                <CheckCircle size={10} color={COLORS.white} />
                <Text style={styles.bookedBadgeText}>BOOKED</Text>
              </View>
            )}
            <ChevronRight size={18} color={COLORS.textSecondary} />
          </View>
        </View>

        <Text style={styles.destination} numberOfLines={1}>
          {item.destination || item.itineraryName || 'Caribbean Cruise'}
        </Text>

        <View style={styles.cruiseDetails}>
          <View style={styles.detailItem}>
            <Calendar size={12} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>
              {sailDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={12} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.nights} nights</Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin size={12} color={COLORS.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>{item.departurePort}</Text>
          </View>
        </View>

        {daysUntilSail > 0 && (
          <Text style={styles.daysAway}>{daysUntilSail} days away</Text>
        )}

        <View style={styles.pricingSection}>
          <Text style={styles.pricingTitle}>Room Pricing</Text>
          <View style={styles.pricingGrid}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Interior</Text>
              <Text style={[styles.priceValue, !item.interiorPrice && styles.priceNA]}>
                {item.interiorPrice ? formatCurrency(item.interiorPrice) : 'N/A'}
              </Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Ocean View</Text>
              <Text style={[styles.priceValue, !item.oceanviewPrice && styles.priceNA]}>
                {item.oceanviewPrice ? formatCurrency(item.oceanviewPrice) : 'N/A'}
              </Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Balcony</Text>
              <Text style={[styles.priceValue, !item.balconyPrice && styles.priceNA]}>
                {item.balconyPrice ? formatCurrency(item.balconyPrice) : 'N/A'}
              </Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Suite</Text>
              <Text style={[styles.priceValue, !item.suitePrice && styles.priceNA]}>
                {item.suitePrice ? formatCurrency(item.suitePrice) : 'N/A'}
              </Text>
            </View>
          </View>

          {item.taxes && item.taxes > 0 && (
            <View style={styles.taxesRow}>
              <Text style={styles.taxesLabel}>Taxes & Fees:</Text>
              <Text style={styles.taxesValue}>{formatCurrency(item.taxes)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [bookedCruiseIds, handleCruisePress]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
      <LinearGradient
        colors={[COLORS.navyDeep, COLORS.navyMedium, COLORS.navyLight]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Tag size={20} color={COLORS.beigeWarm} />
            <View>
              <Text style={styles.headerTitle} numberOfLines={1}>{offerInfo.offerName}</Text>
              <Text style={styles.headerSubtitle}>{offerInfo.offerCode}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.offerSummary}>
          <View style={styles.summaryRow}>
            {offerInfo.expiryDate && (
              <View style={[styles.summaryItem, isExpiringSoon && styles.summaryItemWarning]}>
                <Text style={styles.summaryLabel}>Expires</Text>
                <Text style={[styles.summaryValue, isExpiringSoon && styles.summaryValueWarning]}>
                  {formatDate(offerInfo.expiryDate, 'short')}
                </Text>
                {isExpiringSoon && (
                  <View style={styles.warningBadge}>
                    <AlertTriangle size={10} color={COLORS.warning} />
                    <Text style={styles.warningText}>{daysUntilExpiry} days</Text>
                  </View>
                )}
              </View>
            )}
            {offerInfo.tradeInValue && offerInfo.tradeInValue > 0 && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Trade-In Value</Text>
                <Text style={styles.tradeInValue}>${offerInfo.tradeInValue}</Text>
              </View>
            )}
            {offerInfo.obc && offerInfo.obc > 0 && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>OBC</Text>
                <Text style={styles.obcValue}>${offerInfo.obc}</Text>
              </View>
            )}
          </View>

          <View style={styles.cruisesCountRow}>
            <Ship size={16} color={COLORS.beigeWarm} />
            <Text style={styles.cruisesCountText}>
              {offerData.cruises.length} eligible {offerData.cruises.length === 1 ? 'cruise' : 'cruises'}
            </Text>
          </View>
        </View>

        <FlatList
          data={offerData.cruises}
          renderItem={renderCruiseCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ship size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No cruises found for this offer</Text>
            </View>
          }
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 116, 0.15)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.beigeWarm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerSummary: {
    padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  summaryItem: {
    minWidth: 80,
  },
  summaryItemWarning: {},
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  summaryValueWarning: {
    color: COLORS.warning,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  warningText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  tradeInValue: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  obcValue: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    color: COLORS.aquaAccent,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  cruisesCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 165, 116, 0.15)',
  },
  cruisesCountText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.beigeWarm,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  cruiseCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.md,
  },
  bookedCard: {
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  cruiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  shipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  shipName: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  cruiseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  bookedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  bookedBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.white,
  },
  destination: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.beigeWarm,
    marginBottom: SPACING.sm,
  },
  cruiseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  daysAway: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  pricingSection: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  pricingTitle: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  priceBox: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  priceValue: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.success,
  },
  priceNA: {
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  taxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  taxesLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
  },
  taxesValue: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.huge,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textSecondary,
  },
});
