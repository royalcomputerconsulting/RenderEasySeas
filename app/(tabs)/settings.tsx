import React, { useCallback, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Alert, 
  Linking, 
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Moon, 
  DollarSign, 
  Download, 
  Upload,
  Trash2, 
  Info, 
  ChevronRight,
  Ship,
  Crown,
  ExternalLink,
  HelpCircle,
  Shield,
  Star,
  FileSpreadsheet,
  Calendar,
  CheckCircle,
  Save,
  RefreshCw,
  Database,
  Edit3,
  X,
  Anchor,
  Award,
  ChevronDown
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@/constants/theme';
import { useAppState } from '@/state/AppStateProvider';
import { useCruiseStore } from '@/state/CruiseStore';
import { useUser } from '@/state/UserProvider';
import { 
  pickAndReadFile, 
  parseOffersCSV, 
  parseICSFile, 
  parseBookedCSV,
  generateOffersCSV, 
  generateCalendarICS,
  generateBookedCSV,
  exportFile 
} from '@/lib/importExport';
import { CROWN_ANCHOR_LEVELS, LEVEL_ORDER } from '@/constants/crownAnchor';
import { CLUB_ROYALE_TIERS, getTierByPoints } from '@/constants/clubRoyaleTiers';
import { useLoyalty } from '@/state/LoyaltyProvider';

interface UserFormData {
  name: string;
  crownAnchorNumber: string;
  clubRoyalePoints: string;
  loyaltyNights: string;
  crownAnchorLevel: string;
}

export default function SettingsScreen() {
  const { settings, updateSettings, clearLocalData, setLocalData, localData } = useAppState();
  const { clearAllData, cruises, bookedCruises, setCruises, setOffers, casinoOffers, setBookedCruises } = useCruiseStore();
  const { currentUser, updateUser, ensureOwner } = useUser();
  const { 
    clubRoyalePoints: loyaltyClubRoyalePoints, 
    crownAnchorPoints: loyaltyCrownAnchorPoints,
    crownAnchorLevel: loyaltyCrownAnchorLevel,
    setManualClubRoyalePoints,
    setManualCrownAnchorPoints,
  } = useLoyalty();
  
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<{ type: string; count: number } | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<UserFormData>({
    name: currentUser?.name || 'Cruise Enthusiast',
    crownAnchorNumber: '',
    clubRoyalePoints: loyaltyClubRoyalePoints.toString(),
    loyaltyNights: loyaltyCrownAnchorPoints.toString(),
    crownAnchorLevel: loyaltyCrownAnchorLevel,
  });

  const computedTier = useMemo(() => {
    const points = parseInt(formData.clubRoyalePoints) || 0;
    return getTierByPoints(points);
  }, [formData.clubRoyalePoints]);

  const dataStats = useMemo(() => ({
    cruises: cruises.length || localData.cruises?.length || 0,
    booked: bookedCruises.length || localData.booked?.length || 0,
    offers: casinoOffers.length || localData.offers?.length || 0,
    events: localData.calendar?.length || 0,
  }), [cruises, bookedCruises, casinoOffers, localData]);

  const handleImportOffersCSV = useCallback(async () => {
    try {
      setIsImporting(true);
      setLastImportResult(null);
      console.log('[Settings] Starting offers CSV import');
      
      const result = await pickAndReadFile('csv');
      if (!result) {
        console.log('[Settings] Import cancelled');
        setIsImporting(false);
        return;
      }

      console.log('[Settings] File selected:', result.fileName);
      const { cruises: parsedCruises, offers: parsedOffers } = parseOffersCSV(result.content);
      
      if (parsedCruises.length === 0) {
        Alert.alert('Import Failed', 'No valid cruise data found in the CSV file. Please check the file format.');
        setIsImporting(false);
        return;
      }

      setCruises(parsedCruises);
      setOffers(parsedOffers);
      setLocalData({
        cruises: parsedCruises,
        offers: parsedOffers,
      });

      setLastImportResult({ type: 'offers', count: parsedCruises.length });
      Alert.alert(
        'Import Successful', 
        `Imported ${parsedCruises.length} cruises and ${parsedOffers.length} offers from ${result.fileName}`
      );
      console.log('[Settings] Import complete:', parsedCruises.length, 'cruises,', parsedOffers.length, 'offers');
    } catch (error) {
      console.error('[Settings] Import error:', error);
      Alert.alert('Import Error', 'Failed to import the file. Please check the file format and try again.');
    } finally {
      setIsImporting(false);
    }
  }, [setCruises, setOffers, setLocalData]);

  const handleImportCalendarICS = useCallback(async () => {
    try {
      setIsImporting(true);
      setLastImportResult(null);
      console.log('[Settings] Starting calendar ICS import');
      
      const result = await pickAndReadFile('ics');
      if (!result) {
        console.log('[Settings] Import cancelled');
        setIsImporting(false);
        return;
      }

      console.log('[Settings] File selected:', result.fileName);
      const events = parseICSFile(result.content);
      
      if (events.length === 0) {
        Alert.alert('Import Failed', 'No valid events found in the ICS file. Please check the file format.');
        setIsImporting(false);
        return;
      }

      setLocalData({
        calendar: [...(localData.calendar || []), ...events],
      });

      setLastImportResult({ type: 'calendar', count: events.length });
      Alert.alert(
        'Import Successful', 
        `Imported ${events.length} calendar events from ${result.fileName}`
      );
      console.log('[Settings] Import complete:', events.length, 'events');
    } catch (error) {
      console.error('[Settings] Import error:', error);
      Alert.alert('Import Error', 'Failed to import the file. Please check the file format and try again.');
    } finally {
      setIsImporting(false);
    }
  }, [setLocalData, localData.calendar]);

  const handleImportBookedCSV = useCallback(async () => {
    try {
      setIsImporting(true);
      setLastImportResult(null);
      console.log('[Settings] Starting booked CSV import');
      
      const result = await pickAndReadFile('csv');
      if (!result) {
        console.log('[Settings] Import cancelled');
        setIsImporting(false);
        return;
      }

      console.log('[Settings] File selected:', result.fileName);
      const parsedBooked = parseBookedCSV(result.content);
      
      if (parsedBooked.length === 0) {
        Alert.alert('Import Failed', 'No valid booked cruise data found in the CSV file. Please check the file format.');
        setIsImporting(false);
        return;
      }

      setBookedCruises(parsedBooked);
      setLocalData({
        booked: parsedBooked,
      });

      setLastImportResult({ type: 'booked', count: parsedBooked.length });
      Alert.alert(
        'Import Successful', 
        `Imported ${parsedBooked.length} booked cruises from ${result.fileName}`
      );
      console.log('[Settings] Booked import complete:', parsedBooked.length, 'cruises');
    } catch (error) {
      console.error('[Settings] Booked import error:', error);
      Alert.alert('Import Error', 'Failed to import the file. Please check the file format and try again.');
    } finally {
      setIsImporting(false);
    }
  }, [setBookedCruises, setLocalData]);

  const handleExportBookedCSV = useCallback(async () => {
    try {
      setIsExporting(true);
      console.log('[Settings] Starting booked CSV export');
      
      const allBooked = localData.booked?.length > 0 ? localData.booked : bookedCruises;
      
      if (allBooked.length === 0) {
        Alert.alert('No Data', 'No booked cruise data to export. Import data first.');
        setIsExporting(false);
        return;
      }

      const csvContent = generateBookedCSV(allBooked);
      const fileName = `easyseas_booked_${new Date().toISOString().split('T')[0]}.csv`;
      
      const success = await exportFile(csvContent, fileName);
      if (success) {
        Alert.alert('Export Successful', `Exported ${allBooked.length} booked cruises to ${fileName}`);
      } else {
        Alert.alert('Export Info', 'File saved but sharing may not be available on this device.');
      }
      console.log('[Settings] Booked export complete');
    } catch (error) {
      console.error('[Settings] Booked export error:', error);
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [localData.booked, bookedCruises]);

  const handleExportOffersCSV = useCallback(async () => {
    try {
      setIsExporting(true);
      console.log('[Settings] Starting offers CSV export');
      
      const allCruises = localData.cruises.length > 0 ? localData.cruises : cruises;
      const allOffers = localData.offers || casinoOffers;
      
      if (allCruises.length === 0) {
        Alert.alert('No Data', 'No cruise data to export. Import data first.');
        setIsExporting(false);
        return;
      }

      const csvContent = generateOffersCSV(allCruises, allOffers);
      const fileName = `easyseas_offers_${new Date().toISOString().split('T')[0]}.csv`;
      
      const success = await exportFile(csvContent, fileName);
      if (success) {
        Alert.alert('Export Successful', `Exported ${allCruises.length} cruises to ${fileName}`);
      } else {
        Alert.alert('Export Info', 'File saved but sharing may not be available on this device.');
      }
      console.log('[Settings] Export complete');
    } catch (error) {
      console.error('[Settings] Export error:', error);
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [localData.cruises, localData.offers, cruises, casinoOffers]);

  const handleExportCalendarICS = useCallback(async () => {
    try {
      setIsExporting(true);
      console.log('[Settings] Starting calendar ICS export');
      
      const allEvents = localData.calendar || [];
      
      if (allEvents.length === 0) {
        Alert.alert('No Data', 'No calendar events to export. Import events first.');
        setIsExporting(false);
        return;
      }

      const icsContent = generateCalendarICS(allEvents);
      const fileName = `easyseas_calendar_${new Date().toISOString().split('T')[0]}.ics`;
      
      const success = await exportFile(icsContent, fileName);
      if (success) {
        Alert.alert('Export Successful', `Exported ${allEvents.length} events to ${fileName}`);
      } else {
        Alert.alert('Export Info', 'File saved but sharing may not be available on this device.');
      }
      console.log('[Settings] Export complete');
    } catch (error) {
      console.error('[Settings] Export error:', error);
      Alert.alert('Export Error', 'Failed to export calendar. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [localData.calendar]);

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all your cruise data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            clearLocalData();
            setLastImportResult(null);
            Alert.alert('Data Cleared', 'All cruise data has been deleted.');
          }
        },
      ]
    );
  }, [clearAllData, clearLocalData]);

  const handleSaveProfile = useCallback(async () => {
    try {
      setIsSaving(true);
      console.log('[Settings] Saving profile:', formData);
      
      if (currentUser) {
        await updateUser(currentUser.id, { name: formData.name });
      } else {
        await ensureOwner();
      }
      
      const clubRoyalePoints = parseInt(formData.clubRoyalePoints) || 0;
      const crownAnchorPoints = parseInt(formData.loyaltyNights) || 0;
      
      await setManualClubRoyalePoints(clubRoyalePoints);
      await setManualCrownAnchorPoints(crownAnchorPoints);
      
      setIsEditingProfile(false);
      Alert.alert('Profile Saved', 'Your profile has been updated successfully.');
    } catch (error) {
      console.error('[Settings] Save error:', error);
      Alert.alert('Save Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [formData, currentUser, updateUser, ensureOwner, setManualClubRoyalePoints, setManualCrownAnchorPoints]);

  const handleOpenLink = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  }, []);

  const renderSettingRow = (
    icon: React.ReactNode,
    label: string,
    value?: string | React.ReactNode,
    onPress?: () => void,
    isDanger?: boolean
  ) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        {icon}
        <Text style={[styles.settingLabel, isDanger && styles.dangerLabel]}>{label}</Text>
      </View>
      <View style={styles.settingRight}>
        {typeof value === 'string' ? (
          <Text style={styles.settingValue}>{value}</Text>
        ) : (
          value
        )}
        {onPress && <ChevronRight size={18} color={isDanger ? COLORS.error : COLORS.textSecondary} />}
      </View>
    </TouchableOpacity>
  );

  const renderToggle = (value: boolean, onToggle: (val: boolean) => void) => (
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(212, 165, 116, 0.5)' }}
      thumbColor={value ? COLORS.beigeWarm : COLORS.white}
      ios_backgroundColor="rgba(255,255,255,0.2)"
    />
  );

  const renderActionButton = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void,
    variant: 'primary' | 'secondary' | 'warning' = 'secondary'
  ) => {
    const bgColors = {
      primary: ['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.1)'],
      secondary: ['rgba(212, 165, 116, 0.2)', 'rgba(212, 165, 116, 0.1)'],
      warning: ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)'],
    };
    const borderColor = {
      primary: 'rgba(59, 130, 246, 0.3)',
      secondary: 'rgba(212, 165, 116, 0.3)',
      warning: 'rgba(239, 68, 68, 0.3)',
    };

    return (
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={bgColors[variant] as [string, string]}
          style={[styles.actionButtonGradient, { borderColor: borderColor[variant] }]}
        >
          {icon}
          <Text style={[
            styles.actionButtonLabel,
            variant === 'warning' && styles.warningLabel
          ]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderDataStatCard = (label: string, value: number, icon: React.ReactNode) => (
    <View style={styles.dataStatCard}>
      <View style={styles.dataStatIcon}>
        {icon}
      </View>
      <Text style={styles.dataStatValue}>{value}</Text>
      <Text style={styles.dataStatLabel}>{label}</Text>
    </View>
  );

  const levelInfo = CROWN_ANCHOR_LEVELS[formData.crownAnchorLevel];
  const tierInfo = CLUB_ROYALE_TIERS[computedTier];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[COLORS.navyDeep, COLORS.navyMedium, COLORS.navyLight]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <SettingsIcon size={28} color={COLORS.beigeWarm} />
              <Text style={styles.screenTitle}>Settings</Text>
            </View>
          </View>

          <View style={styles.profileCard}>
            <LinearGradient
              colors={['rgba(212, 165, 116, 0.15)', 'rgba(212, 165, 116, 0.05)']}
              style={styles.profileGradient}
            >
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <User size={28} color={COLORS.beigeWarm} />
                  </View>
                  <View style={[styles.tierBadge, { backgroundColor: tierInfo?.color || COLORS.navyDeep }]}>
                    <Crown size={10} color={COLORS.white} />
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => setIsEditingProfile(!isEditingProfile)}
                >
                  {isEditingProfile ? (
                    <X size={18} color={COLORS.beigeWarm} />
                  ) : (
                    <Edit3 size={18} color={COLORS.beigeWarm} />
                  )}
                </TouchableOpacity>
              </View>

              {isEditingProfile ? (
                <View style={styles.formContainer}>
                  <View style={styles.formRow}>
                    <Text style={styles.formLabel}>Name</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.name}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                      placeholder="Your name"
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                  
                  <View style={styles.formRow}>
                    <Text style={styles.formLabel}>Crown & Anchor #</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.crownAnchorNumber}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, crownAnchorNumber: text }))}
                      placeholder="e.g., 123456789"
                      placeholderTextColor={COLORS.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formRow}>
                    <Text style={styles.formLabel}>Crown & Anchor Level</Text>
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => setShowLevelPicker(true)}
                    >
                      <View style={[styles.levelIndicator, { backgroundColor: levelInfo?.color || COLORS.goldAccent }]} />
                      <Text style={styles.dropdownText}>{formData.crownAnchorLevel}</Text>
                      <ChevronDown size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.formRow}>
                    <Text style={styles.formLabel}>Club Royale Points</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.clubRoyalePoints}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, clubRoyalePoints: text }))}
                      placeholder="e.g., 3130"
                      placeholderTextColor={COLORS.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formRow}>
                    <Text style={styles.formLabel}>Loyalty Nights</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.loyaltyNights}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, loyaltyNights: text }))}
                      placeholder="e.g., 45"
                      placeholderTextColor={COLORS.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>

                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Save size={16} color={COLORS.white} />
                        <Text style={styles.saveButtonText}>Save Profile</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.profileName}>{formData.name}</Text>
                  
                  <View style={styles.badgeRow}>
                    <View style={[styles.statusBadge, { backgroundColor: tierInfo?.bgColor }]}>
                      <Text style={[styles.badgeText, { color: tierInfo?.color }]}>{computedTier.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: levelInfo?.bgColor }]}>
                      <Text style={[styles.badgeText, { color: levelInfo?.color }]}>{formData.crownAnchorLevel.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.profileStats}>
                    <View style={styles.profileStatItem}>
                      <Crown size={16} color={COLORS.beigeWarm} />
                      <Text style={styles.profileStatValue}>{parseInt(formData.clubRoyalePoints).toLocaleString()}</Text>
                      <Text style={styles.profileStatLabel}>CR Points</Text>
                    </View>
                    <View style={styles.profileStatDivider} />
                    <View style={styles.profileStatItem}>
                      <Anchor size={16} color={COLORS.beigeWarm} />
                      <Text style={styles.profileStatValue}>{formData.loyaltyNights}</Text>
                      <Text style={styles.profileStatLabel}>Nights</Text>
                    </View>
                    <View style={styles.profileStatDivider} />
                    <View style={styles.profileStatItem}>
                      <Ship size={16} color={COLORS.beigeWarm} />
                      <Text style={styles.profileStatValue}>{dataStats.booked}</Text>
                      <Text style={styles.profileStatLabel}>Booked</Text>
                    </View>
                  </View>
                </>
              )}
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Overview</Text>
            <View style={styles.dataStatsGrid}>
              {renderDataStatCard('Cruises', dataStats.cruises, <Ship size={18} color={COLORS.beigeWarm} />)}
              {renderDataStatCard('Booked', dataStats.booked, <CheckCircle size={18} color={COLORS.success} />)}
              {renderDataStatCard('Offers', dataStats.offers, <Award size={18} color={COLORS.goldAccent} />)}
              {renderDataStatCard('Events', dataStats.events, <Calendar size={18} color={COLORS.tealAccent} />)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtonsGrid}>
              {renderActionButton(
                <Save size={18} color={COLORS.beigeWarm} />,
                'Save',
                handleSaveProfile,
                'secondary'
              )}
              {renderActionButton(
                <Download size={18} color={COLORS.info} />,
                'Import',
                handleImportOffersCSV,
                'primary'
              )}
              {renderActionButton(
                <Upload size={18} color={COLORS.beigeWarm} />,
                'Export',
                handleExportOffersCSV,
                'secondary'
              )}
              {renderActionButton(
                <Database size={18} color={COLORS.beigeWarm} />,
                'Status',
                () => Alert.alert('Data Status', `Cruises: ${dataStats.cruises}\nBooked: ${dataStats.booked}\nOffers: ${dataStats.offers}\nEvents: ${dataStats.events}`),
                'secondary'
              )}
              {renderActionButton(
                <RefreshCw size={18} color={COLORS.beigeWarm} />,
                'Refresh',
                () => Alert.alert('Refresh', 'Data refreshed from local storage'),
                'secondary'
              )}
              {renderActionButton(
                <Trash2 size={18} color={COLORS.error} />,
                'Clear',
                handleClearData,
                'warning'
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Display Preferences</Text>
            <View style={styles.sectionCard}>
              {renderSettingRow(
                <DollarSign size={20} color={COLORS.beigeWarm} />,
                'Show Taxes in List',
                renderToggle(settings.showTaxesInList, (val) => updateSettings({ showTaxesInList: val }))
              )}
              {renderSettingRow(
                <DollarSign size={20} color={COLORS.beigeWarm} />,
                'Price Per Night',
                renderToggle(settings.showPricePerNight, (val) => updateSettings({ showPricePerNight: val }))
              )}
              {renderSettingRow(
                <Moon size={20} color={COLORS.beigeWarm} />,
                'Theme',
                settings.theme === 'dark' ? 'Dark' : settings.theme === 'light' ? 'Light' : 'System'
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.sectionCard}>
              {renderSettingRow(
                <Bell size={20} color={COLORS.beigeWarm} />,
                'Price Drop Alerts',
                renderToggle(settings.priceDropAlerts, (val) => updateSettings({ priceDropAlerts: val }))
              )}
              {renderSettingRow(
                <Bell size={20} color={COLORS.beigeWarm} />,
                'Daily Summary',
                renderToggle(settings.dailySummaryNotifications || false, (val) => updateSettings({ dailySummaryNotifications: val }))
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Import Data</Text>
            <View style={styles.sectionCard}>
              {renderSettingRow(
                <FileSpreadsheet size={20} color={COLORS.beigeWarm} />,
                'Import Offers CSV',
                isImporting ? (
                  <ActivityIndicator size="small" color={COLORS.beigeWarm} />
                ) : lastImportResult?.type === 'offers' ? (
                  <View style={styles.successBadge}>
                    <CheckCircle size={14} color={COLORS.success} />
                    <Text style={styles.successText}>{lastImportResult.count}</Text>
                  </View>
                ) : undefined,
                handleImportOffersCSV
              )}
              {renderSettingRow(
                <Calendar size={20} color={COLORS.beigeWarm} />,
                'Import Calendar (.ics)',
                isImporting ? (
                  <ActivityIndicator size="small" color={COLORS.beigeWarm} />
                ) : lastImportResult?.type === 'calendar' ? (
                  <View style={styles.successBadge}>
                    <CheckCircle size={14} color={COLORS.success} />
                    <Text style={styles.successText}>{lastImportResult.count}</Text>
                  </View>
                ) : undefined,
                handleImportCalendarICS
              )}
              {renderSettingRow(
                <Ship size={20} color={COLORS.success} />,
                'Import Booked Cruises CSV',
                isImporting ? (
                  <ActivityIndicator size="small" color={COLORS.beigeWarm} />
                ) : lastImportResult?.type === 'booked' ? (
                  <View style={styles.successBadge}>
                    <CheckCircle size={14} color={COLORS.success} />
                    <Text style={styles.successText}>{lastImportResult.count}</Text>
                  </View>
                ) : undefined,
                handleImportBookedCSV
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Export Data</Text>
            <View style={styles.sectionCard}>
              {renderSettingRow(
                <Upload size={20} color={COLORS.beigeWarm} />,
                'Export Offers CSV',
                isExporting ? (
                  <ActivityIndicator size="small" color={COLORS.beigeWarm} />
                ) : (
                  <Text style={styles.countBadge}>
                    {dataStats.cruises} cruises
                  </Text>
                ),
                handleExportOffersCSV
              )}
              {renderSettingRow(
                <Download size={20} color={COLORS.beigeWarm} />,
                'Export Calendar (.ics)',
                isExporting ? (
                  <ActivityIndicator size="small" color={COLORS.beigeWarm} />
                ) : (
                  <Text style={styles.countBadge}>
                    {dataStats.events} events
                  </Text>
                ),
                handleExportCalendarICS
              )}
              {renderSettingRow(
                <Ship size={20} color={COLORS.success} />,
                'Export Booked Cruises CSV',
                isExporting ? (
                  <ActivityIndicator size="small" color={COLORS.beigeWarm} />
                ) : (
                  <Text style={styles.countBadge}>
                    {dataStats.booked} booked
                  </Text>
                ),
                handleExportBookedCSV
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sync</Text>
            <View style={styles.sectionCard}>
              {renderSettingRow(
                <Ship size={20} color={COLORS.beigeWarm} />,
                'Sync with Club Royale',
                undefined,
                () => Alert.alert('Sync', 'Club Royale sync coming soon')
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.sectionCard}>
              {renderSettingRow(
                <HelpCircle size={20} color={COLORS.beigeWarm} />,
                'Help Center',
                <ExternalLink size={16} color={COLORS.textSecondary} />,
                () => handleOpenLink('https://example.com/help')
              )}
              {renderSettingRow(
                <Star size={20} color={COLORS.beigeWarm} />,
                'Rate App',
                undefined,
                () => Alert.alert('Rate', 'Thank you for your support!')
              )}
              {renderSettingRow(
                <Shield size={20} color={COLORS.beigeWarm} />,
                'Privacy Policy',
                <ExternalLink size={16} color={COLORS.textSecondary} />,
                () => handleOpenLink('https://example.com/privacy')
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
            <View style={[styles.sectionCard, styles.dangerCard]}>
              {renderSettingRow(
                <Trash2 size={20} color={COLORS.error} />,
                'Reset Account',
                undefined,
                handleClearData,
                true
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.sectionCard}>
              {renderSettingRow(
                <Info size={20} color={COLORS.beigeWarm} />,
                'App Version',
                '1.0.0'
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerLogoRow}>
              <Ship size={20} color={COLORS.beigeWarm} />
              <Text style={styles.footerAppName}>EasySeas</Text>
            </View>
            <Text style={styles.footerTagline}>Cruise Point Tracker</Text>
            <Text style={styles.footerCopyright}>Made with love for cruise enthusiasts</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showLevelPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLevelPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLevelPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Crown & Anchor Level</Text>
            {LEVEL_ORDER.map((level) => {
              const info = CROWN_ANCHOR_LEVELS[level];
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelOption,
                    formData.crownAnchorLevel === level && styles.levelOptionSelected
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, crownAnchorLevel: level }));
                    setShowLevelPicker(false);
                  }}
                >
                  <View style={[styles.levelDot, { backgroundColor: info.color }]} />
                  <Text style={styles.levelOptionText}>{level}</Text>
                  <Text style={styles.levelNights}>{info.cruiseNights}+ nights</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
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
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  screenTitle: {
    fontSize: TYPOGRAPHY.fontSizeHeader,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  profileCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.3)',
    ...SHADOW.lg,
  },
  profileGradient: {
    padding: SPACING.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.beigeWarm,
  },
  tierBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.navyDeep,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 165, 116, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.3)',
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    letterSpacing: 0.5,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  profileStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  profileStatValue: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
  },
  profileStatLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
  },
  profileStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  formContainer: {
    marginTop: SPACING.sm,
  },
  formRow: {
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  formInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.2)',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.2)',
    gap: SPACING.sm,
  },
  levelIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dropdownText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textPrimary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.beigeWarm,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.navyDeep,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dangerTitle: {
    color: COLORS.error,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  dangerCard: {
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  dangerLabel: {
    color: COLORS.error,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  settingValue: {
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textSecondary,
  },
  dataStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  dataStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  dataStatIcon: {
    marginBottom: SPACING.xs,
  },
  dataStatValue: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
  },
  dataStatLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionButton: {
    width: '31%',
  },
  actionButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonLabel: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textPrimary,
  },
  warningLabel: {
    color: COLORS.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginTop: SPACING.lg,
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  footerAppName: {
    fontSize: TYPOGRAPHY.fontSizeXL,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.beigeWarm,
    letterSpacing: 0.5,
  },
  footerTagline: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  footerCopyright: {
    fontSize: TYPOGRAPHY.fontSizeXS,
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  successText: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  countBadge: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.navyMedium,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSizeLG,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  levelOptionSelected: {
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.beigeWarm,
  },
  levelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  levelOptionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizeMD,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  levelNights: {
    fontSize: TYPOGRAPHY.fontSizeSM,
    color: COLORS.textSecondary,
  },
});
