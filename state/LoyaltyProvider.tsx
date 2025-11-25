import { useMemo, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import type { BookedCruise, ClubRoyaleTier, CrownAnchorLevel } from "@/types/models";
import { useCruiseStore } from "./CruiseStore";
import { 
  CLUB_ROYALE_TIERS, 
  getTierByPoints, 
  getTierProgress,
} from "@/constants/clubRoyaleTiers";
import { 
  CROWN_ANCHOR_LEVELS, 
  getLevelByNights, 
  getLevelProgress,
} from "@/constants/crownAnchor";

interface LoyaltyState {
  clubRoyalePoints: number;
  clubRoyaleTier: ClubRoyaleTier;
  crownAnchorPoints: number;
  crownAnchorLevel: CrownAnchorLevel;
  
  totalCompletedNights: number;
  totalBookedNights: number;
  projectedCrownAnchorPoints: number;
  projectedCrownAnchorLevel: CrownAnchorLevel;
  
  clubRoyaleProgress: {
    nextTier: string | null;
    pointsToNext: number;
    percentComplete: number;
  };
  
  crownAnchorProgress: {
    nextLevel: string | null;
    nightsToNext: number;
    percentComplete: number;
  };
  
  pinnacleProgress: {
    nightsToNext: number;
    percentComplete: number;
    projectedDate: Date | null;
  };
  
  mastersProgress: {
    pointsToNext: number;
    percentComplete: number;
    currentYearPoints: number;
    resetDate: Date;
  };
  
  isLoading: boolean;
  
  setManualClubRoyalePoints: (points: number) => void;
  setManualCrownAnchorPoints: (points: number) => void;
}

const STORAGE_KEYS = {
  MANUAL_CLUB_ROYALE_POINTS: 'easyseas_manual_club_royale_points',
  MANUAL_CROWN_ANCHOR_POINTS: 'easyseas_manual_crown_anchor_points',
};

export const [LoyaltyProvider, useLoyalty] = createContextHook((): LoyaltyState => {
  const { bookedCruises, isLoading: cruisesLoading } = useCruiseStore();
  const [manualClubRoyalePoints, setManualClubRoyalePointsState] = useState<number | null>(null);
  const [manualCrownAnchorPoints, setManualCrownAnchorPointsState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadManualPoints = async () => {
      try {
        const [clubRoyale, crownAnchor] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.MANUAL_CLUB_ROYALE_POINTS),
          AsyncStorage.getItem(STORAGE_KEYS.MANUAL_CROWN_ANCHOR_POINTS),
        ]);
        
        if (clubRoyale !== null) {
          setManualClubRoyalePointsState(parseInt(clubRoyale, 10));
        }
        if (crownAnchor !== null) {
          setManualCrownAnchorPointsState(parseInt(crownAnchor, 10));
        }
        console.log('[LoyaltyProvider] Loaded manual points:', { clubRoyale, crownAnchor });
      } catch (error) {
        console.error('[LoyaltyProvider] Failed to load manual points:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadManualPoints();
  }, []);

  const setManualClubRoyalePoints = useCallback(async (points: number) => {
    setManualClubRoyalePointsState(points);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MANUAL_CLUB_ROYALE_POINTS, points.toString());
      console.log('[LoyaltyProvider] Saved manual Club Royale points:', points);
    } catch (error) {
      console.error('[LoyaltyProvider] Failed to save Club Royale points:', error);
    }
  }, []);

  const setManualCrownAnchorPoints = useCallback(async (points: number) => {
    setManualCrownAnchorPointsState(points);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MANUAL_CROWN_ANCHOR_POINTS, points.toString());
      console.log('[LoyaltyProvider] Saved manual Crown & Anchor points:', points);
    } catch (error) {
      console.error('[LoyaltyProvider] Failed to save Crown & Anchor points:', error);
    }
  }, []);

  const calculatedData = useMemo(() => {
    let calculatedClubRoyalePoints = 0;
    let completedNights = 0;
    let bookedNights = 0;
    const today = new Date();
    const currentYear = today.getFullYear();
    const lastApril1 = new Date(currentYear, 3, 1);
    if (today < lastApril1) {
      lastApril1.setFullYear(currentYear - 1);
    }
    const nextApril1 = new Date(lastApril1);
    nextApril1.setFullYear(lastApril1.getFullYear() + 1);

    let currentYearClubRoyalePoints = 0;
    const upcomingBookedCruises: { date: Date; nights: number }[] = [];

    bookedCruises.forEach((cruise: BookedCruise) => {
      const nights = cruise.nights || 0;
      const returnDate = new Date(cruise.returnDate);
      const isCompleted = returnDate < today || cruise.completionState === 'completed';
      
      if (isCompleted) {
        completedNights += nights;
        if (cruise.earnedPoints) {
          calculatedClubRoyalePoints += cruise.earnedPoints;
          if (returnDate >= lastApril1) {
            currentYearClubRoyalePoints += cruise.earnedPoints;
          }
        }
      } else {
        bookedNights += nights;
        upcomingBookedCruises.push({ date: returnDate, nights });
      }
    });

    upcomingBookedCruises.sort((a, b) => a.date.getTime() - b.date.getTime());

    const effectiveClubRoyalePoints = manualClubRoyalePoints ?? calculatedClubRoyalePoints;
    const effectiveCrownAnchorPoints = manualCrownAnchorPoints ?? completedNights;
    
    const clubRoyaleTier = getTierByPoints(effectiveClubRoyalePoints) as ClubRoyaleTier;
    const crownAnchorLevel = getLevelByNights(effectiveCrownAnchorPoints) as CrownAnchorLevel;
    
    const projectedCrownAnchorPoints = effectiveCrownAnchorPoints + bookedNights;
    const projectedCrownAnchorLevel = getLevelByNights(projectedCrownAnchorPoints) as CrownAnchorLevel;

    const clubRoyaleProgress = getTierProgress(effectiveClubRoyalePoints, clubRoyaleTier);
    const crownAnchorProgress = getLevelProgress(effectiveCrownAnchorPoints, crownAnchorLevel);

    const pinnacleThreshold = CROWN_ANCHOR_LEVELS.Pinnacle.cruiseNights;
    const nightsNeededForPinnacle = Math.max(0, pinnacleThreshold - effectiveCrownAnchorPoints);
    let projectedPinnacleDate: Date | null = null;
    
    if (nightsNeededForPinnacle > 0) {
      let accumulatedNights = 0;
      for (const cruise of upcomingBookedCruises) {
        accumulatedNights += cruise.nights;
        if (accumulatedNights >= nightsNeededForPinnacle) {
          projectedPinnacleDate = cruise.date;
          break;
        }
      }
    }

    const pinnacleProgress = {
      nightsToNext: nightsNeededForPinnacle,
      percentComplete: Math.min(100, (effectiveCrownAnchorPoints / pinnacleThreshold) * 100),
      projectedDate: projectedPinnacleDate,
    };

    const mastersThreshold = CLUB_ROYALE_TIERS.Masters.threshold;
    const effectiveCurrentYearPoints = manualClubRoyalePoints !== null ? manualClubRoyalePoints : currentYearClubRoyalePoints;
    
    const mastersProgress = {
      pointsToNext: Math.max(0, mastersThreshold - effectiveCurrentYearPoints),
      percentComplete: Math.min(100, (effectiveCurrentYearPoints / mastersThreshold) * 100),
      currentYearPoints: effectiveCurrentYearPoints,
      resetDate: nextApril1,
    };

    console.log('[LoyaltyProvider] Calculated loyalty data:', {
      clubRoyalePoints: effectiveClubRoyalePoints,
      clubRoyaleTier,
      crownAnchorPoints: effectiveCrownAnchorPoints,
      crownAnchorLevel,
      completedNights,
      bookedNights,
      projectedCrownAnchorPoints,
      projectedCrownAnchorLevel,
      pinnacleProgress,
      mastersProgress,
    });

    return {
      clubRoyalePoints: effectiveClubRoyalePoints,
      clubRoyaleTier,
      crownAnchorPoints: effectiveCrownAnchorPoints,
      crownAnchorLevel,
      totalCompletedNights: completedNights,
      totalBookedNights: bookedNights,
      projectedCrownAnchorPoints,
      projectedCrownAnchorLevel,
      clubRoyaleProgress,
      crownAnchorProgress,
      pinnacleProgress,
      mastersProgress,
    };
  }, [bookedCruises, manualClubRoyalePoints, manualCrownAnchorPoints]);

  return {
    ...calculatedData,
    isLoading: isLoading || cruisesLoading,
    setManualClubRoyalePoints,
    setManualCrownAnchorPoints,
  };
});
