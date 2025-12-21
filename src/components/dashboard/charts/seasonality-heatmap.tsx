"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { Transaction } from "@/types";

interface SeasonalityHeatmapProps {
  transactions: Transaction[];
  metric?: "count" | "value" | "pricePerSqm";
  title?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function SeasonalityHeatmap({
  transactions,
  metric = "count",
  title = "Monthly Transaction Patterns",
}: SeasonalityHeatmapProps) {
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

  // Calculate min/max for color scale
  const allValues = heatmapData.flatMap((d) => d.months.map((m) => m.value)).filter((v) => v > 0);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  // Get color based on value
  const getColor = (value: number) => {
    if (value === 0) return "#1e293b";
    const normalized = (value - minValue) / (maxValue - minValue);
    
    // Color gradient from blue to amber
    if (normalized < 0.25) return "#1e40af"; // blue-800
    if (normalized < 0.5) return "#0891b2"; // cyan-600
    if (normalized < 0.75) return "#f59e0b"; // amber-500
    return "#dc2626"; // red-600
  };

  // Calculate monthly averages
  const monthlyAverages = useMemo(() => {
    return MONTHS.map((_, i) => {
      const monthValues = heatmapData.flatMap((d) => d.months[i].value).filter((v) => v > 0);
      return monthValues.length ? monthValues.reduce((a, b) => a + b, 0) / monthValues.length : 0;
    });
  }, [heatmapData]);

  const bestMonth = monthlyAverages.indexOf(Math.max(...monthlyAverages));
  const worstMonth = monthlyAverages.indexOf(Math.min(...monthlyAverages.filter((v) => v > 0)));

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
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {metric === "count" && "Number of transactions by month and year"}
          {metric === "value" && "Total transaction value by month and year"}
          {metric === "pricePerSqm" && "Average price per SQM by month and year"}
        </CardDescription>
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

            {/* Data Rows */}
            {heatmapData.map(({ year, months }) => (
              <div key={year} className="flex">
                <div className="w-16 flex-shrink-0 text-sm text-slate-300 font-medium py-2 pr-2 text-right">
                  {year}
                </div>
                {months.map(({ month, value }) => (
                  <div
                    key={`${year}-${month}`}
                    className="flex-1 p-1"
                  >
                    <div
                      className="h-10 rounded flex items-center justify-center text-xs font-medium transition-all hover:ring-2 hover:ring-amber-400 cursor-default"
                      style={{ backgroundColor: getColor(value) }}
                      title={`${MONTHS[month - 1]} ${year}: ${formatValue(value)}`}
                    >
                      {value > 0 && (
                        <span className="text-white/90">{formatValue(value)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-700">
          <span className="text-xs text-slate-400">Low</span>
          <div className="flex gap-0.5">
            <div className="w-6 h-4 rounded bg-blue-800" />
            <div className="w-6 h-4 rounded bg-cyan-600" />
            <div className="w-6 h-4 rounded bg-amber-500" />
            <div className="w-6 h-4 rounded bg-red-600" />
          </div>
          <span className="text-xs text-slate-400">High</span>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700">
          <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
            <p className="text-sm text-slate-400">Peak Month (Avg)</p>
            <p className="text-xl font-bold text-emerald-400">{MONTHS[bestMonth]}</p>
            <p className="text-xs text-slate-500">
              Avg: {formatValue(monthlyAverages[bestMonth])}
            </p>
          </div>
          <div className="text-center p-3 bg-rose-500/10 rounded-lg">
            <p className="text-sm text-slate-400">Slowest Month (Avg)</p>
            <p className="text-xl font-bold text-rose-400">{MONTHS[worstMonth]}</p>
            <p className="text-xs text-slate-500">
              Avg: {formatValue(monthlyAverages[worstMonth])}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

