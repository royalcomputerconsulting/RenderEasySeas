import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { 
  Tag,
  Ship,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { useAppState } from '@/state/AppStateProvider';
import { useUser } from '@/state/UserProvider';
import { EasySeasHero } from '@/components/EasySeasHero';
import { CasinoCertificatesCard } from '@/components/CasinoCertificatesCard';
import { OfferCard } from '@/components/OfferCard';
import { getDaysUntil, isDateInPast, createDateFromString } from '@/lib/date';
import type { Cruise, BookedCruise, CasinoOffer } from '@/types/models';

interface CasinoOfferCard {
  id: string;
  offerCode: string;
  offerName: string;
  expiryDate?: string;
  tradeInValue?: number;
  freePlay?: number;
  obc?: number;
  perks?: string[];
  cruises: Cruise[];
}

export default function OverviewScreen() {
  const router = useRouter();
  const { localData, clubRoyaleProfile, userPoints, isLoading: appLoading } = useAppState();
  const { currentUser } = useUser();
  
  const [refreshing, setRefreshing] = useState(false);

  const cruisesData = useMemo(() => {
    const localCruises = localData.cruises || [];
    return localCruises;
  }, [localData.cruises]);

  const offersData = useMemo(() => {
    const localOffers = localData.offers || [];
    return localOffers;
  }, [localData.offers]);

  const bookedCruises = useMemo(() => {
    return localData.booked || [];
  }, [localData.booked]);

  const bookedCruiseIds = useMemo(() => {
    return new Set(bookedCruises.map((b: BookedCruise) => b.id));
  }, [bookedCruises]);

  const groupedOffers = useMemo(() => {
    const offersMap = new Map<string, CasinoOfferCard>();
    
    offersData.forEach((offer: CasinoOffer) => {
      if (offer.expiryDate && getDaysUntil(offer.expiryDate) < 0) {
        return;
      }
      
      const key = offer.offerCode || offer.id;
      if (!offersMap.has(key)) {
        offersMap.set(key, {
          id: offer.id,
          offerCode: offer.offerCode || offer.id,
          offerName: offer.title || offer.offerCode || 'Casino Offer',
          expiryDate: offer.expiryDate,
          tradeInValue: offer.value,
          freePlay: 0,
          obc: offer.obcAmount,
          perks: [],
          cruises: [],
        });
      }
    });

    cruisesData.forEach((cruise: Cruise) => {
      if (cruise.sailDate && isDateInPast(cruise.sailDate)) {
        return;
      }
      
      const offerCode = cruise.offerCode;
      if (offerCode && offersMap.has(offerCode)) {
        const offerCard = offersMap.get(offerCode);
        if (offerCard) {
          offerCard.cruises.push(cruise);
        }
      }
    });

    return Array.from(offersMap.values()).filter(offer => offer.cruises.length > 0);
  }, [offersData, cruisesData]);

  const nonExpiredOffers = useMemo(() => {
    if (groupedOffers.length === 0) {
      return cruisesData.filter((cruise: Cruise) => {
        if (cruise.sailDate) {
          return !isDateInPast(cruise.sailDate);
        }
        return true;
      });
    }
    return groupedOffers;
  }, [groupedOffers, cruisesData]);

  const availableCruisesCount = useMemo(() => {
    return cruisesData.filter((c: Cruise) => !isDateInPast(c.sailDate)).length;
  }, [cruisesData]);

  const certificates = useMemo(() => [
    { type: 'fpp' as const, label: 'FPP Certs', value: 2 },
    { type: 'nextCruise' as const, label: 'Next Cruise', value: 1 },
    { type: 'obc' as const, label: 'OBC Certs', value: 3 },
  ], []);

  const expiringSoonCount = useMemo(() => {
    let count = 0;
    groupedOffers.forEach(offer => {
      if (offer.expiryDate) {
        const days = getDaysUntil(offer.expiryDate);
        if (days > 0 && days <= 7) {
          count++;
        }
      }
    });
    return count;
  }, [groupedOffers]);

  useFocusEffect(
    useCallback(() => {
      console.log('[Overview] Screen focused, offers count:', nonExpiredOffers.length);
    }, [nonExpiredOffers.length])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('[Overview] Refreshing offers...');
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
    console.log('[Overview] Refresh complete');
  }, []);

  const handleOfferPress = useCallback((offer: CasinoOfferCard | Cruise) => {
    console.log('[Overview] Offer pressed:', offer.id);
    if ('cruises' in offer) {
      router.push(`/offer-details?offerCode=${encodeURIComponent(offer.offerCode)}` as any);
    } else {
      router.push(`/cruise-details?id=${offer.id}` as any);
    }
  }, [router]);

  const handleCruiseItemPress = useCallback((cruiseId: string) => {
    console.log('[Overview] Cruise item pressed:', cruiseId);
    router.push(`/cruise-details?id=${cruiseId}` as any);
  }, [router]);

  const handleSettingsPress = useCallback(() => {
    router.push('/settings' as any);
  }, [router]);

  const handleAlertsPress = useCallback(() => {
    console.log('[Overview] Alerts pressed');
  }, []);

  const handleCruisesPress = useCallback(() => {
    router.push('/scheduling' as any);
  }, [router]);

  const handleBookedPress = useCallback(() => {
    router.push('/booked' as any);
  }, [router]);

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <EasySeasHero
        memberName={currentUser?.name || clubRoyaleProfile.memberName}
        onSettingsPress={handleSettingsPress}
        onAlertsPress={handleAlertsPress}
        alertCount={expiringSoonCount}
        availableCruises={availableCruisesCount}
        bookedCruises={bookedCruises.length}
        activeOffers={groupedOffers.length || offersData.length}
        onCruisesPress={handleCruisesPress}
        onBookedPress={handleBookedPress}
        onOffersPress={() => console.log('Active offers pressed')}
      />

      <CasinoCertificatesCard
        certificates={certificates}
        totalCertificates={certificates.reduce((sum, c) => sum + c.value, 0)}
        availableCruises={availableCruisesCount}
        onManagePress={() => console.log('Manage certificates')}
        onViewOffersPress={() => router.push('/scheduling' as any)}
      />

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Tag size={18} color={COLORS.beigeWarm} />
          <Text style={styles.sectionTitle}>CASINO OFFERS</Text>
        </View>
        {expiringSoonCount > 0 && (
          <View style={styles.expiringAlert}>
            <AlertTriangle size={14} color={COLORS.warning} />
            <Text style={styles.expiringAlertText}>
              {expiringSoonCount} expiring soon
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderOfferCard = useCallback(({ item, index }: { item: CasinoOfferCard | Cruise; index: number }) => {
    if ('cruises' in item) {
      return (
        <TouchableOpacity 
          style={styles.casinoOfferCard}
          onPress={() => handleOfferPress(item)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['rgba(0, 31, 63, 0.95)', 'rgba(0, 61, 92, 0.9)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          
          <View style={styles.offerCardHeader}>
            <View style={styles.offerInfo}>
              <Text style={styles.offerName} numberOfLines={1}>{item.offerName}</Text>
              <Text style={styles.offerCode}>{item.offerCode}</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </View>

          <View style={styles.offerDetails}>
            <View style={styles.offerDetailItem}>
              <Text style={styles.offerDetailLabel}>Expires</Text>
              <Text style={styles.offerDetailValue}>
                {item.expiryDate 
                  ? createDateFromString(item.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'No expiry'}
              </Text>
            </View>
            
            {item.tradeInValue && item.tradeInValue > 0 && (
              <View style={styles.offerDetailItem}>
                <Text style={styles.offerDetailLabel}>Trade-In Value</Text>
                <Text style={styles.tradeInValue}>${item.tradeInValue.toLocaleString()}</Text>
              </View>
            )}
          </View>

          <View style={styles.cruisesPreview}>
            <View style={styles.cruisesCount}>
              <Ship size={14} color={COLORS.beigeWarm} />
              <Text style={styles.cruisesCountText}>
                {item.cruises.length} eligible {item.cruises.length === 1 ? 'cruise' : 'cruises'}
              </Text>
            </View>
            <View style={styles.cruisesList}>
              {item.cruises.slice(0, 3).map((cruise) => (
                <TouchableOpacity 
                  key={cruise.id} 
                  style={styles.cruisePreviewItem}
                  onPress={() => handleCruiseItemPress(cruise.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cruisePreviewShip} numberOfLines={1}>
                    {cruise.shipName}
                  </Text>
                  <Text style={styles.cruisePreviewDate}>
                    {createDateFromString(cruise.sailDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  {bookedCruiseIds.has(cruise.id) && (
                    <View style={styles.bookedMini}>
                      <Text style={styles.bookedMiniText}>Booked</Text>
                    </View>
                  )}
                  <ChevronRight size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
              {item.cruises.length > 3 && (
                <Text style={styles.moreCruises}>+{item.cruises.length - 3} more</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <OfferCard 
        offer={item as Cruise} 
        onPress={() => handleOfferPress(item)} 
        isBooked={bookedCruiseIds.has(item.id)}
        recommended={index === 0}
      />
    );
  }, [handleOfferPress, handleCruiseItemPress, bookedCruiseIds]);

  const keyExtractor = useCallback((item: CasinoOfferCard | Cruise) => item.id, []);

  if (appLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.navyDeep, COLORS.navyMedium, COLORS.navyLight]}
          locations={[0, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={COLORS.beigeWarm} />
        <Text style={styles.loadingText}>Loading offers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.navyDeep, COLORS.navyMedium, COLORS.navyLight]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={nonExpiredOffers}
          renderItem={renderOfferCard}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Tag size={56} color={COLORS.beigeWarm} />
              </View>
              <Text style={styles.emptyTitle}>No Offers Found</Text>
              <Text style={styles.emptyText}>
                Import casino offers data to see available offers and eligible cruises.
              </Text>
              <TouchableOpacity 
                style={styles.importButton}
                onPress={() => router.push('/settings' as any)}
              >
                <LinearGradient
                  colors={[COLORS.beigeWarm, COLORS.goldDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.importButtonGradient}
                >
                  <Text style={styles.importButtonText}>Import Data</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.beigeWarm}
              colors={[COLORS.beigeWarm]}
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={7}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.navyDeep,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  headerContent: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  expiringAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 6,
  },
  expiringAlertText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  casinoOfferCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.lg,
  },
  decorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212, 165, 116, 0.08)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 206, 209, 0.05)',
  },
  offerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  offerInfo: {
    flex: 1,
  },
  offerName: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  offerCode: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.beigeWarm,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  offerDetails: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 116, 0.15)',
  },
  offerDetailItem: {},
  offerDetailLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  offerDetailValue: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  tradeInValue: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  cruisesPreview: {},
  cruisesCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  cruisesCountText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.beigeWarm,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  cruisesList: {
    gap: SPACING.xs,
  },
  cruisePreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  cruisePreviewShip: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textPrimary,
    flex: 1,
  },
  cruisePreviewDate: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  bookedMini: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  bookedMiniText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  moreCruises: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.huge,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    marginBottom: SPACING.xl,
  },
  importButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  importButtonGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  importButtonText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.navyDeep,
  },
});
