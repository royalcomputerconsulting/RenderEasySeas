import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Ship, 
  Calendar, 
  MapPin, 
  Clock, 
  Gift, 
  Tag, 
  Percent,
  DollarSign,
  Wine,
  Wifi,
  Utensils,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { formatCurrency, formatNights } from '@/lib/format';
import { formatDate, getDaysUntil, formatDateRange, createDateFromString } from '@/lib/date';
import type { Cruise } from '@/types/models';

interface OfferCardProps {
  offer: Cruise;
  onPress?: () => void;
  isBooked?: boolean;
  recommended?: boolean;
  showImage?: boolean;
  compact?: boolean;
}

const CRUISE_IMAGES = [
  'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=200&fit=crop',
];

function getImageForCruise(cruise: Cruise, index: number = 0): string {
  if (cruise.imageUrl) return cruise.imageUrl;
  return CRUISE_IMAGES[index % CRUISE_IMAGES.length];
}

export function OfferCard({ 
  offer, 
  onPress, 
  isBooked = false, 
  recommended = false,
  showImage = true,
  compact = false,
}: OfferCardProps) {
  const daysUntil = getDaysUntil(offer.sailDate);
  const hasPerks = offer.freeOBC || offer.freeGratuities || offer.freeDrinkPackage || offer.freeWifi || offer.freeSpecialtyDining || offer.percentOff;
  const isExpiringSoon = offer.offerExpiry ? getDaysUntil(offer.offerExpiry) <= 7 && getDaysUntil(offer.offerExpiry) > 0 : false;
  const isExpired = offer.offerExpiry ? getDaysUntil(offer.offerExpiry) <= 0 : false;

  const imageIndex = parseInt(offer.id, 10) || 0;
  const imageUrl = getImageForCruise(offer, imageIndex);

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, isBooked && styles.bookedContainer]}
        onPress={onPress}
        activeOpacity={0.85}
        testID="offer-card-compact"
      >
        <LinearGradient
          colors={['rgba(0, 31, 63, 0.95)', 'rgba(0, 61, 92, 0.9)']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.compactContent}>
          <View style={styles.compactLeft}>
            <View style={styles.compactShipBadge}>
              <Ship size={14} color={COLORS.beigeWarm} />
              <Text style={styles.compactShipName} numberOfLines={1}>{offer.shipName}</Text>
            </View>
            <Text style={styles.compactDestination} numberOfLines={1}>{offer.destination}</Text>
            <View style={styles.compactDetails}>
              <Text style={styles.compactDate}>
                {createDateFromString(offer.sailDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.compactDot}>•</Text>
              <Text style={styles.compactNights}>{offer.nights} nights</Text>
            </View>
          </View>
          
          <View style={styles.compactRight}>
            {offer.price !== undefined && (
              <Text style={styles.compactPrice}>{formatCurrency(offer.price)}</Text>
            )}
            {isBooked && (
              <View style={styles.compactBookedBadge}>
                <CheckCircle size={10} color={COLORS.white} />
                <Text style={styles.compactBookedText}>Booked</Text>
              </View>
            )}
            <ChevronRight size={16} color={COLORS.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, isBooked && styles.bookedContainer]}
      onPress={onPress}
      activeOpacity={0.85}
      testID="offer-card"
    >
      {showImage && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />

          {recommended && (
            <View style={styles.recommendedBadge}>
              <Gift size={12} color={COLORS.navyDeep} />
              <Text style={styles.recommendedText}>Recommended</Text>
            </View>
          )}

          {isBooked && (
            <View style={styles.bookedBadge}>
              <CheckCircle size={12} color={COLORS.white} />
              <Text style={styles.bookedText}>Booked</Text>
            </View>
          )}

          {isExpiringSoon && !isExpired && (
            <View style={styles.expiringBadge}>
              <AlertCircle size={12} color={COLORS.white} />
              <Text style={styles.expiringText}>Expires Soon</Text>
            </View>
          )}

          {daysUntil > 0 && daysUntil <= 30 && (
            <View style={styles.countdownBadge}>
              <Clock size={10} color={COLORS.white} />
              <Text style={styles.countdownText}>
                {daysUntil === 1 ? '1 day' : `${daysUntil} days`}
              </Text>
            </View>
          )}

          <View style={styles.imageContent}>
            <View style={styles.shipBadge}>
              <Ship size={14} color={COLORS.beigeWarm} />
              <Text style={styles.shipName} numberOfLines={1}>{offer.shipName}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.content}>
        {!showImage && (
          <View style={styles.noImageHeader}>
            <View style={styles.shipBadgeInline}>
              <Ship size={16} color={COLORS.beigeWarm} />
              <Text style={styles.shipNameInline}>{offer.shipName}</Text>
            </View>
            {isBooked && (
              <View style={styles.bookedBadgeSmall}>
                <CheckCircle size={10} color={COLORS.white} />
                <Text style={styles.bookedTextSmall}>Booked</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.mainInfo}>
          <View style={styles.destinationRow}>
            <Text style={styles.destination} numberOfLines={1}>{offer.destination}</Text>
            {offer.price !== undefined && (
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>from</Text>
                <Text style={styles.price}>{formatCurrency(offer.price)}</Text>
              </View>
            )}
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Calendar size={12} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>
                {formatDateRange(offer.sailDate, offer.returnDate)}
              </Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Clock size={12} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{formatNights(offer.nights)}</Text>
            </View>
            <View style={styles.detailItem}>
              <MapPin size={12} color={COLORS.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>{offer.departurePort}</Text>
            </View>
          </View>
        </View>

        {hasPerks && (
          <View style={styles.perksContainer}>
            <View style={styles.perksHeader}>
              <Gift size={12} color={COLORS.beigeWarm} />
              <Text style={styles.perksTitle}>Included Perks</Text>
            </View>
            <View style={styles.perksList}>
              {offer.freeOBC && offer.freeOBC > 0 && (
                <View style={styles.perkItem}>
                  <DollarSign size={10} color={COLORS.success} />
                  <Text style={styles.perkText}>${offer.freeOBC} OBC</Text>
                </View>
              )}
              {offer.freeGratuities && (
                <View style={styles.perkItem}>
                  <Tag size={10} color={COLORS.success} />
                  <Text style={styles.perkText}>Free Gratuities</Text>
                </View>
              )}
              {offer.freeDrinkPackage && (
                <View style={styles.perkItem}>
                  <Wine size={10} color={COLORS.success} />
                  <Text style={styles.perkText}>Drink Package</Text>
                </View>
              )}
              {offer.freeWifi && (
                <View style={styles.perkItem}>
                  <Wifi size={10} color={COLORS.success} />
                  <Text style={styles.perkText}>Free WiFi</Text>
                </View>
              )}
              {offer.freeSpecialtyDining && (
                <View style={styles.perkItem}>
                  <Utensils size={10} color={COLORS.success} />
                  <Text style={styles.perkText}>Specialty Dining</Text>
                </View>
              )}
              {offer.percentOff && offer.percentOff > 0 && (
                <View style={styles.perkItem}>
                  <Percent size={10} color={COLORS.success} />
                  <Text style={styles.perkText}>{offer.percentOff}% Off</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {offer.offerExpiry && (
          <View style={styles.expiryRow}>
            <AlertCircle size={12} color={isExpiringSoon ? COLORS.warning : COLORS.textSecondary} />
            <Text style={[styles.expiryText, isExpiringSoon && styles.expiryTextUrgent]}>
              {isExpired ? 'Offer Expired' : `Offer expires ${formatDate(offer.offerExpiry, 'medium')}`}
            </Text>
          </View>
        )}

        <View style={styles.offerDetailsSection}>
          {offer.cabinType && (
            <View style={styles.offerDetailRow}>
              <Text style={styles.offerDetailKey}>Room Type:</Text>
              <Text style={styles.offerDetailValue}>{offer.cabinType}</Text>
            </View>
          )}
          {offer.retailValue && offer.retailValue > 0 && (
            <View style={styles.offerDetailRow}>
              <Text style={styles.offerDetailKey}>Trade-In Value:</Text>
              <Text style={[styles.offerDetailValue, styles.tradeInHighlight]}>
                {formatCurrency(offer.retailValue)}
              </Text>
            </View>
          )}
          {offer.compValue && offer.compValue > 0 && (
            <View style={styles.offerDetailRow}>
              <Text style={styles.offerDetailKey}>Comp Value:</Text>
              <Text style={[styles.offerDetailValue, styles.compHighlight]}>
                {formatCurrency(offer.compValue)}
              </Text>
            </View>
          )}
        </View>

        {(offer.itinerary || offer.ports || offer.itineraryName) && (
          <View style={styles.itinerarySection}>
            <View style={styles.itineraryHeader}>
              <MapPin size={14} color={COLORS.beigeWarm} />
              <Text style={styles.itineraryTitle}>Day-by-Day</Text>
            </View>
            <View style={styles.itineraryList}>
              {(() => {
                let ports: string[] = [];
                if (offer.itinerary && offer.itinerary.length > 0) {
                  ports = offer.itinerary.map(day => typeof day === 'string' ? day : day.port);
                } else if (offer.itineraryRaw && offer.itineraryRaw.length > 0) {
                  ports = offer.itineraryRaw;
                } else if (offer.ports && offer.ports.length > 0) {
                  ports = offer.ports;
                } else if (offer.itineraryName) {
                  ports = offer.itineraryName.split('→').map(p => p.trim()).filter(Boolean);
                }
                
                return ports.slice(0, 5).map((port, index) => (
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
                if (offer.itinerary && offer.itinerary.length > 0) {
                  ports = offer.itinerary.map(day => typeof day === 'string' ? day : day.port);
                } else if (offer.itineraryRaw && offer.itineraryRaw.length > 0) {
                  ports = offer.itineraryRaw;
                } else if (offer.ports && offer.ports.length > 0) {
                  ports = offer.ports;
                } else if (offer.itineraryName) {
                  ports = offer.itineraryName.split('→').map(p => p.trim()).filter(Boolean);
                }
                
                return ports.length > 5 ? (
                  <Text style={styles.itineraryMore}>+{ports.length - 5} more ports</Text>
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
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.sm,
  },
  bookedContainer: {
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  compactLeft: {
    flex: 1,
  },
  compactShipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  compactShipName: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.beigeWarm,
  },
  compactDestination: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  compactDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactDate: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  compactDot: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.xs,
  },
  compactNights: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  compactRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  compactPrice: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.beigeWarm,
  },
  compactBookedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    gap: 2,
  },
  compactBookedText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.white,
  },
  imageContainer: {
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  recommendedBadge: {
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
  recommendedText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.navyDeep,
  },
  bookedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  bookedText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.white,
  },
  bookedBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  bookedTextSmall: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.white,
  },
  expiringBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  expiringText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.white,
  },
  countdownBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  countdownText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.white,
  },
  imageContent: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
  },
  shipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 31, 63, 0.85)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 6,
  },
  shipName: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
  },
  noImageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 116, 0.15)',
  },
  shipBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  shipNameInline: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.beigeWarm,
  },
  content: {
    padding: SPACING.md,
  },
  mainInfo: {
    marginBottom: SPACING.sm,
  },
  destinationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  destination: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginBottom: -2,
  },
  price: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.beigeWarm,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
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
  perksContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  perksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  perksTitle: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.beigeWarm,
  },
  perksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.xs,
    gap: 4,
  },
  perkText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  expiryText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  expiryTextUrgent: {
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  itinerarySection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  itineraryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  itineraryTitle: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.beigeWarm,
  },
  itineraryList: {
    gap: SPACING.xs,
  },
  itineraryDay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  itineraryDayNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itineraryDayNumberText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.beigeWarm,
  },
  itineraryPort: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  itineraryMore: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
    marginLeft: 32,
  },
  offerDetailsSection: {
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(77, 208, 225, 0.08)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(77, 208, 225, 0.2)',
  },
  offerDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  offerDetailKey: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  offerDetailValue: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
  },
  tradeInHighlight: {
    color: COLORS.aquaAccent,
    fontSize: TYPOGRAPHY.fontSizeLG,
  },
  compHighlight: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.fontSizeLG,
  },
});
