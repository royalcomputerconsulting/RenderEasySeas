import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Award, 
  Ticket, 
  ChevronRight, 
  Sparkles,
  CircleDollarSign,
  Gift,
} from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';

interface CertificateInfo {
  type: 'fpp' | 'nextCruise' | 'obc';
  label: string;
  value: number;
  description?: string;
}

interface CasinoCertificatesCardProps {
  certificates: CertificateInfo[];
  totalCertificates: number;
  availableCruises: number;
  onManagePress?: () => void;
  onViewOffersPress?: () => void;
}

export function CasinoCertificatesCard({
  certificates,
  totalCertificates,
  availableCruises,
  onManagePress,
  onViewOffersPress,
}: CasinoCertificatesCardProps) {
  const getCertIcon = (type: string) => {
    switch (type) {
      case 'fpp':
        return CircleDollarSign;
      case 'nextCruise':
        return Ticket;
      case 'obc':
        return Gift;
      default:
        return Award;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 31, 63, 0.95)', 'rgba(0, 61, 92, 0.9)']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Sparkles size={20} color={COLORS.goldAccent} />
          </View>
          <View>
            <Text style={styles.title}>Casino & Certificates</Text>
            <Text style={styles.subtitle}>
              {totalCertificates} Total Certificates
            </Text>
          </View>
        </View>
        
        {onManagePress && (
          <TouchableOpacity 
            style={styles.manageButton}
            onPress={onManagePress}
            activeOpacity={0.7}
          >
            <Text style={styles.manageText}>Manage</Text>
            <ChevronRight size={16} color={COLORS.beigeWarm} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.certificatesGrid}>
        {certificates.map((cert, index) => {
          const Icon = getCertIcon(cert.type);
          return (
            <View key={`${cert.type}-${index}`} style={styles.certificateItem}>
              <View style={styles.certIconContainer}>
                <Icon size={18} color={COLORS.goldAccent} />
              </View>
              <Text style={styles.certValue}>{cert.value}</Text>
              <Text style={styles.certLabel}>{cert.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.divider} />

      <View style={styles.availableSection}>
        <View style={styles.availableInfo}>
          <Text style={styles.availableLabel}>Available Cruises</Text>
          <Text style={styles.availableValue}>{availableCruises}</Text>
        </View>
        
        {onViewOffersPress && (
          <TouchableOpacity 
            style={styles.viewOffersButton}
            onPress={onViewOffersPress}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[COLORS.beigeWarm, COLORS.goldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.viewOffersGradient}
            >
              <Text style={styles.viewOffersText}>View Offers</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
    ...SHADOW.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(212, 165, 116, 0.15)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.3)',
    gap: 4,
  },
  manageText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.beigeWarm,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  certificatesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  certificateItem: {
    alignItems: 'center',
    flex: 1,
  },
  certIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  certValue: {
    fontSize: TYPOGRAPHY.fontSizeXXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
  },
  certLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
    marginBottom: SPACING.lg,
  },
  availableSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availableInfo: {
    flex: 1,
  },
  availableLabel: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
  availableValue: {
    fontSize: TYPOGRAPHY.fontSizeTitle,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.beigeWarm,
  },
  viewOffersButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  viewOffersGradient: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  viewOffersText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.navyDeep,
  },
});
