import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import type { Cruise, BookedCruise, CasinoOffer, CalendarEvent } from "@/types/models";

interface CruiseStoreState {
  cruises: Cruise[];
  bookedCruises: BookedCruise[];
  casinoOffers: CasinoOffer[];
  calendarEvents: CalendarEvent[];
  isLoading: boolean;
  lastSyncDate: string | null;
  
  setCruises: (cruises: Cruise[]) => void;
  addCruise: (cruise: Cruise) => void;
  updateCruise: (id: string, updates: Partial<Cruise>) => void;
  removeCruise: (id: string) => void;
  
  setBookedCruises: (cruises: BookedCruise[]) => void;
  addBookedCruise: (cruise: BookedCruise) => void;
  updateBookedCruise: (id: string, updates: Partial<BookedCruise>) => void;
  removeBookedCruise: (id: string) => void;
  
  setCasinoOffers: (offers: CasinoOffer[]) => void;
  setOffers: (offers: CasinoOffer[]) => void;
  addCasinoOffer: (offer: CasinoOffer) => void;
  updateCasinoOffer: (id: string, updates: Partial<CasinoOffer>) => void;
  removeCasinoOffer: (id: string) => void;
  
  setCalendarEvents: (events: CalendarEvent[]) => void;
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  removeCalendarEvent: (id: string) => void;
  
  clearAllData: () => Promise<void>;
  syncFromStorage: () => Promise<void>;
}

const STORAGE_KEYS = {
  CRUISES: 'easyseas_cruises',
  BOOKED_CRUISES: 'easyseas_booked_cruises',
  CASINO_OFFERS: 'easyseas_casino_offers',
  CALENDAR_EVENTS: 'easyseas_calendar_events',
  LAST_SYNC: 'easyseas_last_sync',
};

export const [CruiseStoreProvider, useCruiseStore] = createContextHook((): CruiseStoreState => {
  const [cruises, setCruisesState] = useState<Cruise[]>([]);
  const [bookedCruises, setBookedCruisesState] = useState<BookedCruise[]>([]);
  const [casinoOffers, setCasinoOffersState] = useState<CasinoOffer[]>([]);
  const [calendarEvents, setCalendarEventsState] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

  const persistData = useCallback(async <T>(key: string, data: T) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(`[CruiseStore] Persisted ${key}:`, Array.isArray(data) ? (data as T[]).length : 'data');
    } catch (error) {
      console.error(`[CruiseStore] Failed to persist ${key}:`, error);
    }
  }, []);

  const syncFromStorage = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[CruiseStore] Syncing from storage...');

      const [cruisesData, bookedData, offersData, eventsData, lastSync] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CRUISES),
        AsyncStorage.getItem(STORAGE_KEYS.BOOKED_CRUISES),
        AsyncStorage.getItem(STORAGE_KEYS.CASINO_OFFERS),
        AsyncStorage.getItem(STORAGE_KEYS.CALENDAR_EVENTS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      if (cruisesData) setCruisesState(JSON.parse(cruisesData));
      if (bookedData) setBookedCruisesState(JSON.parse(bookedData));
      if (offersData) setCasinoOffersState(JSON.parse(offersData));
      if (eventsData) setCalendarEventsState(JSON.parse(eventsData));
      if (lastSync) setLastSyncDate(lastSync);

      console.log('[CruiseStore] Sync complete');
    } catch (error) {
      console.error('[CruiseStore] Sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  const setCruises = useCallback((newCruises: Cruise[]) => {
    setCruisesState(newCruises);
    persistData(STORAGE_KEYS.CRUISES, newCruises);
  }, [persistData]);

  const addCruise = useCallback((cruise: Cruise) => {
    setCruisesState(prev => {
      const updated = [...prev, cruise];
      persistData(STORAGE_KEYS.CRUISES, updated);
      return updated;
    });
  }, [persistData]);

  const updateCruise = useCallback((id: string, updates: Partial<Cruise>) => {
    setCruisesState(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      persistData(STORAGE_KEYS.CRUISES, updated);
      return updated;
    });
  }, [persistData]);

  const removeCruise = useCallback((id: string) => {
    setCruisesState(prev => {
      const updated = prev.filter(c => c.id !== id);
      persistData(STORAGE_KEYS.CRUISES, updated);
      return updated;
    });
  }, [persistData]);

  const setBookedCruises = useCallback((newCruises: BookedCruise[]) => {
    setBookedCruisesState(newCruises);
    persistData(STORAGE_KEYS.BOOKED_CRUISES, newCruises);
  }, [persistData]);

  const addBookedCruise = useCallback((cruise: BookedCruise) => {
    setBookedCruisesState(prev => {
      const updated = [...prev, cruise];
      persistData(STORAGE_KEYS.BOOKED_CRUISES, updated);
      return updated;
    });
  }, [persistData]);

  const updateBookedCruise = useCallback((id: string, updates: Partial<BookedCruise>) => {
    setBookedCruisesState(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      persistData(STORAGE_KEYS.BOOKED_CRUISES, updated);
      return updated;
    });
  }, [persistData]);

  const removeBookedCruise = useCallback((id: string) => {
    setBookedCruisesState(prev => {
      const updated = prev.filter(c => c.id !== id);
      persistData(STORAGE_KEYS.BOOKED_CRUISES, updated);
      return updated;
    });
  }, [persistData]);

  const setCasinoOffers = useCallback((newOffers: CasinoOffer[]) => {
    setCasinoOffersState(newOffers);
    persistData(STORAGE_KEYS.CASINO_OFFERS, newOffers);
  }, [persistData]);

  const addCasinoOffer = useCallback((offer: CasinoOffer) => {
    setCasinoOffersState(prev => {
      const updated = [...prev, offer];
      persistData(STORAGE_KEYS.CASINO_OFFERS, updated);
      return updated;
    });
  }, [persistData]);

  const updateCasinoOffer = useCallback((id: string, updates: Partial<CasinoOffer>) => {
    setCasinoOffersState(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, ...updates } : o);
      persistData(STORAGE_KEYS.CASINO_OFFERS, updated);
      return updated;
    });
  }, [persistData]);

  const removeCasinoOffer = useCallback((id: string) => {
    setCasinoOffersState(prev => {
      const updated = prev.filter(o => o.id !== id);
      persistData(STORAGE_KEYS.CASINO_OFFERS, updated);
      return updated;
    });
  }, [persistData]);

  const setCalendarEvents = useCallback((newEvents: CalendarEvent[]) => {
    setCalendarEventsState(newEvents);
    persistData(STORAGE_KEYS.CALENDAR_EVENTS, newEvents);
  }, [persistData]);

  const addCalendarEvent = useCallback((event: CalendarEvent) => {
    setCalendarEventsState(prev => {
      const updated = [...prev, event];
      persistData(STORAGE_KEYS.CALENDAR_EVENTS, updated);
      return updated;
    });
  }, [persistData]);

  const updateCalendarEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setCalendarEventsState(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...updates } : e);
      persistData(STORAGE_KEYS.CALENDAR_EVENTS, updated);
      return updated;
    });
  }, [persistData]);

  const removeCalendarEvent = useCallback((id: string) => {
    setCalendarEventsState(prev => {
      const updated = prev.filter(e => e.id !== id);
      persistData(STORAGE_KEYS.CALENDAR_EVENTS, updated);
      return updated;
    });
  }, [persistData]);

  const clearAllData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.CRUISES),
        AsyncStorage.removeItem(STORAGE_KEYS.BOOKED_CRUISES),
        AsyncStorage.removeItem(STORAGE_KEYS.CASINO_OFFERS),
        AsyncStorage.removeItem(STORAGE_KEYS.CALENDAR_EVENTS),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
      ]);
      setCruisesState([]);
      setBookedCruisesState([]);
      setCasinoOffersState([]);
      setCalendarEventsState([]);
      setLastSyncDate(null);
      console.log('[CruiseStore] All data cleared');
    } catch (error) {
      console.error('[CruiseStore] Failed to clear data:', error);
    }
  }, []);

  return {
    cruises,
    bookedCruises,
    casinoOffers,
    calendarEvents,
    isLoading,
    lastSyncDate,
    setCruises,
    addCruise,
    updateCruise,
    removeCruise,
    setBookedCruises,
    addBookedCruise,
    updateBookedCruise,
    removeBookedCruise,
    setCasinoOffers,
    setOffers: setCasinoOffers,
    addCasinoOffer,
    updateCasinoOffer,
    removeCasinoOffer,
    setCalendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    removeCalendarEvent,
    clearAllData,
    syncFromStorage,
  };
});
