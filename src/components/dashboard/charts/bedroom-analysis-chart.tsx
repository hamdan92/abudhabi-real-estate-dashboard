"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { BedroomData, Transaction } from "@/types";
import { translate } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface BedroomAnalysisChartProps {
  data: BedroomData[];
  transactions?: Transaction[];
  title?: string;
}

// Bedroom order for sorting
const BEDROOM_ORDER = [
  "ستوديو",
  "غرفة نوم واحدة",
  "غرفتين نوم",
  "٣ غرف نوم",
  "٤ غرف نوم",
  "٥ غرف نوم",
  "٦ غرف نوم وما فوق",
];

const BEDROOM_LABELS: Record<string, string> = {
  "ستوديو": "Studio",
  "غرفة نوم واحدة": "1 BR",
  "غرفتين نوم": "2 BR",
  "٣ غرف نوم": "3 BR",
  "٤ غرف نوم": "4 BR",
  "٥ غرف نوم": "5 BR",
  "٦ غرف نوم وما فوق": "6+ BR",
  "غير مصنف": "N/A",
};

// Using actual Arabic characters from data
const PROPERTY_TYPES = ["All", "شقة", "ڨيلا", "تاونهاوس / ڨيلا شبه منفصلة"];
const PROPERTY_TYPE_COLORS: Record<string, string> = {
  "All": "#f59e0b",
  "شقة": "#3b82f6",
  "ڨيلا": "#10b981",
  "تاونهاوس / ڨيلا شبه منفصلة": "#8b5cf6",
};

export function BedroomAnalysisChart({
  data,
  transactions = [],
  title = "Bedroom Configuration Analysis",
}: BedroomAnalysisChartProps) {
  const [selectedYear, setSelectedYear] = useState<number | "All">("All");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("All");

  // Get available years
  const availableYears = useMemo(() => {
    if (!transactions.length) return [];
    return [...new Set(transactions.map(t => t.year))].sort((a, b) => b - a);
  }, [transactions]);

  // Calculate filtered bedroom data
  const chartData = useMemo(() => {
    // If no transactions or no filters, use the original data
    if (!transactions.length || (selectedYear === "All" && selectedPropertyType === "All")) {
      return data
        .filter((d) => BEDROOM_ORDER.includes(d.bedrooms))
        .sort((a, b) => BEDROOM_ORDER.indexOf(a.bedrooms) - BEDROOM_ORDER.indexOf(b.bedrooms))
        .map((d) => ({
          ...d,
          label: BEDROOM_LABELS[d.bedrooms] || d.bedrooms,
        }));
    }

    // Filter transactions
    let filtered = transactions.filter(t => t.assetCategory === "سكني");
    
    if (selectedYear !== "All") {
      filtered = filtered.filter(t => t.year === selectedYear);
    }
    
    if (selectedPropertyType !== "All") {
      filtered = filtered.filter(t => t.propertyType === selectedPropertyType);
    }

    // Group by bedroom
    const bedroomMap = new Map<string, {
      count: number;
      totalPrice: number;
      totalArea: number;
      prices: number[];
    }>();

    filtered.forEach(t => {
      const bedroom = t.propertyDesign;
      if (!bedroom) return;
      
      if (!bedroomMap.has(bedroom)) {
        bedroomMap.set(bedroom, { count: 0, totalPrice: 0, totalArea: 0, prices: [] });
      }
      
      const entry = bedroomMap.get(bedroom)!;
      entry.count++;
      entry.totalPrice += t.totalPrice || 0;
      entry.totalArea += t.soldArea || 0;
      if (t.pricePerSqm > 0 && t.pricePerSqm < 100000) {
        entry.prices.push(t.pricePerSqm);
      }
    });

    return Array.from(bedroomMap.entries())
      .filter(([bedroom]) => BEDROOM_ORDER.includes(bedroom))
      .sort((a, b) => BEDROOM_ORDER.indexOf(a[0]) - BEDROOM_ORDER.indexOf(b[0]))
      .map(([bedroom, entry]) => ({
        bedrooms: bedroom,
        label: BEDROOM_LABELS[bedroom] || bedroom,
        count: entry.count,
        avgPrice: entry.count > 0 ? entry.totalPrice / entry.count : 0,
        avgArea: entry.count > 0 ? entry.totalArea / entry.count : 0,
        avgPricePerSqm: entry.prices.length > 0 
          ? entry.prices.reduce((a, b) => a + b, 0) / entry.prices.length 
          : 0,
      }));
  }, [data, transactions, selectedYear, selectedPropertyType]);

  // Find insights
  const mostPopular = chartData.length > 0 
    ? chartData.reduce((max, d) => d.count > max.count ? d : max, chartData[0])
    : null;
  const highestPrice = chartData.length > 0 
    ? chartData.reduce((max, d) => d.avgPricePerSqm > max.avgPricePerSqm ? d : max, chartData[0])
    : null;
  const bestValue = chartData.length > 0 
    ? chartData.reduce((best, d) => {
        if (d.avgPricePerSqm === 0) return best;
        const valueScore = d.avgArea / d.avgPricePerSqm;
        const bestScore = best.avgArea / best.avgPricePerSqm;
        return valueScore > bestScore ? d : best;
      }, chartData[0])
    : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Transaction count and average price by bedroom configuration
            </CardDescription>
          </div>
        </div>
        
        {/* Filters */}
        {transactions.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-700">
            {/* Year Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Year:</span>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setSelectedYear("All")}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-colors",
                    selectedYear === "All"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  All
                </button>
                {availableYears.slice(0, 5).map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md transition-colors",
                      selectedYear === year
                        ? "bg-amber-500 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Type:</span>
              <div className="flex gap-1 flex-wrap">
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedPropertyType(type)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md transition-colors",
                      selectedPropertyType === type
                        ? "text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    )}
                    style={{
                      backgroundColor: selectedPropertyType === type ? PROPERTY_TYPE_COLORS[type] : undefined,
                    }}
                  >
                    {type === "All" ? "All" : translate(type, "propertyType")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={{ stroke: "#475569" }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={{ stroke: "#475569" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={{ stroke: "#475569" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                    formatter={(value, name) => {
                      const displayName = name || '';
                      if (typeof value !== 'number') return ['-', displayName];
                      if (name === "Transactions") return [formatNumber(value), displayName];
                      if (name === "Avg Price/SQM") return [`AED ${formatNumber(value)}`, displayName];
                      return [value, displayName];
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#94a3b8" }} />
                  <Bar
                    yAxisId="left"
                    dataKey="count"
                    name="Transactions"
                    fill={PROPERTY_TYPE_COLORS[selectedPropertyType]}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgPricePerSqm"
                    name="Avg Price/SQM"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Insights Grid */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
              <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Most Popular</p>
                <p className="text-lg font-bold text-blue-400">
                  {mostPopular?.label || "N/A"}
                </p>
                <p className="text-xs text-slate-500">
                  {formatNumber(mostPopular?.count || 0)} transactions
                </p>
              </div>
              <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Premium Segment</p>
                <p className="text-lg font-bold text-amber-400">
                  {highestPrice?.label || "N/A"}
                </p>
                <p className="text-xs text-slate-500">
                  AED {formatNumber(highestPrice?.avgPricePerSqm || 0)}/sqm
                </p>
              </div>
              <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Best Value</p>
                <p className="text-lg font-bold text-emerald-400">
                  {bestValue?.label || "N/A"}
                </p>
                <p className="text-xs text-slate-500">
                  {formatNumber(bestValue?.avgArea || 0)} sqm avg
                </p>
              </div>
            </div>

            {/* Data Table */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-2 text-slate-400 font-medium">Type</th>
                    <th className="text-right py-2 px-2 text-slate-400 font-medium">Count</th>
                    <th className="text-right py-2 px-2 text-slate-400 font-medium">Avg Price</th>
                    <th className="text-right py-2 px-2 text-slate-400 font-medium">Avg Area</th>
                    <th className="text-right py-2 px-2 text-slate-400 font-medium">Price/SQM</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row) => (
                    <tr key={row.bedrooms} className="border-b border-slate-800">
                      <td className="py-2 px-2 text-slate-200">{row.label}</td>
                      <td className="py-2 px-2 text-right text-slate-300">{formatNumber(row.count)}</td>
                      <td className="py-2 px-2 text-right text-slate-300">{formatCurrency(row.avgPrice, true)}</td>
                      <td className="py-2 px-2 text-right text-slate-300">{formatNumber(row.avgArea)} sqm</td>
                      <td className="py-2 px-2 text-right text-slate-300">AED {formatNumber(row.avgPricePerSqm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-slate-400">
            No data available for the selected filters
          </div>
        )}
      </CardContent>
    </Card>
  );
}
