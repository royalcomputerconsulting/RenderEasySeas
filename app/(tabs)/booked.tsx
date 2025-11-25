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
  Calendar,
  MapPin,
  ChevronRight,
  Clock,
  CheckCircle,
  RotateCcw,
  EyeOff,
  X,
  ArrowUpDown,
  Star,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { useAppState } from '@/state/AppStateProvider';
import { useCruiseStore } from '@/state/CruiseStore';
import { useUser } from '@/state/UserProvider';
import { EasySeasHero } from '@/components/EasySeasHero';
import { ActionButton } from '@/components/ui/ActionButton';
import { formatCurrency, formatNights } from '@/lib/format';
import { formatDate, getDaysUntil, isDateInPast, createDateFromString } from '@/lib/date';
import type { BookedCruise } from '@/types/models';

type FilterType = 'all' | 'upcoming' | 'completed';
type SortType = 'newest' | 'oldest' | 'ship' | 'nights';

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' },
];

const SORT_OPTIONS: { label: string; value: SortType }[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'By Ship', value: 'ship' },
  { label: 'By Nights', value: 'nights' },
];

export default function BookedScreen() {
  const router = useRouter();
  const { localData, clubRoyaleProfile, userPoints, isLoading: appLoading, refreshData } = useAppState();
  const { bookedCruises: storedBooked } = useCruiseStore();
  const { currentUser } = useUser();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('oldest');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const bookedCruises = useMemo(() => {
    const localBooked = localData.booked || [];
    return localBooked.length > 0 ? localBooked : storedBooked;
  }, [localData.booked, storedBooked]);

  const filteredCruises = useMemo(() => {
    let result = [...bookedCruises];

    if (filter === 'upcoming') {
      result = result.filter(cruise => !isDateInPast(cruise.returnDate));
    } else if (filter === 'completed') {
      result = result.filter(cruise => isDateInPast(cruise.returnDate));
    }

    if (hideCompleted) {
      result = result.filter(cruise => !isDateInPast(cruise.returnDate));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(cruise =>
        cruise.shipName?.toLowerCase().includes(query) ||
        cruise.destination?.toLowerCase().includes(query) ||
        cruise.departurePort?.toLowerCase().includes(query) ||
        cruise.reservationNumber?.toLowerCase().includes(query) ||
        cruise.itineraryName?.toLowerCase().includes(query)
      );
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => createDateFromString(b.sailDate).getTime() - createDateFromString(a.sailDate).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => createDateFromString(a.sailDate).getTime() - createDateFromString(b.sailDate).getTime());
        break;
      case 'ship':
        result.sort((a, b) => (a.shipName || '').localeCompare(b.shipName || ''));
        break;
      case 'nights':
        result.sort((a, b) => (b.nights || 0) - (a.nights || 0));
        break;
    }

    return result;
  }, [bookedCruises, filter, hideCompleted, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const upcoming = bookedCruises.filter(c => !isDateInPast(c.returnDate)).length;
    const completed = bookedCruises.filter(c => isDateInPast(c.returnDate)).length;
    const withData = bookedCruises.filter(c => c.price && c.price > 0).length;
    return { upcoming, completed, withData, total: bookedCruises.length };
  }, [bookedCruises]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('[Booked] Refreshing data...');
    await refreshData();
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  }, [refreshData]);

  const clearFilters = useCallback(() => {
    setFilter('all');
    setSearchQuery('');
    setHideCompleted(false);
    setSortBy('oldest');
  }, []);

  const handleCruisePress = useCallback((cruise: BookedCruise) => {
    console.log('[Booked] Cruise pressed:', cruise.id);
    router.push(`/cruise-details?id=${cruise.id}` as any);
  }, [router]);

  const handleSettingsPress = useCallback(() => {
    router.push('/settings' as any);
  }, [router]);

  const getCurrentSortLabel = () => {
    return SORT_OPTIONS.find(s => s.value === sortBy)?.label || 'Sort';
  };

  const renderCruiseCard = useCallback(({ item }: { item: BookedCruise }) => {
    const isPast = isDateInPast(item.returnDate);
    const daysUntil = getDaysUntil(item.sailDate);
    
    return (
      <TouchableOpacity 
        style={styles.cruiseCard} 
        activeOpacity={0.85}
        onPress={() => handleCruisePress(item)}
      >
        <LinearGradient
          colors={isPast 
            ? ['rgba(76, 175, 80, 0.08)', 'rgba(76, 175, 80, 0.02)'] 
            : ['rgba(0, 31, 63, 0.95)', 'rgba(0, 61, 92, 0.9)']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={[styles.statusBadge, isPast ? styles.completedBadge : styles.upcomingBadge]}>
          {isPast ? (
            <CheckCircle size={12} color={COLORS.success} />
          ) : (
            <Clock size={12} color={COLORS.beigeWarm} />
          )}
          <Text style={[styles.statusText, isPast && styles.completedStatusText]}>
            {isPast ? 'Completed' : `${daysUntil} days`}
          </Text>
        </View>

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
          <ChevronRight size={18} color={COLORS.textSecondary} />
        </View>

        <Text style={styles.destination}>
          {item.destination || item.itineraryName || 'Caribbean Cruise'}
        </Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.detail}>
            <Calendar size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{formatDate(item.sailDate, 'short')}</Text>
          </View>
          <View style={styles.detail}>
            <MapPin size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>{item.departurePort}</Text>
          </View>
          <View style={styles.detail}>
            <Clock size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{formatNights(item.nights)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {item.reservationNumber && (
            <View style={styles.reservationBadge}>
              <Text style={styles.reservationLabel}>Res #</Text>
              <Text style={styles.reservationNumber}>{item.reservationNumber}</Text>
            </View>
          )}
          
          {item.cabinType && (
            <View style={styles.cabinTypeBadge}>
              <Text style={styles.cabinTypeText}>{item.cabinType}</Text>
            </View>
          )}

          <View style={styles.priceContainer}>
            {item.price && item.price > 0 && (
              <Text style={styles.price}>{formatCurrency(item.price)}</Text>
            )}
          </View>
        </View>

        {isPast && item.earnedPoints && item.earnedPoints > 0 && (
          <View style={styles.pointsRow}>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsValue}>+{item.earnedPoints}</Text>
              <Text style={styles.pointsLabel}>points earned</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [handleCruisePress]);

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <EasySeasHero
        memberName={currentUser?.name || clubRoyaleProfile.memberName}
        onSettingsPress={handleSettingsPress}
      />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.aquaAccent }]}>{stats.upcoming}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.beigeWarm }]}>{stats.withData}</Text>
          <Text style={styles.statLabel}>With Data</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <ActionButton
          label="Refresh"
          icon={RotateCcw}
          variant="secondary"
          size="small"
          onPress={onRefresh}
        />
        <ActionButton
          label={hideCompleted ? 'Show All' : 'Hide Completed'}
          icon={EyeOff}
          variant={hideCompleted ? 'primary' : 'secondary'}
          size="small"
          onPress={() => setHideCompleted(!hideCompleted)}
        />
        <ActionButton
          label="Clear"
          icon={X}
          variant="secondary"
          size="small"
          onPress={clearFilters}
        />
        <ActionButton
          label="Sort"
          icon={ArrowUpDown}
          variant="secondary"
          size="small"
          onPress={() => setShowSortMenu(!showSortMenu)}
        />
      </View>

      {showSortMenu && (
        <View style={styles.sortMenu}>
          {SORT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[styles.sortOption, sortBy === option.value && styles.sortOptionActive]}
              onPress={() => {
                setSortBy(option.value);
                setShowSortMenu(false);
              }}
            >
              <Text style={[styles.sortOptionText, sortBy === option.value && styles.sortOptionTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ship, destination, reservation..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sortChipRow}>
        <TouchableOpacity 
          style={styles.sortChip}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <ArrowUpDown size={14} color={COLORS.beigeWarm} />
          <Text style={styles.sortChipText}>{getCurrentSortLabel()}</Text>
        </TouchableOpacity>
        
        <View style={styles.filterTabs}>
          {FILTER_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[styles.filterTab, filter === option.value && styles.activeTab]}
              onPress={() => setFilter(option.value)}
            >
              <Text style={[styles.filterTabText, filter === option.value && styles.activeTabText]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
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
        {filter === 'upcoming' 
          ? 'You have no upcoming cruises scheduled.'
          : filter === 'completed'
          ? 'You haven\'t completed any cruises yet.'
          : searchQuery
          ? 'No cruises match your search.'
          : 'Your booked cruises will appear here.'}
      </Text>
      {(searchQuery || filter !== 'all' || hideCompleted) && (
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
  statValue: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  sortMenu: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  sortOption: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  sortOptionActive: {
    backgroundColor: 'rgba(212, 165, 116, 0.15)',
  },
  sortOptionText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textSecondary,
  },
  sortOptionTextActive: {
    color: COLORS.beigeWarm,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
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
  sortChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(212, 165, 116, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.3)',
  },
  sortChipText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.beigeWarm,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  filterTabs: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTab: {
    backgroundColor: COLORS.beigeWarm,
    borderColor: COLORS.beigeWarm,
  },
  filterTabText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.navyDeep,
  },
  cruiseCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  statusBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
    zIndex: 1,
  },
  upcomingBadge: {
    backgroundColor: 'rgba(212, 165, 116, 0.9)',
  },
  completedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.navyDeep,
  },
  completedStatusText: {
    color: COLORS.white,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginTop: SPACING.xl,
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
  destination: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.beigeWarm,
    marginBottom: SPACING.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 116, 0.15)',
  },
  detail: {
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
    flexWrap: 'wrap',
  },
  reservationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  reservationLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
  },
  reservationNumber: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
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
  priceContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  price: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.success,
  },
  pointsRow: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 165, 116, 0.15)',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  pointsValue: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.success,
  },
  pointsLabel: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.success,
  },
  emptyState: {
    alignItems: 'center',
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
