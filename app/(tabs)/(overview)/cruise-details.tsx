import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ship, Calendar, MapPin, Clock, DollarSign, Gift, Star, Users, Anchor, Tag, ArrowLeft, Edit3, X, Save, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { formatCurrency, formatNights } from '@/lib/format';
import { formatDate, getDaysUntil } from '@/lib/date';
import { useAppState } from '@/state/AppStateProvider';

export default function CruiseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { localData, setLocalData } = useAppState();

  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editWinnings, setEditWinnings] = useState<string>('');
  const [editPoints, setEditPoints] = useState<string>('');

  const updateCruise = (updatedCruise: any) => {
    console.log('[CruiseDetails] Updating cruise:', updatedCruise);
    const bookedIndex = localData.booked.findIndex(c => c.id === updatedCruise.id);
    const cruiseIndex = localData.cruises.findIndex(c => c.id === updatedCruise.id);
    
    if (bookedIndex !== -1) {
      const newBooked = [...localData.booked];
      newBooked[bookedIndex] = updatedCruise;
      setLocalData({ booked: newBooked });
    } else if (cruiseIndex !== -1) {
      const newCruises = [...localData.cruises];
      newCruises[cruiseIndex] = updatedCruise;
      setLocalData({ cruises: newCruises });
    }
  };

  const cruise = useMemo(() => {
    const allCruises = [...(localData.cruises || []), ...(localData.booked || [])];
    return allCruises.find(c => c.id === id);
  }, [localData.cruises, localData.booked, id]);

  const itineraryPorts = useMemo((): string[] => {
    if (!cruise) return [];
    if (cruise.itinerary && cruise.itinerary.length > 0) {
      return cruise.itinerary.map(day => typeof day === 'string' ? day : day.port);
    }
    if (cruise.itineraryRaw && cruise.itineraryRaw.length > 0) {
      return cruise.itineraryRaw;
    }
    if (cruise.ports && cruise.ports.length > 0) {
      return cruise.ports;
    }
    if (cruise.itineraryName) {
      return cruise.itineraryName.split('→').map(p => p.trim()).filter(Boolean);
    }
    return [cruise.departurePort || 'Departure', cruise.destination || 'Destination'];
  }, [cruise]);

  const cruiseDetails = useMemo(() => {
    if (!cruise) return null;
    const displayPrice = cruise.balconyPrice || cruise.oceanviewPrice || cruise.interiorPrice || cruise.price || 0;
    const retailPrice = cruise.retailValue || cruise.originalPrice || 0;
    const daysUntil = getDaysUntil(cruise.sailDate);
    const savings = retailPrice > displayPrice ? retailPrice - displayPrice : 0;
    const hasPerks = cruise.freeOBC || cruise.freeGratuities || cruise.freeDrinkPackage || cruise.freeWifi || cruise.freeSpecialtyDining;
    const isBooked = 'reservationNumber' in cruise || 'bookingId' in cruise;
    return { displayPrice, retailPrice, daysUntil, savings, hasPerks, isBooked };
  }, [cruise]);

  if (!cruise || !cruiseDetails) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.navyDeep, COLORS.navyMedium]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.notFoundContainer}>
          <Ship size={64} color={COLORS.beigeWarm} />
          <Text style={styles.notFoundTitle}>Cruise Not Found</Text>
          <Text style={styles.notFoundText}>The cruise you are looking for could not be found.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color={COLORS.navyDeep} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { displayPrice, daysUntil, savings, hasPerks, isBooked } = cruiseDetails;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.navyDeep, COLORS.navyMedium]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroPlaceholder}>
          <LinearGradient
            colors={['rgba(0,61,92,0.9)', 'rgba(0,31,63,0.95)']}
            style={StyleSheet.absoluteFill}
          />
          <Anchor size={80} color={COLORS.beigeWarm} style={{ opacity: 0.3 }} />
          {isBooked && (
            <View style={styles.bookedBadge}>
              <Text style={styles.bookedBadgeText}>BOOKED</Text>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <View style={styles.shipRow}>
              <Ship size={24} color={COLORS.beigeWarm} />
              <Text style={styles.shipName}>{cruise.shipName}</Text>
            </View>
            <Text style={styles.destination}>{cruise.itineraryName || cruise.destination || 'Cruise'}</Text>
            
            {cruise.offerCode && (
              <View style={styles.offerCodeBadge}>
                <Tag size={14} color={COLORS.beigeWarm} />
                <Text style={styles.offerCodeText}>{cruise.offerCode}</Text>
              </View>
            )}
            
            {daysUntil > 0 && (
              <View style={styles.countdownContainer}>
                <Clock size={16} color={COLORS.beigeWarm} />
                <Text style={styles.countdown}>{daysUntil} days until departure</Text>
              </View>
            )}
          </View>

          <View style={styles.priceSection}>
            <View style={styles.pricingGrid}>
              {cruise.interiorPrice && cruise.interiorPrice > 0 && (
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Interior</Text>
                  <Text style={styles.priceValue}>{formatCurrency(cruise.interiorPrice)}</Text>
                </View>
              )}
              {cruise.oceanviewPrice && cruise.oceanviewPrice > 0 && (
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Ocean View</Text>
                  <Text style={styles.priceValue}>{formatCurrency(cruise.oceanviewPrice)}</Text>
                </View>
              )}
              {cruise.balconyPrice && cruise.balconyPrice > 0 && (
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Balcony</Text>
                  <Text style={styles.priceValue}>{formatCurrency(cruise.balconyPrice)}</Text>
                </View>
              )}
              {cruise.suitePrice && cruise.suitePrice > 0 && (
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Suite</Text>
                  <Text style={styles.priceValue}>{formatCurrency(cruise.suitePrice)}</Text>
                </View>
              )}
            </View>
            
            {cruise.taxes && cruise.taxes > 0 && (
              <View style={styles.taxesRow}>
                <Text style={styles.taxesLabel}>Port Taxes & Fees:</Text>
                <Text style={styles.taxesValue}>{formatCurrency(cruise.taxes)}</Text>
              </View>
            )}
            
            {savings > 0 && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>Save {formatCurrency(savings)}</Text>
              </View>
            )}
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Calendar size={20} color={COLORS.beigeWarm} />
              <Text style={styles.detailLabel}>Sail Date</Text>
              <Text style={styles.detailValue}>{formatDate(cruise.sailDate, 'medium')}</Text>
            </View>
            
            <View style={styles.detailCard}>
              <Clock size={20} color={COLORS.beigeWarm} />
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{formatNights(cruise.nights)}</Text>
            </View>
            
            <View style={styles.detailCard}>
              <MapPin size={20} color={COLORS.beigeWarm} />
              <Text style={styles.detailLabel}>Departs From</Text>
              <Text style={styles.detailValue}>{cruise.departurePort}</Text>
            </View>
            
            <View style={styles.detailCard}>
              <Users size={20} color={COLORS.beigeWarm} />
              <Text style={styles.detailLabel}>Guests</Text>
              <Text style={styles.detailValue}>{cruise.guestsInfo || `${cruise.guests || 2} Guests`}</Text>
            </View>

            {cruise.cabinType && (
              <View style={styles.detailCard}>
                <Anchor size={20} color={COLORS.beigeWarm} />
                <Text style={styles.detailLabel}>Cabin Type</Text>
                <Text style={styles.detailValue}>{cruise.cabinType}</Text>
              </View>
            )}
            
            {displayPrice > 0 && cruise.nights > 0 && (
              <View style={styles.detailCard}>
                <DollarSign size={20} color={COLORS.beigeWarm} />
                <Text style={styles.detailLabel}>Per Night</Text>
                <Text style={styles.detailValue}>{formatCurrency(Math.round(displayPrice / cruise.nights))}</Text>
              </View>
            )}

            {isBooked && (
              <View style={styles.detailCard}>
                <TrendingUp size={20} color={COLORS.beigeWarm} />
                <Text style={styles.detailLabel}>Casino Stats</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    console.log('[CruiseDetails] Opening edit modal for cruise:', cruise);
                    const bookedCruise = cruise as any;
                    setEditWinnings(String(bookedCruise.winnings || 0));
                    setEditPoints(String(bookedCruise.earnedPoints || bookedCruise.casinoPoints || 0));
                    setEditModalVisible(true);
                  }}
                  testID="edit-casino-stats-button"
                >
                  <Edit3 size={16} color={COLORS.beigeWarm} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {hasPerks && (
            <View style={styles.offersSection}>
              <View style={styles.sectionHeader}>
                <Gift size={20} color={COLORS.beigeWarm} />
                <Text style={styles.sectionTitle}>Special Offers & Perks</Text>
              </View>
              
              <View style={styles.offersList}>
                {cruise.freeOBC && cruise.freeOBC > 0 && (
                  <View style={styles.offerItem}>
                    <Star size={16} color={COLORS.success} />
                    <Text style={styles.offerText}>${cruise.freeOBC} Onboard Credit</Text>
                  </View>
                )}
                {cruise.freeGratuities && (
                  <View style={styles.offerItem}>
                    <Star size={16} color={COLORS.success} />
                    <Text style={styles.offerText}>Free Gratuities Included</Text>
                  </View>
                )}
                {cruise.freeDrinkPackage && (
                  <View style={styles.offerItem}>
                    <Star size={16} color={COLORS.success} />
                    <Text style={styles.offerText}>Free Drink Package</Text>
                  </View>
                )}
                {cruise.freeWifi && (
                  <View style={styles.offerItem}>
                    <Star size={16} color={COLORS.success} />
                    <Text style={styles.offerText}>Free WiFi</Text>
                  </View>
                )}
                {cruise.freeSpecialtyDining && (
                  <View style={styles.offerItem}>
                    <Star size={16} color={COLORS.success} />
                    <Text style={styles.offerText}>Free Specialty Dining</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.itinerarySection}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={COLORS.beigeWarm} />
              <Text style={styles.sectionTitle}>Itinerary</Text>
            </View>
            
            <View style={styles.itineraryList}>
              {itineraryPorts.map((port, index) => (
                <View key={index} style={styles.itineraryItem}>
                  <View style={styles.itineraryDot} />
                  {index < itineraryPorts.length - 1 && <View style={styles.itineraryLine} />}
                  <View style={styles.itineraryContent}>
                    <Text style={styles.itineraryDay}>Day {index + 1}</Text>
                    <Text style={styles.itineraryPort}>{port}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {!isBooked && (
            <TouchableOpacity style={styles.bookButton} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.beigeWarm, COLORS.goldDark]}
                style={styles.bookButtonGradient}
              >
                <Text style={styles.bookButtonText}>Book This Cruise</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Casino Statistics</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Won/Loss ($)</Text>
                <TextInput
                  style={styles.input}
                  value={editWinnings}
                  onChangeText={setEditWinnings}
                  keyboardType="numeric"
                  placeholder="Enter winnings or losses"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Points Earned</Text>
                <TextInput
                  style={styles.input}
                  value={editPoints}
                  onChangeText={setEditPoints}
                  keyboardType="numeric"
                  placeholder="Enter points earned"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  console.log('[CruiseDetails] Saving casino stats');
                  const winningsValue = parseFloat(editWinnings) || 0;
                  const pointsValue = parseFloat(editPoints) || 0;
                  
                  const updatedCruise = {
                    ...cruise,
                    winnings: winningsValue,
                    earnedPoints: pointsValue,
                    casinoPoints: pointsValue,
                  };
                  
                  console.log('[CruiseDetails] Updated cruise:', updatedCruise);
                  updateCruise(updatedCruise);
                  setEditModalVisible(false);
                }}
              >
                <Save size={18} color={COLORS.navyDeep} />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navyDeep,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  notFoundTitle: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  notFoundText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.beigeWarm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.navyDeep,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroPlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookedBadge: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  bookedBadgeText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.white,
    letterSpacing: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  headerSection: {
    marginBottom: SPACING.lg,
  },
  shipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  shipName: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
  },
  destination: {
    fontSize: TYPOGRAPHY.fontSizeTitle,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.beigeWarm,
    marginBottom: SPACING.sm,
  },
  offerCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 165, 116, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  offerCodeText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.beigeWarm,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  countdown: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.beigeWarm,
  },
  priceSection: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.md,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  priceItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
  },
  taxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  taxesLabel: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  taxesValue: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textPrimary,
  },
  savingsBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },
  savingsText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.success,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  detailCard: {
    width: '47%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.sm,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  offersSection: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textPrimary,
  },
  offersList: {
    gap: SPACING.sm,
  },
  offerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  offerText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textPrimary,
  },
  itinerarySection: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  itineraryList: {
    gap: 0,
  },
  itineraryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 50,
  },
  itineraryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.beigeWarm,
    marginTop: 4,
    zIndex: 1,
  },
  itineraryLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    bottom: -16,
    width: 2,
    backgroundColor: COLORS.cardBorder,
  },
  itineraryContent: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  itineraryDay: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  itineraryPort: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textPrimary,
  },
  bookButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOW.lg,
  },
  bookButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.navyDeep,
  },
  editButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    padding: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOW.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalBody: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  inputGroup: {
    gap: SPACING.sm,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textPrimary,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textPrimary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.beigeWarm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.navyDeep,
  },
});
