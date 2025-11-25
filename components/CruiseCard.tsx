import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ship, Calendar, MapPin, Clock, Tag, Gift } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { formatCurrency, formatNights, formatPricePerNight } from '@/lib/format';
import { formatDate, getDaysUntil } from '@/lib/date';
import type { Cruise } from '@/types/models';

interface CruiseCardProps {
  cruise: Cruise;
  onPress?: () => void;
  showPricePerNight?: boolean;
  compact?: boolean;
}

export function CruiseCard({ cruise, onPress, showPricePerNight = true, compact = false }: CruiseCardProps) {
  const daysUntil = getDaysUntil(cruise.sailDate);
  const hasOffer = cruise.freeOBC || cruise.freeGratuities || cruise.freeDrinkPackage || cruise.percentOff;
  
  const defaultImage = 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=200&fit=crop';

  return (
    <TouchableOpacity 
      style={[styles.container, compact && styles.compactContainer]}
      onPress={onPress}
      activeOpacity={0.8}
      testID="cruise-card"
    >
      <Image 
        source={{ uri: cruise.imageUrl || defaultImage }} 
        style={[styles.image, compact && styles.compactImage]}
        resizeMode="cover"
      />
      
      {hasOffer && (
        <View style={styles.offerBadge}>
          <Gift size={12} color={COLORS.navyDeep} />
          <Text style={styles.offerBadgeText}>Special Offer</Text>
        </View>
      )}

      {daysUntil > 0 && daysUntil <= 30 && (
        <View style={styles.countdownBadge}>
          <Clock size={12} color={COLORS.white} />
          <Text style={styles.countdownText}>{daysUntil} days</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.shipInfo}>
            <Ship size={16} color={COLORS.beigeWarm} />
            <Text style={styles.shipName} numberOfLines={1}>{cruise.shipName}</Text>
          </View>
          {cruise.price && (
            <Text style={styles.price}>{formatCurrency(cruise.price)}</Text>
          )}
        </View>

        <Text style={styles.destination} numberOfLines={1}>{cruise.destination}</Text>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Calendar size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{formatDate(cruise.sailDate, 'short')}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Clock size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{formatNights(cruise.nights)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <MapPin size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>{cruise.departurePort}</Text>
          </View>
        </View>

        {showPricePerNight && cruise.price && cruise.nights > 0 && (
          <View style={styles.pricePerNight}>
            <Text style={styles.pricePerNightText}>
              {formatPricePerNight(cruise.price, cruise.nights)}
            </Text>
          </View>
        )}

        {hasOffer && (
          <View style={styles.offers}>
            {cruise.freeOBC && (
              <View style={styles.offerTag}>
                <Tag size={10} color={COLORS.success} />
                <Text style={styles.offerTagText}>${cruise.freeOBC} OBC</Text>
              </View>
            )}
            {cruise.freeGratuities && (
              <View style={styles.offerTag}>
                <Tag size={10} color={COLORS.success} />
                <Text style={styles.offerTagText}>Free Gratuities</Text>
              </View>
            )}
            {cruise.percentOff && (
              <View style={styles.offerTag}>
                <Tag size={10} color={COLORS.success} />
                <Text style={styles.offerTagText}>{cruise.percentOff}% Off</Text>
              </View>
            )}
          </View>
        )}

        {(cruise.itinerary || cruise.ports || cruise.itineraryName) && (
          <View style={styles.itinerarySection}>
            <View style={styles.itineraryHeader}>
              <MapPin size={12} color={COLORS.beigeWarm} />
              <Text style={styles.itineraryTitle}>Day-by-Day</Text>
            </View>
            <View style={styles.itineraryList}>
              {(() => {
                let ports: string[] = [];
                if (cruise.itinerary && cruise.itinerary.length > 0) {
                  ports = cruise.itinerary.map(day => typeof day === 'string' ? day : day.port);
                } else if (cruise.itineraryRaw && cruise.itineraryRaw.length > 0) {
                  ports = cruise.itineraryRaw;
                } else if (cruise.ports && cruise.ports.length > 0) {
                  ports = cruise.ports;
                } else if (cruise.itineraryName) {
                  ports = cruise.itineraryName.split('→').map(p => p.trim()).filter(Boolean);
                }
                
                return ports.slice(0, 4).map((port, index) => (
                  <View key={index} style={styles.itineraryDay}>
                    <View style={styles.itineraryDayNumber}>
                      <Text style={styles.itineraryDayNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.itineraryPort} numberOfLines={1}>{port}</Text>
                  </View>
                ));
              })()}
              {(() => {
                let ports: string[] = [];
                if (cruise.itinerary && cruise.itinerary.length > 0) {
                  ports = cruise.itinerary.map(day => typeof day === 'string' ? day : day.port);
                } else if (cruise.itineraryRaw && cruise.itineraryRaw.length > 0) {
                  ports = cruise.itineraryRaw;
                } else if (cruise.ports && cruise.ports.length > 0) {
                  ports = cruise.ports;
                } else if (cruise.itineraryName) {
                  ports = cruise.itineraryName.split('→').map(p => p.trim()).filter(Boolean);
                }
                
                return ports.length > 4 ? (
                  <Text style={styles.itineraryMore}>+{ports.length - 4} more</Text>
                ) : null;
              })()}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.md,
  },
  compactContainer: {
    flexDirection: 'row',
  },
  image: {
    width: '100%',
    height: 140,
  },
  compactImage: {
    width: 100,
    height: '100%',
  },
  offerBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.beigeWarm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  offerBadgeText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.navyDeep,
  },
  countdownBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  countdownText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.white,
  },
  content: {
    padding: SPACING.md,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  shipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  shipName: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  price: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.beigeWarm,
  },
  destination: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
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
  pricePerNight: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
  },
  pricePerNightText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  offers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  offerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    gap: 4,
  },
  offerTagText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  itinerarySection: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  itineraryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  itineraryTitle: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.beigeWarm,
  },
  itineraryList: {
    gap: SPACING.xs,
  },
  itineraryDay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  itineraryDayNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itineraryDayNumberText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.beigeWarm,
  },
  itineraryPort: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
  },
  itineraryMore: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginLeft: 28,
  },
});
