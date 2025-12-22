"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { formatNumber, formatPercentage } from "@/lib/utils";
import { Transaction } from "@/types";
import { cn } from "@/lib/utils";

interface SeasonalityHeatmapProps {
  transactions: Transaction[];
  metric?: "count" | "value" | "pricePerSqm";
  title?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const VIEW_MODES = ["Percentage", "Values"] as const;
type ViewMode = typeof VIEW_MODES[number];

export function SeasonalityHeatmap({
  transactions,
  metric = "count",
  title = "Monthly Transaction Patterns",
}: SeasonalityHeatmapProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("Percentage");

  // Calculate monthly data by year
  const heatmapData = useMemo(() => {
    const years = [...new Set(transactions.map((t) => t.year))].sort();
    const data: { year: number; months: { month: number; value: number }[] }[] = [];

    years.forEach((year) => {
      const yearTxns = transactions.filter((t) => t.year === year);
      const months = Array.from({ length: 12 }, (_, i) => {
        const monthTxns = yearTxns.filter((t) => t.month === i + 1);
        let value = 0;

        if (metric === "count") {
          value = monthTxns.length;
        } else if (metric === "value") {
          value = monthTxns.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
        } else if (metric === "pricePerSqm") {
          const prices = monthTxns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
          value = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
        }

        return { month: i + 1, value };
      });

      data.push({ year, months });
    });

    return data;
  }, [transactions, metric]);

  // Calculate yearly averages for normalization
  const yearlyAverages = useMemo(() => {
    const map = new Map<number, number>();
    heatmapData.forEach(({ year, months }) => {
      const values = months.map(m => m.value).filter(v => v > 0);
      if (values.length > 0) {
        map.set(year, values.reduce((a, b) => a + b, 0) / values.length);
      }
    });
    return map;
  }, [heatmapData]);

  // Calculate percentage deviation from yearly average
  const percentageData = useMemo(() => {
    return heatmapData.map(({ year, months }) => {
      const yearAvg = yearlyAverages.get(year) || 1;
      return {
        year,
        months: months.map(({ month, value }) => ({
          month,
          value,
          percentage: yearAvg > 0 ? ((value - yearAvg) / yearAvg) * 100 : 0,
        })),
      };
    });
  }, [heatmapData, yearlyAverages]);

  // Calculate monthly seasonality index (average % deviation across all years)
  const monthlySeasonality = useMemo(() => {
    return MONTHS.map((_, i) => {
      const percentages = percentageData
        .map(d => d.months[i].percentage)
        .filter(p => !isNaN(p) && isFinite(p));
      return percentages.length > 0 
        ? percentages.reduce((a, b) => a + b, 0) / percentages.length 
        : 0;
    });
  }, [percentageData]);

  // Get color based on percentage deviation
  const getPercentageColor = (percentage: number) => {
    if (isNaN(percentage) || !isFinite(percentage)) return "#1e293b";
    
    // Color gradient: red (negative) -> gray (0) -> green (positive)
    if (percentage <= -30) return "#dc2626"; // red-600
    if (percentage <= -15) return "#f97316"; // orange-500
    if (percentage <= -5) return "#fbbf24"; // amber-400
    if (percentage <= 5) return "#6b7280"; // gray-500
    if (percentage <= 15) return "#22c55e"; // green-500
    if (percentage <= 30) return "#10b981"; // emerald-500
    return "#059669"; // emerald-600
  };

  // Get color based on absolute value
  const getValueColor = (value: number) => {
    if (value === 0) return "#1e293b";
    const allValues = heatmapData.flatMap((d) => d.months.map((m) => m.value)).filter((v) => v > 0);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const normalized = (value - minValue) / (maxValue - minValue);
    
    if (normalized < 0.25) return "#1e40af";
    if (normalized < 0.5) return "#0891b2";
    if (normalized < 0.75) return "#f59e0b";
    return "#dc2626";
  };

  // Calculate monthly averages for insights
  const monthlyAverages = useMemo(() => {
    return MONTHS.map((_, i) => {
      const monthValues = heatmapData.flatMap((d) => d.months[i].value).filter((v) => v > 0);
      return monthValues.length ? monthValues.reduce((a, b) => a + b, 0) / monthValues.length : 0;
    });
  }, [heatmapData]);

  const bestMonth = monthlySeasonality.indexOf(Math.max(...monthlySeasonality));
  const worstMonth = monthlySeasonality.indexOf(Math.min(...monthlySeasonality));

  const formatValue = (value: number) => {
    if (metric === "value") {
      return value >= 1_000_000_000 
        ? `${(value / 1_000_000_000).toFixed(1)}B`
        : `${(value / 1_000_000).toFixed(0)}M`;
    }
    if (metric === "pricePerSqm") {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return formatNumber(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {viewMode === "Percentage" 
                ? "Percentage deviation from yearly average (shows true seasonality)"
                : metric === "count" ? "Number of transactions by month and year"
                : metric === "value" ? "Total transaction value by month and year"
                : "Average price per SQM by month and year"
              }
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  viewMode === mode
                    ? "bg-amber-500 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header Row */}
            <div className="flex">
              <div className="w-16 flex-shrink-0" />
              {MONTHS.map((month) => (
                <div
                  key={month}
                  className="flex-1 text-center text-xs text-slate-400 font-medium py-2"
                >
                  {month}
                </div>
              ))}
            </div>

            {/* Seasonality Index Row (only in percentage mode) */}
            {viewMode === "Percentage" && (
              <div className="flex mb-2 pb-2 border-b border-slate-700">
                <div className="w-16 flex-shrink-0 text-xs text-slate-400 font-medium py-2 pr-2 text-right">
                  Index
                </div>
                {monthlySeasonality.map((pct, i) => (
                  <div
                    key={`index-${i}`}
                    className="flex-1 p-1"
                  >
                    <div
                      className="h-8 rounded flex items-center justify-center text-xs font-bold transition-all"
                      style={{ backgroundColor: getPercentageColor(pct) }}
                    >
                      <span className="text-white">
                        {pct >= 0 ? "+" : ""}{pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Data Rows */}
            {(viewMode === "Percentage" ? percentageData : heatmapData).map(({ year, months }) => (
              <div key={year} className="flex">
                <div className="w-16 flex-shrink-0 text-sm text-slate-300 font-medium py-2 pr-2 text-right">
                  {year}
                </div>
                {months.map((monthData, idx) => {
                  const value = 'percentage' in monthData ? monthData.value : monthData.value;
                  const percentage = 'percentage' in monthData ? monthData.percentage : 0;
                  const month = monthData.month;
                  
                  return (
                    <div
                      key={`${year}-${month}`}
                      className="flex-1 p-1"
                    >
                      <div
                        className="h-10 rounded flex items-center justify-center text-xs font-medium transition-all hover:ring-2 hover:ring-amber-400 cursor-default"
                        style={{ 
                          backgroundColor: viewMode === "Percentage" 
                            ? getPercentageColor(percentage) 
                            : getValueColor(value)
                        }}
                        title={`${MONTHS[month - 1]} ${year}: ${formatValue(value)}${viewMode === "Percentage" ? ` (${percentage >= 0 ? "+" : ""}${percentage.toFixed(1)}%)` : ""}`}
                      >
                        {value > 0 && (
                          <span className="text-white/90">
                            {viewMode === "Percentage" 
                              ? `${percentage >= 0 ? "+" : ""}${percentage.toFixed(0)}%`
                              : formatValue(value)
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-700">
          {viewMode === "Percentage" ? (
            <>
              <span className="text-xs text-slate-400">Below Avg</span>
              <div className="flex gap-0.5">
                <div className="w-6 h-4 rounded bg-red-600" title="-30%+" />
                <div className="w-6 h-4 rounded bg-orange-500" title="-15% to -30%" />
                <div className="w-6 h-4 rounded bg-amber-400" title="-5% to -15%" />
                <div className="w-6 h-4 rounded bg-gray-500" title="±5%" />
                <div className="w-6 h-4 rounded bg-green-500" title="+5% to +15%" />
                <div className="w-6 h-4 rounded bg-emerald-500" title="+15% to +30%" />
                <div className="w-6 h-4 rounded bg-emerald-600" title="+30%+" />
              </div>
              <span className="text-xs text-slate-400">Above Avg</span>
            </>
          ) : (
            <>
              <span className="text-xs text-slate-400">Low</span>
              <div className="flex gap-0.5">
                <div className="w-6 h-4 rounded bg-blue-800" />
                <div className="w-6 h-4 rounded bg-cyan-600" />
                <div className="w-6 h-4 rounded bg-amber-500" />
                <div className="w-6 h-4 rounded bg-red-600" />
              </div>
              <span className="text-xs text-slate-400">High</span>
            </>
          )}
        </div>

        {/* Insights */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700">
          <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
            <p className="text-sm text-slate-400">Peak Season</p>
            <p className="text-xl font-bold text-emerald-400">{MONTHS[bestMonth]}</p>
            <p className="text-xs text-slate-500">
              {monthlySeasonality[bestMonth] >= 0 ? "+" : ""}{monthlySeasonality[bestMonth].toFixed(1)}% above avg
            </p>
          </div>
          <div className="text-center p-3 bg-rose-500/10 rounded-lg">
            <p className="text-sm text-slate-400">Slow Season</p>
            <p className="text-xl font-bold text-rose-400">{MONTHS[worstMonth]}</p>
            <p className="text-xs text-slate-500">
              {monthlySeasonality[worstMonth] >= 0 ? "+" : ""}{monthlySeasonality[worstMonth].toFixed(1)}% below avg
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
