import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft,
  Ship,
  Plane,
  User,
  Calendar,
  Clock,
  MapPin,
  Anchor,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { useAppState } from '@/state/AppStateProvider';
import { useCruiseStore } from '@/state/CruiseStore';
import { createDateFromString } from '@/lib/date';
import type { CalendarEvent, BookedCruise } from '@/types/models';

const EVENT_COLORS = {
  cruise: '#3B82F6',
  travel: '#F59E0B', 
  personal: '#10B981',
};

interface AgendaItem {
  id: string;
  type: 'cruise' | 'travel' | 'personal' | 'calendar';
  title: string;
  subtitle?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  color: string;
  data: CalendarEvent | BookedCruise;
  dayStatus?: 'start' | 'middle' | 'end' | 'single';
}

export default function DayAgendaScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { localData } = useAppState();
  const { bookedCruises } = useCruiseStore();

  const selectedDate = useMemo(() => {
    if (!date) return new Date();
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [date]);

  const formattedDate = useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  const calendarEvents = useMemo(() => {
    return [...(localData.calendar || []), ...(localData.tripit || [])];
  }, [localData.calendar, localData.tripit]);

  const isDateInRange = useCallback((targetDate: Date, startStr: string, endStr: string): boolean => {
    const start = createDateFromString(startStr);
    const end = createDateFromString(endStr);
    const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return targetDateOnly >= start && targetDateOnly <= end;
  }, []);

  const getDayStatus = useCallback((targetDate: Date, startStr: string, endStr: string): 'start' | 'middle' | 'end' | 'single' => {
    const start = createDateFromString(startStr);
    const end = createDateFromString(endStr);
    const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    targetDateOnly.setHours(0, 0, 0, 0);
    
    const startTime = start.getTime();
    const endTime = end.getTime();
    const targetTime = targetDateOnly.getTime();
    
    if (startTime === endTime) return 'single';
    if (targetTime === startTime) return 'start';
    if (targetTime === endTime) return 'end';
    return 'middle';
  }, []);

  const agendaItems = useMemo((): AgendaItem[] => {
    const items: AgendaItem[] = [];
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    calendarEvents.forEach(event => {
      const eventStart = event.startDate || event.start || '';
      const eventEnd = event.endDate || event.end || eventStart;
      
      if (eventStart) {
        const startDateStr = eventStart.split('T')[0];
        const endDateStr = eventEnd.split('T')[0];
        
        if (dateStr >= startDateStr && dateStr <= endDateStr) {
          const eventType = event.type === 'cruise' ? 'cruise' 
            : (event.type === 'travel' || event.type === 'flight' || event.type === 'hotel') ? 'travel' 
            : 'personal';
          
          const eventColor = event.type === 'cruise' ? EVENT_COLORS.cruise 
            : (event.type === 'travel' || event.type === 'flight' || event.type === 'hotel') ? EVENT_COLORS.travel 
            : EVENT_COLORS.personal;

          items.push({
            id: `event-${event.id}`,
            type: eventType,
            title: event.title,
            subtitle: event.description,
            location: event.location,
            startTime: eventStart.includes('T') ? eventStart.split('T')[1]?.substring(0, 5) : undefined,
            endTime: eventEnd.includes('T') ? eventEnd.split('T')[1]?.substring(0, 5) : undefined,
            isAllDay: event.allDay || !eventStart.includes('T'),
            color: eventColor,
            data: event,
            dayStatus: getDayStatus(selectedDate, eventStart, eventEnd),
          });
        }
      }
    });

    bookedCruises.forEach((cruise: BookedCruise) => {
      if (cruise.sailDate && cruise.returnDate) {
        if (isDateInRange(selectedDate, cruise.sailDate, cruise.returnDate)) {
          items.push({
            id: `cruise-${cruise.id}`,
            type: 'cruise',
            title: cruise.shipName || 'Cruise',
            subtitle: cruise.destination || cruise.itineraryName,
            location: cruise.departurePort,
            isAllDay: true,
            color: EVENT_COLORS.cruise,
            data: cruise,
            dayStatus: getDayStatus(selectedDate, cruise.sailDate, cruise.returnDate),
          });
        }
      }
    });

    items.sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      return 0;
    });

    return items;
  }, [selectedDate, calendarEvents, bookedCruises, isDateInRange, getDayStatus]);

  const handleItemPress = useCallback((item: AgendaItem) => {
    if (item.type === 'cruise' && 'sailDate' in item.data) {
      router.push({
        pathname: '/cruise-details',
        params: { id: item.data.id },
      });
    }
  }, [router]);

  const renderDayStatusBadge = useCallback((status: 'start' | 'middle' | 'end' | 'single') => {
    const labels: Record<string, string> = {
      start: 'Day 1',
      middle: 'Ongoing',
      end: 'Last Day',
      single: 'Today Only',
    };
    
    return (
      <View style={styles.dayStatusBadge}>
        <Text style={styles.dayStatusText}>{labels[status]}</Text>
      </View>
    );
  }, []);

  const getIcon = useCallback((type: string) => {
    switch (type) {
      case 'cruise':
        return Ship;
      case 'travel':
        return Plane;
      default:
        return User;
    }
  }, []);

  const renderAgendaItem = useCallback((item: AgendaItem) => {
    const IconComponent = getIcon(item.type);
    const isCruise = item.type === 'cruise' && 'sailDate' in item.data;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.agendaItem}
        activeOpacity={isCruise ? 0.7 : 1}
        onPress={() => handleItemPress(item)}
      >
        <View style={[styles.itemIndicator, { backgroundColor: item.color }]} />
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <View style={styles.itemTitleRow}>
              <View style={[styles.itemIconContainer, { backgroundColor: `${item.color}20` }]}>
                <IconComponent size={18} color={item.color} />
              </View>
              <View style={styles.itemTitleContainer}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                {item.dayStatus && renderDayStatusBadge(item.dayStatus)}
              </View>
            </View>
            
            {item.isAllDay ? (
              <View style={styles.allDayBadge}>
                <Text style={styles.allDayText}>All Day</Text>
              </View>
            ) : item.startTime && (
              <View style={styles.timeContainer}>
                <Clock size={12} color={COLORS.textSecondary} />
                <Text style={styles.timeText}>
                  {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
                </Text>
              </View>
            )}
          </View>

          {item.subtitle && (
            <Text style={styles.itemSubtitle} numberOfLines={2}>{item.subtitle}</Text>
          )}

          {item.location && (
            <View style={styles.locationContainer}>
              <MapPin size={12} color={COLORS.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
            </View>
          )}

          {isCruise && (
            <View style={styles.cruiseDetails}>
              <View style={styles.cruiseDetailItem}>
                <Anchor size={12} color={COLORS.beigeWarm} />
                <Text style={styles.cruiseDetailText}>
                  {(item.data as BookedCruise).nights} nights
                </Text>
              </View>
              {(item.data as BookedCruise).reservationNumber && (
                <View style={styles.cruiseDetailItem}>
                  <Text style={styles.cruiseDetailLabel}>Res#</Text>
                  <Text style={styles.cruiseDetailText}>
                    {(item.data as BookedCruise).reservationNumber}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [handleItemPress, getIcon, renderDayStatusBadge]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      <LinearGradient
        colors={[COLORS.navyDeep, COLORS.navyMedium, COLORS.navyLight]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Calendar size={20} color={COLORS.beigeWarm} />
            <Text style={styles.headerTitle}>Day Agenda</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Text style={styles.eventCount}>
            {agendaItems.length} {agendaItems.length === 1 ? 'event' : 'events'}
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {agendaItems.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Calendar size={48} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No Events</Text>
              <Text style={styles.emptyText}>
                No events scheduled for this day
              </Text>
            </View>
          ) : (
            <View style={styles.agendaList}>
              {agendaItems.map(renderAgendaItem)}
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  dateHeader: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  eventCount: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  agendaList: {
    gap: SPACING.md,
  },
  agendaItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.md,
  },
  itemIndicator: {
    width: 5,
  },
  itemContent: {
    flex: 1,
    padding: SPACING.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  itemIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  itemTitle: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  dayStatusBadge: {
    backgroundColor: 'rgba(212, 165, 116, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  dayStatusText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.beigeWarm,
  },
  allDayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  allDayText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textSecondary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  itemSubtitle: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  cruiseDetails: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  cruiseDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cruiseDetailLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
  },
  cruiseDetailText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
