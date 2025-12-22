"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { YearlyData, Transaction } from "@/types";
import { translate } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface PriceTrendChartProps {
  data: YearlyData[];
  transactions?: Transaction[];
  title?: string;
}

// Property type colors - using actual Arabic characters from data
const PROPERTY_TYPE_COLORS: Record<string, string> = {
  "All": "#f59e0b",
  "شقة": "#3b82f6",
  "ڨيلا": "#10b981",
  "تاونهاوس / ڨيلا شبه منفصلة": "#8b5cf6",
  "أرض لڨيلا": "#ef4444",
  "أخرى": "#94a3b8",
};

const PROPERTY_TYPES = ["All", "شقة", "ڨيلا", "تاونهاوس / ڨيلا شبه منفصلة", "أرض لڨيلا"];

export function PriceTrendChart({ 
  data, 
  transactions = [],
  title = "Price per SQM Trend" 
}: PriceTrendChartProps) {
  const [selectedType, setSelectedType] = useState<string>("All");

  // Calculate data by property type
  const chartData = useMemo(() => {
    if (selectedType === "All" || !transactions.length) {
      return data;
    }

    // Filter transactions by property type and calculate yearly data
    const filtered = transactions.filter(t => 
      t.propertyType === selectedType && 
      t.assetCategory === "سكني"
    );

    if (filtered.length === 0) return data;

    const yearlyMap = new Map<number, { prices: number[], total: number, count: number }>();
    
    filtered.forEach(t => {
      if (!yearlyMap.has(t.year)) {
        yearlyMap.set(t.year, { prices: [], total: 0, count: 0 });
      }
      const entry = yearlyMap.get(t.year)!;
      if (t.pricePerSqm > 0 && t.pricePerSqm < 100000) {
        entry.prices.push(t.pricePerSqm);
      }
      entry.total += t.totalPrice || 0;
      entry.count++;
    });

    return Array.from(yearlyMap.entries())
      .map(([year, entry]) => {
        const sortedPrices = entry.prices.sort((a, b) => a - b);
        const medianIdx = Math.floor(sortedPrices.length / 2);
        return {
          year,
          transactions: entry.count,
          totalValue: entry.total,
          avgPricePerSqm: entry.prices.length > 0 
            ? entry.prices.reduce((a, b) => a + b, 0) / entry.prices.length 
            : 0,
          medianPricePerSqm: sortedPrices.length > 0 
            ? (sortedPrices.length % 2 === 0 
                ? (sortedPrices[medianIdx - 1] + sortedPrices[medianIdx]) / 2 
                : sortedPrices[medianIdx])
            : 0,
        };
      })
      .sort((a, b) => a.year - b.year);
  }, [data, transactions, selectedType]);

  // Calculate multi-type comparison data
  const comparisonData = useMemo(() => {
    if (!transactions.length) return null;

    const years = [...new Set(transactions.map(t => t.year))].sort();
    
    return years.map(year => {
      const result: Record<string, number | string> = { year };
      
      // All residential
      const allRes = transactions.filter(t => t.year === year && t.assetCategory === "سكني");
      const allPrices = allRes.map(t => t.pricePerSqm).filter(p => p > 0 && p < 100000);
      const sortedAll = allPrices.sort((a, b) => a - b);
      result.All = sortedAll.length > 0 ? sortedAll[Math.floor(sortedAll.length / 2)] : 0;

      // By property type
      PROPERTY_TYPES.slice(1).forEach(type => {
        const filtered = transactions.filter(t => t.year === year && t.propertyType === type);
        const prices = filtered.map(t => t.pricePerSqm).filter(p => p > 0 && p < 100000);
        const sorted = prices.sort((a, b) => a - b);
        result[type] = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
      });

      return result;
    });
  }, [transactions]);

  const color = PROPERTY_TYPE_COLORS[selectedType] || "#f59e0b";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-1 flex-wrap">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  selectedType === type
                    ? "text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
                style={{
                  backgroundColor: selectedType === type ? PROPERTY_TYPE_COLORS[type] : undefined,
                }}
              >
                {type === "All" ? "All" : translate(type, "propertyType")}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            {selectedType === "All" && comparisonData ? (
              <LineChart
                data={comparisonData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#475569" }}
                />
                <YAxis
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
                    const nameStr = String(name || '');
                    return [
                      typeof value === 'number' ? `AED ${formatNumber(value)} /sqm` : '-',
                      nameStr === "All" ? "All Types" : translate(nameStr, "propertyType"),
                    ];
                  }}
                />
                <Legend
                  wrapperStyle={{ color: "#94a3b8" }}
                  formatter={(value: string) => {
                    if (value === "All") return "All Types";
                    return translate(value, "propertyType");
                  }}
                />
                {PROPERTY_TYPES.map((type) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={type}
                    name={type}
                    stroke={PROPERTY_TYPE_COLORS[type]}
                    strokeWidth={type === "All" ? 3 : 2}
                    dot={{ fill: PROPERTY_TYPE_COLORS[type], strokeWidth: 0, r: 4 }}
                    strokeDasharray={type === "All" ? undefined : "5 5"}
                  />
                ))}
              </LineChart>
            ) : (
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`colorAvg-${selectedType}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`colorMedian-${selectedType}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#475569" }}
                />
                <YAxis
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
                  formatter={(value) => [
                    typeof value === 'number' ? `AED ${formatNumber(value)} /sqm` : '-',
                  ]}
                />
                <Legend wrapperStyle={{ color: "#94a3b8" }} />
                <Area
                  type="monotone"
                  dataKey="avgPricePerSqm"
                  name="Average Price/sqm"
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#colorAvg-${selectedType})`}
                />
                <Area
                  type="monotone"
                  dataKey="medianPricePerSqm"
                  name="Median Price/sqm"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#colorMedian-${selectedType})`}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
