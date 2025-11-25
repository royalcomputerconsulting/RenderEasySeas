import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Ship,
  Search,
  Filter,
  X,
  Bell,
  MapPin,
  CalendarDays,
  Clock,
  ChevronRight,
  Sparkles,
  Star,
  ListFilter,
  RotateCcw,
  Award,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { useAppState } from '@/state/AppStateProvider';
import { useCruiseStore } from '@/state/CruiseStore';
import { useUser } from '@/state/UserProvider';
import { EasySeasHero } from '@/components/EasySeasHero';
import { EnhancedTabs } from '@/components/ui/EnhancedTabs';
import { AnimatedActionButton, AnimatedActionButtonGroup } from '@/components/ui/AnimatedActionButton';
import { formatDate, isDateInPast, getDaysUntil, createDateFromString } from '@/lib/date';
import type { Cruise, BookedCruise } from '@/types/models';

type ViewTab = 'available' | 'all' | 'booked' | 'foryou';
type CabinFilter = 'all' | 'Interior' | 'Oceanview' | 'Balcony' | 'Suite';

interface FilterState {
  cabinType: CabinFilter;
  noConflicts: boolean;
  searchQuery: string;
}

const TABS: { key: ViewTab; label: string; icon?: any }[] = [
  { key: 'available', label: 'Available', icon: Ship },
  { key: 'all', label: 'All', icon: ListFilter },
  { key: 'booked', label: 'Booked', icon: Award },
  { key: 'foryou', label: 'For You', icon: Sparkles },
];

const CABIN_FILTERS: { key: CabinFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Interior', label: 'Interior' },
  { key: 'Oceanview', label: 'Ocean' },
  { key: 'Balcony', label: 'Balcony' },
  { key: 'Suite', label: 'Suite' },
];

export default function SchedulingScreen() {
  const router = useRouter();
  const { localData, clubRoyaleProfile, userPoints, isLoading: appLoading } = useAppState();
  const { bookedCruises } = useCruiseStore();
  const { currentUser } = useUser();

  const [activeTab, setActiveTab] = useState<ViewTab>('available');
  const [filters, setFilters] = useState<FilterState>({
    cabinType: 'all',
    noConflicts: false,
    searchQuery: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const allCruises = useMemo(() => {
    return localData.cruises || [];
  }, [localData.cruises]);

  const bookedIds = useMemo(() => {
    const localBooked = localData.booked || [];
    const storeBooked = bookedCruises || [];
    return new Set([
      ...localBooked.map((b: BookedCruise) => b.id),
      ...storeBooked.map((b: BookedCruise) => b.id),
    ]);
  }, [localData.booked, bookedCruises]);

  const bookedDates = useMemo(() => {
    const dates = new Set<string>();
    const allBooked = [...(localData.booked || []), ...(bookedCruises || [])];
    allBooked.forEach((cruise: BookedCruise) => {
      const sailDate = createDateFromString(cruise.sailDate);
      const returnDate = createDateFromString(cruise.returnDate);
      let currentDate = new Date(sailDate);
      while (currentDate <= returnDate) {
        dates.add(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    return dates;
  }, [localData.booked, bookedCruises]);

  const hasConflict = useCallback((cruise: Cruise): boolean => {
    const sailDate = createDateFromString(cruise.sailDate);
    const returnDate = createDateFromString(cruise.returnDate);
    let currentDate = new Date(sailDate);
    while (currentDate <= returnDate) {
      if (bookedDates.has(currentDate.toISOString().split('T')[0])) {
        return true;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return false;
  }, [bookedDates]);

  const getSmartRecommendations = useCallback((cruises: Cruise[]): Cruise[] => {
    const availableCruises = cruises.filter(c => 
      !isDateInPast(c.sailDate) && 
      !bookedIds.has(c.id) && 
      !hasConflict(c)
    );

    const scored = availableCruises.map(cruise => {
      let score = 0;
      
      if (cruise.nights >= 5 && cruise.nights <= 7) score += 20;
      else if (cruise.nights >= 3 && cruise.nights <= 9) score += 10;
      
      const daysUntil = getDaysUntil(cruise.sailDate);
      if (daysUntil >= 30 && daysUntil <= 90) score += 15;
      else if (daysUntil >= 14 && daysUntil <= 120) score += 10;
      
      if (cruise.freeOBC && cruise.freeOBC > 0) score += 25;
      if (cruise.freeDrinkPackage) score += 20;
      if (cruise.freeGratuities) score += 15;
      if (cruise.freeWifi) score += 5;
      if (cruise.freeSpecialtyDining) score += 10;
      if (cruise.percentOff && cruise.percentOff > 0) score += cruise.percentOff / 2;
      
      if (cruise.offerCode) score += 10;
      
      if (cruise.price && cruise.price > 0) {
        const pricePerNight = cruise.price / (cruise.nights || 1);
        if (pricePerNight < 150) score += 20;
        else if (pricePerNight < 250) score += 10;
      }
      
      return { cruise, score };
    });

    scored.sort((a, b) => b.score - a.score);
    
    return scored.slice(0, 15).map(s => s.cruise);
  }, [bookedIds, hasConflict]);

  const filteredCruises = useMemo(() => {
    let result = [...allCruises];

    if (activeTab === 'available') {
      result = result.filter(c => 
        !isDateInPast(c.sailDate) && 
        !bookedIds.has(c.id) && 
        !hasConflict(c)
      );
    } else if (activeTab === 'all') {
      result = result.filter(c => !isDateInPast(c.sailDate));
    } else if (activeTab === 'booked') {
      const bookedList = [...(localData.booked || []), ...(bookedCruises || [])];
      const bookedMap = new Map<string, Cruise>();
      bookedList.forEach((b: BookedCruise) => {
        if (!bookedMap.has(b.id)) {
          bookedMap.set(b.id, b as Cruise);
        }
      });
      result = Array.from(bookedMap.values());
    } else if (activeTab === 'foryou') {
      result = getSmartRecommendations(allCruises);
    }

    if (filters.cabinType !== 'all') {
      result = result.filter(c => c.cabinType === filters.cabinType);
    }

    if (filters.noConflicts && activeTab === 'all') {
      result = result.filter(c => !hasConflict(c));
    }

    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(c =>
        c.shipName?.toLowerCase().includes(query) ||
        c.destination?.toLowerCase().includes(query) ||
        c.departurePort?.toLowerCase().includes(query) ||
        c.itineraryName?.toLowerCase().includes(query)
      );
    }

    if (activeTab !== 'foryou') {
      result.sort((a, b) => createDateFromString(a.sailDate).getTime() - createDateFromString(b.sailDate).getTime());
    }
    return result;
  }, [allCruises, activeTab, filters, bookedIds, hasConflict, localData.booked, bookedCruises, getSmartRecommendations]);

  const stats = useMemo(() => ({
    showing: filteredCruises.length,
    total: allCruises.length,
    booked: bookedIds.size,
    available: allCruises.filter(c => !isDateInPast(c.sailDate) && !bookedIds.has(c.id)).length,
  }), [filteredCruises, allCruises, bookedIds]);

  const alertCount = useMemo(() => {
    return (localData.offers || []).filter((o: any) => {
      if (o.expiryDate) {
        const days = getDaysUntil(o.expiryDate);
        return days > 0 && days <= 7;
      }
      return false;
    }).length;
  }, [localData.offers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('[Scheduling] Refreshing cruises...');
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      cabinType: 'all',
      noConflicts: false,
      searchQuery: '',
    });
  }, []);

  const handleCruisePress = useCallback((cruise: Cruise) => {
    console.log('[Scheduling] Cruise pressed:', cruise.id);
    router.push(`/cruise-details?id=${cruise.id}` as any);
  }, [router]);

  const handleSettingsPress = useCallback(() => {
    router.push('/settings' as any);
  }, [router]);

  const handleAlertsPress = useCallback(() => {
    console.log('[Scheduling] Alerts pressed');
  }, []);

  const renderCruiseCard = useCallback(({ item, index }: { item: Cruise; index: number }) => {
    const isBooked = bookedIds.has(item.id);
    const conflict = hasConflict(item);
    const daysUntil = getDaysUntil(item.sailDate);
    const isExpiringSoon = item.offerExpiry && getDaysUntil(item.offerExpiry) <= 7;
    const isRecommended = activeTab === 'foryou' && index < 3;

    return (
      <TouchableOpacity
        style={[styles.cruiseCard, conflict && !isBooked && styles.conflictCard, isRecommended && styles.recommendedCard]}
        onPress={() => handleCruisePress(item)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={isBooked ? ['rgba(76, 175, 80, 0.15)', 'rgba(76, 175, 80, 0.05)'] : isRecommended ? ['rgba(212, 165, 116, 0.12)', 'rgba(0, 61, 92, 0.9)'] : ['rgba(0, 31, 63, 0.95)', 'rgba(0, 61, 92, 0.9)']}
          style={StyleSheet.absoluteFill}
        />
        
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Sparkles size={10} color={COLORS.navyDeep} />
            <Text style={styles.recommendedBadgeText}>TOP PICK</Text>
          </View>
        )}
        
        <View style={styles.cardHeader}>
          <View style={styles.shipIconContainer}>
            <Ship size={20} color={COLORS.beigeWarm} />
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.shipName} numberOfLines={1}>{item.shipName}</Text>
            {item.offerCode && (
              <View style={styles.offerBadge}>
                <Star size={10} color={COLORS.goldAccent} />
                <Text style={styles.offerBadgeText}>{item.offerCode}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardHeaderRight}>
            {isBooked && (
              <View style={styles.bookedBadge}>
                <Text style={styles.bookedBadgeText}>BOOKED</Text>
              </View>
            )}
            {!isBooked && conflict && (
              <View style={styles.conflictBadge}>
                <Text style={styles.conflictBadgeText}>CONFLICT</Text>
              </View>
            )}
            <ChevronRight size={18} color={COLORS.textSecondary} />
          </View>
        </View>

        <View style={styles.destinationRow}>
          <Text style={styles.destination} numberOfLines={1}>
            {item.destination || item.itineraryName || 'Caribbean Cruise'}
          </Text>
          {isExpiringSoon && (
            <View style={styles.expiringSoonBadge}>
              <Text style={styles.expiringSoonText}>Offer expires soon</Text>
            </View>
          )}
        </View>

        <View style={styles.cruiseDetails}>
          <View style={styles.detailItem}>
            <CalendarDays size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>
              {formatDate(item.sailDate, 'short')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.nights} nights</Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>{item.departurePort}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {item.cabinType && (
            <View style={styles.cabinTypeBadge}>
              <Text style={styles.cabinTypeText}>{item.cabinType}</Text>
            </View>
          )}
          
          {!isBooked && daysUntil > 0 && (
            <Text style={styles.daysUntilText}>
              {daysUntil} days away
            </Text>
          )}

          {item.price && item.price > 0 && (
            <Text style={styles.priceText}>
              ${item.price.toLocaleString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [bookedIds, hasConflict, handleCruisePress, activeTab]);

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <EasySeasHero
        memberName={currentUser?.name || clubRoyaleProfile.memberName}
        onSettingsPress={handleSettingsPress}
        onAlertsPress={handleAlertsPress}
        alertCount={alertCount}
      />

      <EnhancedTabs
        tabs={TABS.map(tab => ({
          key: tab.key,
          label: tab.label,
          icon: tab.icon,
          badge: tab.key === 'booked' ? stats.booked : undefined,
        }))}
        activeTab={activeTab}
        onTabPress={(key) => setActiveTab(key as ViewTab)}
        variant="segmented"
      />

      <AnimatedActionButtonGroup columns={4} gap={SPACING.sm}>
        <AnimatedActionButton
          label="Filter"
          icon={Filter}
          variant={showFilters ? 'primary' : 'secondary'}
          size="small"
          onPress={() => setShowFilters(!showFilters)}
        />
        <AnimatedActionButton
          label="Clear"
          icon={RotateCcw}
          variant="secondary"
          size="small"
          onPress={clearFilters}
        />
        <AnimatedActionButton
          label="Points"
          icon={Star}
          variant="secondary"
          size="small"
          onPress={() => router.push('/settings' as any)}
        />
        <AnimatedActionButton
          label="Alerts"
          icon={Bell}
          variant="secondary"
          size="small"
          badge={alertCount}
          onPress={handleAlertsPress}
        />
      </AnimatedActionButtonGroup>

      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ship, destination, port..."
          placeholderTextColor={COLORS.textSecondary}
          value={filters.searchQuery}
          onChangeText={(text) => setFilters(prev => ({ ...prev, searchQuery: text }))}
        />
        {filters.searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}>
            <X size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterSectionLabel}>Cabin Type</Text>
          <View style={styles.cabinFilters}>
            {CABIN_FILTERS.map(cabin => (
              <TouchableOpacity
                key={cabin.key}
                style={[styles.cabinChip, filters.cabinType === cabin.key && styles.cabinChipActive]}
                onPress={() => setFilters(prev => ({ ...prev, cabinType: cabin.key }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.cabinChipText, filters.cabinType === cabin.key && styles.cabinChipTextActive]}>
                  {cabin.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={[styles.conflictToggle, filters.noConflicts && styles.conflictToggleActive]}
            onPress={() => setFilters(prev => ({ ...prev, noConflicts: !prev.noConflicts }))}
            activeOpacity={0.7}
          >
            <View style={[styles.toggleDot, filters.noConflicts && styles.toggleDotActive]} />
            <Text style={[styles.conflictToggleText, filters.noConflicts && styles.conflictToggleTextActive]}>
              Hide cruises with date conflicts
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.showing}</Text>
          <Text style={styles.statLabel}>Showing</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.booked}</Text>
          <Text style={styles.statLabel}>Booked</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.aquaAccent }]}>{stats.available}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ship size={56} color={COLORS.beigeWarm} />
      </View>
      <Text style={styles.emptyTitle}>No Cruises Found</Text>
      <Text style={styles.emptyText}>
        {activeTab === 'booked'
          ? 'You haven\'t booked any cruises yet.'
          : filters.searchQuery || filters.cabinType !== 'all' || filters.noConflicts
            ? 'Try adjusting your filters or search.'
            : 'Import cruise data to see available voyages.'}
      </Text>
      {(filters.searchQuery || filters.cabinType !== 'all' || filters.noConflicts) && (
        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
          <LinearGradient
            colors={[COLORS.beigeWarm, COLORS.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.clearFiltersGradient}
          >
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  if (appLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.navyDeep, COLORS.navyMedium, COLORS.navyLight]}
          locations={[0, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={COLORS.beigeWarm} />
        <Text style={styles.loadingText}>Loading cruises...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[COLORS.navyDeep, COLORS.navyMedium, COLORS.navyLight]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={filteredCruises}
          renderItem={renderCruiseCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
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
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={10}
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

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : 0,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  filtersPanel: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterSectionLabel: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  cabinFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  cabinChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cabinChipActive: {
    backgroundColor: COLORS.beigeWarm,
    borderColor: COLORS.beigeWarm,
  },
  cabinChipText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  cabinChipTextActive: {
    color: COLORS.navyDeep,
  },
  conflictToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  conflictToggleActive: {},
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    backgroundColor: 'transparent',
  },
  toggleDotActive: {
    backgroundColor: COLORS.beigeWarm,
    borderColor: COLORS.beigeWarm,
  },
  conflictToggleText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  conflictToggleTextActive: {
    color: COLORS.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
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
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.beigeWarm,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cruiseCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.md,
  },
  conflictCard: {
    borderColor: 'rgba(244, 67, 54, 0.4)',
  },
  recommendedCard: {
    borderColor: COLORS.beigeWarm,
    borderWidth: 2,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.beigeWarm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderBottomLeftRadius: BORDER_RADIUS.sm,
    borderBottomRightRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: COLORS.navyDeep,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  shipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 165, 116, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  shipName: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  offerBadgeText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.goldAccent,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  bookedBadge: {
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
  conflictBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  conflictBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.white,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  destination: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.beigeWarm,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    flex: 1,
  },
  expiringSoonBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.4)',
  },
  expiringSoonText: {
    fontSize: 10,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  cruiseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 116, 0.15)',
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
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cabinTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  cabinTypeText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  daysUntilText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    flex: 1,
  },
  priceText: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.success,
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
  clearFiltersButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  clearFiltersGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  clearFiltersText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.navyDeep,
  },
});
