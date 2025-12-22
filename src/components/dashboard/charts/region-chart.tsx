"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { RegionData, Transaction } from "@/types";
import { translate } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { average, median } from "@/lib/utils";

interface RegionChartProps {
  data: RegionData[];
  transactions?: Transaction[];
  title?: string;
  metric?: "transactions" | "avgPricePerSqm" | "totalValue";
  limit?: number;
}

const COLORS = [
  "#f59e0b",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#22c55e",
  "#06b6d4",
  "#f97316",
  "#6366f1",
];

// Using actual Arabic characters from data
const PROPERTY_TYPES = ["All", "شقة", "ڨيلا", "تاونهاوس / ڨيلا شبه منفصلة", "أرض لڨيلا"];

const PROPERTY_TYPE_COLORS: Record<string, string> = {
  "All": "#f59e0b",
  "شقة": "#3b82f6",
  "ڨيلا": "#10b981",
  "تاونهاوس / ڨيلا شبه منفصلة": "#8b5cf6",
  "أرض لڨيلا": "#ef4444",
};

export function RegionChart({
  data,
  transactions = [],
  title = "Top Regions",
  metric = "transactions",
  limit = 10,
}: RegionChartProps) {
  const [selectedType, setSelectedType] = useState<string>("All");

  // Calculate data filtered by property type
  const chartData = useMemo(() => {
    if (selectedType === "All" || !transactions.length) {
      return data.slice(0, limit);
    }

    // Filter transactions by property type
    const filtered = transactions.filter(t => 
      t.propertyType === selectedType && 
      t.assetCategory === "سكني"
    );

    if (filtered.length === 0) return data.slice(0, limit);

    // Group by region
    const regionMap = new Map<string, {
      transactions: number;
      totalValue: number;
      prices: number[];
    }>();

    filtered.forEach(t => {
      if (!regionMap.has(t.region)) {
        regionMap.set(t.region, { transactions: 0, totalValue: 0, prices: [] });
      }
      const entry = regionMap.get(t.region)!;
      entry.transactions++;
      entry.totalValue += t.totalPrice || 0;
      if (t.pricePerSqm > 0 && t.pricePerSqm < 100000) {
        entry.prices.push(t.pricePerSqm);
      }
    });

    // Convert to array and sort by metric
    const result = Array.from(regionMap.entries())
      .map(([region, entry]) => ({
        region,
        regionEn: translate(region, 'region'),
        transactions: entry.transactions,
        totalValue: entry.totalValue,
        avgPricePerSqm: entry.prices.length > 0 
          ? entry.prices.reduce((a, b) => a + b, 0) / entry.prices.length 
          : 0,
        medianPricePerSqm: 0,
        yoyGrowth: 0,
      }))
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, limit);

    return result;
  }, [data, transactions, selectedType, metric, limit]);

  const getMetricLabel = () => {
    switch (metric) {
      case "transactions":
        return "Transactions";
      case "avgPricePerSqm":
        return "Avg Price/sqm (AED)";
      case "totalValue":
        return "Total Value (AED)";
      default:
        return "";
    }
  };

  const formatValue = (value: number) => {
    switch (metric) {
      case "transactions":
        return formatNumber(value);
      case "avgPricePerSqm":
        return `AED ${formatNumber(value)}`;
      case "totalValue":
        return formatCurrency(value, true);
      default:
        return String(value);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
          {transactions.length > 0 && (
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
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 10, right: 30, left: 100, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={{ stroke: "#475569" }}
                tickFormatter={(value) => {
                  if (metric === "totalValue") {
                    return `${(value / 1_000_000_000).toFixed(0)}B`;
                  }
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(0)}K`;
                  }
                  return String(value);
                }}
              />
              <YAxis
                type="category"
                dataKey="regionEn"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "#475569" }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f1f5f9" }}
                formatter={(value: number) => [formatValue(value), getMetricLabel()]}
              />
              <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={selectedType === "All" ? COLORS[index % COLORS.length] : PROPERTY_TYPE_COLORS[selectedType]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
