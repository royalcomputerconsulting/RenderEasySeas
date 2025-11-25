import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import type { Cruise, BookedCruise, CasinoOffer, CalendarEvent, ClubRoyaleProfile } from "@/types/models";
import { SAMPLE_CLUB_ROYALE_PROFILE } from "@/types/models";

interface AppSettings {
  showTaxesInList: boolean;
  showPricePerNight: boolean;
  priceDropAlerts: boolean;
  dailySummaryNotifications?: boolean;
  theme?: 'system' | 'light' | 'dark';
  currency: string;
  pointsPerDay?: number;
}

interface LocalData {
  cruises: Cruise[];
  booked: BookedCruise[];
  offers: CasinoOffer[];
  calendar: CalendarEvent[];
  tripit: CalendarEvent[];
  lastImport: string | null;
  clubRoyaleProfile?: ClubRoyaleProfile;
}

interface AppState {
  settings: AppSettings;
  lastImportDate: string | null;
  localData: LocalData;
  hasLocalData: boolean;
  isLoading: boolean;
  userPoints: number;
  clubRoyaleProfile: ClubRoyaleProfile;
  
  updateSettings: (updates: Partial<AppSettings>) => void;
  setLocalData: (data: Partial<LocalData>) => void;
  clearLocalData: () => void;
  setUserPoints: (points: number) => void;
  setClubRoyaleProfile: (profile: ClubRoyaleProfile) => void;
  refreshData: () => Promise<void>;
}

const STORAGE_KEYS = {
  SETTINGS: 'easyseas_settings',
  LOCAL_DATA: 'easyseas_local_data',
  USER_POINTS: 'easyseas_user_points',
  CLUB_PROFILE: 'easyseas_club_profile',
};

const DEFAULT_SETTINGS: AppSettings = {
  showTaxesInList: true,
  showPricePerNight: true,
  priceDropAlerts: true,
  dailySummaryNotifications: false,
  theme: 'system',
  currency: 'USD',
  pointsPerDay: 0,
};

const DEFAULT_LOCAL_DATA: LocalData = {
  cruises: [],
  booked: [],
  offers: [],
  calendar: [],
  tripit: [],
  lastImport: null,
};

export const [AppStateProvider, useAppState] = createContextHook((): AppState => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [localData, setLocalDataState] = useState<LocalData>(DEFAULT_LOCAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [userPoints, setUserPointsState] = useState(0);
  const [clubRoyaleProfile, setClubRoyaleProfileState] = useState<ClubRoyaleProfile>(SAMPLE_CLUB_ROYALE_PROFILE);

  const hasLocalData = localData.cruises.length > 0 || localData.booked.length > 0 || localData.offers.length > 0;
  const lastImportDate = localData.lastImport;

  const loadFromStorage = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[AppState] Loading from storage...');

      const [settingsData, localDataData, pointsData, profileData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.LOCAL_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.USER_POINTS),
        AsyncStorage.getItem(STORAGE_KEYS.CLUB_PROFILE),
      ]);

      if (settingsData) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) });
      }
      if (localDataData) {
        setLocalDataState({ ...DEFAULT_LOCAL_DATA, ...JSON.parse(localDataData) });
      }
      if (pointsData) {
        setUserPointsState(parseInt(pointsData, 10));
      }
      if (profileData) {
        setClubRoyaleProfileState(JSON.parse(profileData));
      }

      console.log('[AppState] Loaded from storage');
    } catch (error) {
      console.error('[AppState] Failed to load from storage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated)).catch(console.error);
      console.log('[AppState] Updated settings:', updates);
      return updated;
    });
  }, []);

  const setLocalData = useCallback((data: Partial<LocalData>) => {
    setLocalDataState(prev => {
      const updated = { ...prev, ...data, lastImport: new Date().toISOString() };
      AsyncStorage.setItem(STORAGE_KEYS.LOCAL_DATA, JSON.stringify(updated)).catch(console.error);
      console.log('[AppState] Updated local data');
      return updated;
    });
  }, []);

  const clearLocalData = useCallback(() => {
    setLocalDataState(DEFAULT_LOCAL_DATA);
    AsyncStorage.removeItem(STORAGE_KEYS.LOCAL_DATA).catch(console.error);
    console.log('[AppState] Cleared local data');
  }, []);

  const setUserPoints = useCallback((points: number) => {
    setUserPointsState(points);
    AsyncStorage.setItem(STORAGE_KEYS.USER_POINTS, points.toString()).catch(console.error);
    console.log('[AppState] Updated user points:', points);
  }, []);

  const setClubRoyaleProfile = useCallback((profile: ClubRoyaleProfile) => {
    setClubRoyaleProfileState(profile);
    AsyncStorage.setItem(STORAGE_KEYS.CLUB_PROFILE, JSON.stringify(profile)).catch(console.error);
    console.log('[AppState] Updated club profile');
  }, []);

  const refreshData = useCallback(async () => {
    await loadFromStorage();
  }, [loadFromStorage]);

  return {
    settings,
    lastImportDate,
    localData,
    hasLocalData,
    isLoading,
    userPoints,
    clubRoyaleProfile,
    updateSettings,
    setLocalData,
    clearLocalData,
    setUserPoints,
    setClubRoyaleProfile,
    refreshData,
  };
});
