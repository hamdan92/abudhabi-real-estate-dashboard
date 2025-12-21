"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardData, SegmentedDashboardData, Transaction } from "@/types";
import {
  loadExcelData,
  processDashboardData,
  processSegmentedDashboardData,
  getFilterOptions,
  filterTransactions,
  FilterOptions,
} from "@/lib/data-processor";

interface FilterOptionsData {
  regions: string[];
  propertyTypes: string[];
  bedrooms: string[];
  years: number[];
  assetCategories: string[];
  saleTypes: string[];
  marketTypes: string[];
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  segmentedData: SegmentedDashboardData | null;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  filterOptions: FilterOptionsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  applyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [segmentedData, setSegmentedData] = useState<SegmentedDashboardData | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch the Excel file
      const response = await fetch("/data-3.xlsx");
      if (!response.ok) {
        throw new Error("Failed to load data file");
      }

      const buffer = await response.arrayBuffer();
      const loadedTransactions = await loadExcelData(buffer);

      setTransactions(loadedTransactions);

      // Process dashboard data
      const dashboardData = processDashboardData(loadedTransactions);
      setData(dashboardData);

      // Process segmented data
      const segmented = processSegmentedDashboardData(loadedTransactions);
      setSegmentedData(segmented);

      // Get filter options
      const options = getFilterOptions(loadedTransactions);
      setFilterOptions(options);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply filters to transactions
  const applyFilters = useCallback((filters: FilterOptions) => {
    setCurrentFilters(filters);
  }, []);

  // Memoized filtered transactions
  const filteredTransactions = useMemo(() => {
    if (Object.keys(currentFilters).length === 0) return transactions;
    return filterTransactions(transactions, currentFilters);
  }, [transactions, currentFilters]);

  return {
    data,
    segmentedData,
    transactions,
    filteredTransactions,
    filterOptions,
    isLoading,
    error,
    refetch: loadData,
    applyFilters,
    currentFilters,
  };
}
