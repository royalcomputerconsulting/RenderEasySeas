import { useState, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import type { CruiseFilter } from "@/types/models";

interface FiltersState {
  filters: CruiseFilter;
  activeFilterCount: number;
  
  setFilter: <K extends keyof CruiseFilter>(key: K, value: CruiseFilter[K]) => void;
  setFilters: (filters: Partial<CruiseFilter>) => void;
  clearFilters: () => void;
  clearFilter: (key: keyof CruiseFilter) => void;
  hasActiveFilters: boolean;
}

const DEFAULT_FILTERS: CruiseFilter = {
  searchQuery: '',
  shipNames: [],
  departurePorts: [],
  destinations: [],
  minNights: undefined,
  maxNights: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  dateRange: undefined,
  hasOffer: undefined,
  hasFreeplay: undefined,
  hasOBC: undefined,
  cabinTypes: [],
  sortBy: 'date',
  sortOrder: 'asc',
};

export const [FiltersProvider, useFilters] = createContextHook((): FiltersState => {
  const [filters, setFiltersState] = useState<CruiseFilter>(DEFAULT_FILTERS);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery && filters.searchQuery.length > 0) count++;
    if (filters.shipNames && filters.shipNames.length > 0) count++;
    if (filters.departurePorts && filters.departurePorts.length > 0) count++;
    if (filters.destinations && filters.destinations.length > 0) count++;
    if (filters.minNights !== undefined) count++;
    if (filters.maxNights !== undefined) count++;
    if (filters.minPrice !== undefined) count++;
    if (filters.maxPrice !== undefined) count++;
    if (filters.dateRange) count++;
    if (filters.hasOffer !== undefined) count++;
    if (filters.hasFreeplay !== undefined) count++;
    if (filters.hasOBC !== undefined) count++;
    if (filters.cabinTypes && filters.cabinTypes.length > 0) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  const setFilter = useCallback(<K extends keyof CruiseFilter>(key: K, value: CruiseFilter[K]) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
    console.log('[Filters] Set filter:', key, value);
  }, []);

  const setFilters = useCallback((newFilters: Partial<CruiseFilter>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    console.log('[Filters] Set filters:', Object.keys(newFilters));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    console.log('[Filters] Cleared all filters');
  }, []);

  const clearFilter = useCallback((key: keyof CruiseFilter) => {
    setFiltersState(prev => ({ ...prev, [key]: DEFAULT_FILTERS[key] }));
    console.log('[Filters] Cleared filter:', key);
  }, []);

  return {
    filters,
    activeFilterCount,
    setFilter,
    setFilters,
    clearFilters,
    clearFilter,
    hasActiveFilters,
  };
});
