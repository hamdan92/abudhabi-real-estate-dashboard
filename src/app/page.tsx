"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardHeader } from "@/components/dashboard/header";
import { KPICard } from "@/components/dashboard/kpi-card";
import { LoadingSpinner } from "@/components/dashboard/loading-skeleton";
import { Filters } from "@/components/dashboard/filters";
import {
  PriceTrendChart,
  TransactionVolumeChart,
  RegionChart,
  PropertyTypeChart,
  MarketSegmentChart,
} from "@/components/dashboard/charts";
import {
  Building2,
  DollarSign,
  TrendingUp,
  MapPin,
  BarChart3,
  PieChart,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumber, formatCurrency } from "@/lib/utils";
import {
  processDashboardData,
  filterTransactions,
  calculateKPIs,
  calculateYearlyData,
  calculateRegionData,
  calculatePropertyTypeData,
  calculateMarketSegments,
} from "@/lib/data-processor";

export default function Dashboard() {
  const { data, transactions, filterOptions, isLoading, error, refetch } = useDashboardData();

  // Filter state
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedSaleTypes, setSelectedSaleTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedYears.length > 0 ||
      selectedRegions.length > 0 ||
      selectedPropertyTypes.length > 0 ||
      selectedSaleTypes.length > 0
    );
  }, [selectedYears, selectedRegions, selectedPropertyTypes, selectedSaleTypes]);

  // Apply filters to transactions and recalculate data
  const filteredData = useMemo(() => {
    if (!transactions.length) return null;

    let filtered = transactions;

    // Apply year filter
    if (selectedYears.length > 0) {
      filtered = filtered.filter((t) => selectedYears.includes(t.year));
    }

    // Apply region filter
    if (selectedRegions.length > 0) {
      filtered = filtered.filter((t) => selectedRegions.includes(t.region));
    }

    // Apply property type filter
    if (selectedPropertyTypes.length > 0) {
      filtered = filtered.filter((t) => selectedPropertyTypes.includes(t.propertyType));
    }

    // Apply sale type filter
    if (selectedSaleTypes.length > 0) {
      filtered = filtered.filter((t) => selectedSaleTypes.includes(t.saleType));
    }

    // Recalculate all metrics with filtered data
    const residentialFiltered = filtered.filter((t) => t.assetCategory === "سكني");
    const currentYear = Math.max(...filtered.map((t) => t.year));
    const currentYearTxns = residentialFiltered.filter((t) => t.year === currentYear);
    const previousYearTxns = residentialFiltered.filter((t) => t.year === currentYear - 1);

    return {
      transactions: filtered,
      kpis: calculateKPIs(currentYearTxns, previousYearTxns),
      yearlyData: calculateYearlyData(residentialFiltered),
      regionData: calculateRegionData(residentialFiltered, previousYearTxns),
      propertyTypeData: calculatePropertyTypeData(filtered),
      marketSegments: calculateMarketSegments(filtered),
    };
  }, [transactions, selectedYears, selectedRegions, selectedPropertyTypes, selectedSaleTypes]);

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedYears([]);
    setSelectedRegions([]);
    setSelectedPropertyTypes([]);
    setSelectedSaleTypes([]);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Error: {error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data || !filteredData) {
    return null;
  }

  const displayData = hasActiveFilters ? filteredData : data;
  const { kpis, yearlyData, regionData, propertyTypeData, marketSegments } = displayData;

  return (
    <div className="min-h-screen bg-slate-950">
      <DashboardHeader onRefresh={refetch} isLoading={isLoading} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Market Overview
            </h2>
            <p className="text-slate-400">
              Real estate transactions in Abu Dhabi from 2019 to 2025
              {hasActiveFilters && (
                <span className="ml-2 text-amber-400">
                  (Filtered: {displayData.transactions.length.toLocaleString()} transactions)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-amber-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 w-5 h-5 flex items-center justify-center text-xs bg-white/20 rounded-full">
                {selectedYears.length + selectedRegions.length + selectedPropertyTypes.length + selectedSaleTypes.length}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters Pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-slate-400">Active filters:</span>
            {selectedYears.map((year) => (
              <span
                key={`year-${year}`}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-amber-500/20 text-amber-400 rounded-lg"
              >
                {year}
                <button onClick={() => setSelectedYears(selectedYears.filter((y) => y !== year))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedRegions.map((region) => (
              <span
                key={`region-${region}`}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-teal-500/20 text-teal-400 rounded-lg"
              >
                {region}
                <button onClick={() => setSelectedRegions(selectedRegions.filter((r) => r !== region))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedPropertyTypes.map((type) => (
              <span
                key={`type-${type}`}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-500/20 text-blue-400 rounded-lg"
              >
                {type}
                <button onClick={() => setSelectedPropertyTypes(selectedPropertyTypes.filter((t) => t !== type))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedSaleTypes.map((type) => (
              <span
                key={`sale-${type}`}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-purple-500/20 text-purple-400 rounded-lg"
              >
                {type}
                <button onClick={() => setSelectedSaleTypes(selectedSaleTypes.filter((t) => t !== type))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-sm text-slate-400 hover:text-slate-200 underline"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && filterOptions && (
            <div className="w-72 flex-shrink-0">
              <Filters
                years={filterOptions.years}
                regions={filterOptions.regions}
                propertyTypes={filterOptions.propertyTypes}
                selectedYears={selectedYears}
                selectedRegions={selectedRegions}
                selectedPropertyTypes={selectedPropertyTypes}
                selectedSaleTypes={selectedSaleTypes}
                onYearsChange={setSelectedYears}
                onRegionsChange={setSelectedRegions}
                onPropertyTypesChange={setSelectedPropertyTypes}
                onSaleTypesChange={setSelectedSaleTypes}
                onClearAll={clearAllFilters}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KPICard
                title={`Total Transactions (${yearlyData.length ? yearlyData[yearlyData.length - 1].year : ''})`}
                value={kpis.totalTransactions}
                change={kpis.yoyTransactionGrowth}
                icon={Building2}
                format="number"
              />
              <KPICard
                title="Total Value"
                value={kpis.totalValue}
                icon={DollarSign}
                format="currency"
                compact
              />
              <KPICard
                title="Avg. Price per SQM"
                value={kpis.avgPricePerSqm}
                change={kpis.yoyPriceGrowth}
                icon={TrendingUp}
                format="currency"
                compact={false}
              />
              <KPICard
                title="Most Active Region"
                value={kpis.mostActiveRegionEn}
                icon={MapPin}
                format="text"
              />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <Card className="p-4">
                <p className="text-sm text-slate-400 mb-1">
                  {hasActiveFilters ? "Filtered Transactions" : "All-Time Transactions"}
                </p>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(displayData.transactions.length)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-slate-400 mb-1">
                  {hasActiveFilters ? "Filtered Value" : "Total Value (All Time)"}
                </p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(
                    displayData.transactions.reduce((sum, t) => sum + (t.totalPrice || 0), 0),
                    true
                  )}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-slate-400 mb-1">Regions</p>
                <p className="text-2xl font-bold text-white">
                  {new Set(displayData.transactions.map((t) => t.region)).size}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-slate-400 mb-1">Projects</p>
                <p className="text-2xl font-bold text-white">
                  {new Set(displayData.transactions.map((t) => t.project)).size}
                </p>
              </Card>
            </div>

            {/* Charts Row 1: Price & Volume Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <PriceTrendChart data={yearlyData} />
              <TransactionVolumeChart data={yearlyData} />
            </div>

            {/* Charts Row 2: Regional Analysis & Property Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <RegionChart
                data={regionData}
                title="Top 10 Regions by Transactions"
                metric="transactions"
              />
              <PropertyTypeChart data={propertyTypeData} />
            </div>

            {/* Charts Row 3: Regional Price Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <RegionChart
                data={[...regionData].sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm)}
                title="Top 10 Regions by Price/SQM"
                metric="avgPricePerSqm"
              />
              <RegionChart
                data={[...regionData].sort((a, b) => b.totalValue - a.totalValue)}
                title="Top 10 Regions by Total Value"
                metric="totalValue"
              />
        </div>

            {/* Market Segments */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                Market Segmentation
              </h3>
              <MarketSegmentChart
                saleTypeData={marketSegments.saleType}
                marketTypeData={marketSegments.marketType}
              />
            </div>

            {/* Yearly Summary Table */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-amber-400" />
                  Yearly Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Year</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Transactions</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Total Value</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Avg Price/SQM</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Median Price/SQM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearlyData.map((row, index) => (
                        <tr
                          key={row.year}
                          className={`border-b border-slate-800 ${
                            index === yearlyData.length - 1 ? "bg-amber-500/5" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-white font-medium">{row.year}</td>
                          <td className="py-3 px-4 text-right text-slate-300">
                            {formatNumber(row.transactions)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300">
                            {formatCurrency(row.totalValue, true)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300">
                            AED {formatNumber(row.avgPricePerSqm)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300">
                            AED {formatNumber(row.medianPricePerSqm)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <footer className="text-center py-8 border-t border-slate-800">
              <p className="text-slate-500 text-sm">
                Abu Dhabi Real Estate Analytics Dashboard • Data from 2019-2025
              </p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
