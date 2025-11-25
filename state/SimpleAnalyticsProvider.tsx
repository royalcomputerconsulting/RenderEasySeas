import { useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import type { AnalyticsData, BookedCruise } from "@/types/models";
import { useCruiseStore } from "./CruiseStore";

export interface CasinoAnalytics {
  totalCoinIn: number;
  totalWinLoss: number;
  totalPointsEarned: number;
  netResult: number;
  avgCoinInPerCruise: number;
  avgWinLossPerCruise: number;
  avgPointsPerCruise: number;
  completedCruisesCount: number;
}

interface SimpleAnalyticsState {
  analytics: AnalyticsData;
  casinoAnalytics: CasinoAnalytics;
  completedCruises: BookedCruise[];
  isLoading: boolean;
  
  getTotalCruises: () => number;
  getTotalNights: () => number;
  getTotalSpent: () => number;
  getAveragePricePerNight: () => number;
  getFavoriteShip: () => string | undefined;
  getFavoriteDestination: () => string | undefined;
}

const DEFAULT_ANALYTICS: AnalyticsData = {
  totalSpent: 0,
  totalSaved: 0,
  totalCruises: 0,
  totalNights: 0,
  totalPoints: 0,
  totalPortTaxes: 0,
  portfolioROI: 0,
  averagePricePerNight: 0,
  averageROI: 0,
  monthlySpending: [],
  yearlySpending: [],
  cabinTypeDistribution: [],
  destinationDistribution: [],
  roiByMonth: [],
  pointsByMonth: [],
};

const DEFAULT_CASINO_ANALYTICS: CasinoAnalytics = {
  totalCoinIn: 0,
  totalWinLoss: 0,
  totalPointsEarned: 0,
  netResult: 0,
  avgCoinInPerCruise: 0,
  avgWinLossPerCruise: 0,
  avgPointsPerCruise: 0,
  completedCruisesCount: 0,
};

const DOLLARS_PER_POINT = 5;

export const [SimpleAnalyticsProvider, useSimpleAnalytics] = createContextHook((): SimpleAnalyticsState => {
  const { bookedCruises, isLoading } = useCruiseStore();

  const completedCruises = useMemo((): BookedCruise[] => {
    return bookedCruises.filter(cruise => 
      cruise.completionState === 'completed' || 
      cruise.status === 'completed'
    );
  }, [bookedCruises]);

  const casinoAnalytics = useMemo((): CasinoAnalytics => {
    if (completedCruises.length === 0) {
      return DEFAULT_CASINO_ANALYTICS;
    }

    let totalPointsEarned = 0;
    let totalWinLoss = 0;

    completedCruises.forEach((cruise: BookedCruise) => {
      const points = cruise.earnedPoints || cruise.casinoPoints || 0;
      totalPointsEarned += points;
      
      const winnings = cruise.winnings || 0;
      const actualSpend = cruise.actualSpend || 0;
      totalWinLoss += winnings - actualSpend;
    });

    const totalCoinIn = totalPointsEarned * DOLLARS_PER_POINT;
    const netResult = totalWinLoss;
    const count = completedCruises.length;

    console.log('[CasinoAnalytics] Calculated from completed cruises:', {
      completedCruisesCount: count,
      totalPointsEarned,
      totalCoinIn,
      totalWinLoss,
      netResult,
    });

    return {
      totalCoinIn,
      totalWinLoss,
      totalPointsEarned,
      netResult,
      avgCoinInPerCruise: count > 0 ? totalCoinIn / count : 0,
      avgWinLossPerCruise: count > 0 ? totalWinLoss / count : 0,
      avgPointsPerCruise: count > 0 ? totalPointsEarned / count : 0,
      completedCruisesCount: count,
    };
  }, [completedCruises]);

  const analytics = useMemo((): AnalyticsData => {
    if (bookedCruises.length === 0) {
      return DEFAULT_ANALYTICS;
    }

    let totalSpent = 0;
    let totalSaved = 0;
    let totalNights = 0;
    let totalPoints = 0;
    let totalPortTaxes = 0;
    let totalRetailValue = 0;
    const shipCounts: Record<string, number> = {};
    const destinationCounts: Record<string, number> = {};
    const cabinCounts: Record<string, number> = {};
    const monthlySpending: Record<string, number> = {};
    const yearlySpending: Record<string, number> = {};
    const roiByMonth: Record<string, number[]> = {};
    const pointsByMonth: Record<string, number> = {};

    bookedCruises.forEach((cruise: BookedCruise) => {
      totalNights += cruise.nights || 0;
      
      const price = cruise.totalPrice || cruise.price || 0;
      totalSpent += price;

      if (cruise.originalPrice && cruise.price) {
        const savings = cruise.originalPrice - cruise.price;
        if (savings > 0) {
          totalSaved += savings;
        }
      }

      if (cruise.shipName) {
        shipCounts[cruise.shipName] = (shipCounts[cruise.shipName] || 0) + 1;
      }

      if (cruise.destination) {
        destinationCounts[cruise.destination] = (destinationCounts[cruise.destination] || 0) + 1;
      }

      if (cruise.cabinType) {
        cabinCounts[cruise.cabinType] = (cabinCounts[cruise.cabinType] || 0) + 1;
      }

      if (cruise.taxes) {
        totalPortTaxes += cruise.taxes;
      }

      if (cruise.earnedPoints || cruise.casinoPoints) {
        const points = cruise.earnedPoints || cruise.casinoPoints || 0;
        totalPoints += points;
      }

      if (cruise.retailValue || cruise.originalPrice) {
        totalRetailValue += cruise.retailValue || cruise.originalPrice || 0;
      }

      if (cruise.sailDate) {
        const date = new Date(cruise.sailDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const yearKey = `${date.getFullYear()}`;
        
        monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + price;
        yearlySpending[yearKey] = (yearlySpending[yearKey] || 0) + price;
        
        const cruiseROI = cruise.roi || (totalRetailValue > 0 && price > 0 ? ((totalRetailValue - price) / price) * 100 : 0);
        if (!roiByMonth[monthKey]) roiByMonth[monthKey] = [];
        roiByMonth[monthKey].push(cruiseROI);
        
        const points = cruise.earnedPoints || cruise.casinoPoints || 0;
        pointsByMonth[monthKey] = (pointsByMonth[monthKey] || 0) + points;
      }
    });

    const favoriteShip = Object.entries(shipCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const favoriteDestination = Object.entries(destinationCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const averagePricePerNight = totalNights > 0 ? totalSpent / totalNights : 0;
    const portfolioROI = totalSpent > 0 ? ((totalSaved) / totalSpent) * 100 : 0;
    const averageROI = bookedCruises.length > 0 ? portfolioROI / bookedCruises.length : 0;

    console.log('[Analytics] Calculated analytics:', {
      totalCruises: bookedCruises.length,
      totalNights,
      totalSpent,
      totalSaved,
      favoriteShip,
      favoriteDestination,
    });

    return {
      totalSpent,
      totalSaved,
      totalCruises: bookedCruises.length,
      totalNights,
      totalPoints,
      totalPortTaxes,
      portfolioROI,
      averagePricePerNight,
      averageROI,
      favoriteShip,
      favoriteDestination,
      monthlySpending: Object.entries(monthlySpending).map(([month, amount]) => ({ month, amount })),
      yearlySpending: Object.entries(yearlySpending).map(([year, amount]) => ({ year, amount })),
      cabinTypeDistribution: Object.entries(cabinCounts).map(([type, count]) => ({ type, count })),
      destinationDistribution: Object.entries(destinationCounts).map(([destination, count]) => ({ destination, count })),
      roiByMonth: Object.entries(roiByMonth).map(([month, rois]) => ({ month, roi: rois.reduce((a, b) => a + b, 0) / rois.length })),
      pointsByMonth: Object.entries(pointsByMonth).map(([month, points]) => ({ month, points })),
    };
  }, [bookedCruises]);

  const getTotalCruises = () => analytics.totalCruises;
  const getTotalNights = () => analytics.totalNights;
  const getTotalSpent = () => analytics.totalSpent;
  const getAveragePricePerNight = () => analytics.averagePricePerNight;
  const getFavoriteShip = () => analytics.favoriteShip;
  const getFavoriteDestination = () => analytics.favoriteDestination;

  return {
    analytics,
    casinoAnalytics,
    completedCruises,
    isLoading,
    getTotalCruises,
    getTotalNights,
    getTotalSpent,
    getAveragePricePerNight,
    getFavoriteShip,
    getFavoriteDestination,
  };
});
