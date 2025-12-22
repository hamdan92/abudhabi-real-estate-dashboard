"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { formatPercentage } from "@/lib/utils";
import { YearlyData, Transaction } from "@/types";
import { TrendingUp, TrendingDown } from "lucide-react";
import { translate } from "@/lib/translations";

interface YoYComparisonChartProps {
  data: YearlyData[];
  transactions?: Transaction[];
  metric?: "avgPricePerSqm" | "medianPricePerSqm" | "transactions" | "totalValue";
  title?: string;
  showPropertyTypeTabs?: boolean;
}

// Property type tabs configuration
const PROPERTY_TYPE_TABS = [
  { id: "all", label: "All", arabicFilter: null },
  { id: "apartment", label: "Apartment", arabicFilter: "شقة" },
  { id: "villa", label: "Villa", arabicFilter: "ڨيلا" },
  { id: "townhouse", label: "Townhouse", arabicFilter: "تاونهاوس / ڨيلا شبه منفصلة" },
];

export function YoYComparisonChart({
  data,
  transactions,
  metric = "medianPricePerSqm",
  title = "Year-over-Year Price Growth",
  showPropertyTypeTabs = false,
}: YoYComparisonChartProps) {
  const [selectedPropertyType, setSelectedPropertyType] = useState("all");

  // Calculate data filtered by property type
  const filteredData = useMemo(() => {
    if (!showPropertyTypeTabs || selectedPropertyType === "all" || !transactions) {
      return data;
    }

    const selectedTab = PROPERTY_TYPE_TABS.find(t => t.id === selectedPropertyType);
    if (!selectedTab?.arabicFilter) return data;

    // Filter transactions by property type
    const filteredTxns = transactions.filter(
      t => t.propertyType === selectedTab.arabicFilter && t.assetCategory === "سكني"
    );

    // Group by year and calculate metrics
    const yearlyMap = new Map<number, { prices: number[]; count: number; value: number }>();
    
    filteredTxns.forEach(t => {
      const year = t.year;
      if (!yearlyMap.has(year)) {
        yearlyMap.set(year, { prices: [], count: 0, value: 0 });
      }
      const yearData = yearlyMap.get(year)!;
      if (t.pricePerSqm > 0) {
        yearData.prices.push(t.pricePerSqm);
      }
      yearData.count++;
      yearData.value += t.totalPrice;
    });

    // Convert to YearlyData format
    return data.map(d => {
      const yearStats = yearlyMap.get(d.year);
      if (!yearStats || yearStats.prices.length === 0) {
        return { ...d, medianPricePerSqm: 0, avgPricePerSqm: 0, transactions: 0, totalValue: 0 };
      }
      
      const sortedPrices = [...yearStats.prices].sort((a, b) => a - b);
      const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
      const avg = sortedPrices.reduce((a, b) => a + b, 0) / sortedPrices.length;
      
      return {
        ...d,
        medianPricePerSqm: median,
        avgPricePerSqm: avg,
        transactions: yearStats.count,
        totalValue: yearStats.value,
      };
    }).filter(d => (d[metric] as number) > 0);
  }, [data, transactions, selectedPropertyType, showPropertyTypeTabs, metric]);

  // Calculate YoY changes
  const yoyData = useMemo(() => {
    if (filteredData.length < 2) return [];
    
    return filteredData.slice(1).map((item, index) => {
      const prevYear = filteredData[index];
      const currentValue = item[metric] as number;
      const prevValue = prevYear[metric] as number;
      const change = prevValue > 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;

      return {
        year: item.year,
        currentValue,
        prevValue,
        change,
        isPositive: change >= 0,
      };
    });
  }, [filteredData, metric]);

  const getMetricLabel = () => {
    switch (metric) {
      case "avgPricePerSqm":
        return "Avg Price/SQM";
      case "medianPricePerSqm":
        return "Median Price/SQM";
      case "transactions":
        return "Transactions";
      case "totalValue":
        return "Total Value";
      default:
        return "";
    }
  };

  const avgGrowth = yoyData.length > 0 
    ? yoyData.reduce((sum, d) => sum + d.change, 0) / yoyData.length 
    : 0;

  // Calculate CAGR
  const cagr = useMemo(() => {
    if (filteredData.length < 2) return 0;
    const firstValue = filteredData[0][metric] as number;
    const lastValue = filteredData[filteredData.length - 1][metric] as number;
    if (firstValue <= 0) return 0;
    return (Math.pow(lastValue / firstValue, 1 / (filteredData.length - 1)) - 1) * 100;
  }, [filteredData, metric]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className={`flex items-center gap-1 text-sm ${avgGrowth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {avgGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>Avg: {formatPercentage(avgGrowth)}</span>
          </div>
        </CardTitle>
        <CardDescription>
          {getMetricLabel()} growth compared to previous year
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Property Type Tabs */}
        {showPropertyTypeTabs && (
          <div className="flex gap-1 mb-4 p-1 bg-slate-800/50 rounded-lg w-fit">
            {PROPERTY_TYPE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedPropertyType(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedPropertyType === tab.id
                    ? "bg-amber-500 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {yoyData.length > 0 ? (
          <>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yoyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                    formatter={(value: number) => [formatPercentage(value), "YoY Change"]}
                  />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                  <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                    {yoyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isPositive ? "#22c55e" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
              <div className="text-center">
                <p className="text-sm text-slate-400">Best Year</p>
                <p className="text-lg font-bold text-emerald-400">
                  {yoyData.reduce((best, d) => d.change > best.change ? d : best, yoyData[0])?.year}
                </p>
                <p className="text-xs text-slate-500">
                  {formatPercentage(Math.max(...yoyData.map(d => d.change)))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">Worst Year</p>
                <p className="text-lg font-bold text-rose-400">
                  {yoyData.reduce((worst, d) => d.change < worst.change ? d : worst, yoyData[0])?.year}
                </p>
                <p className="text-xs text-slate-500">
                  {formatPercentage(Math.min(...yoyData.map(d => d.change)))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">CAGR</p>
                <p className="text-lg font-bold text-amber-400">
                  {formatPercentage(cagr)}
                </p>
                <p className="text-xs text-slate-500">
                  {filteredData[0]?.year}-{filteredData[filteredData.length - 1]?.year}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-slate-500">
            No data available for this property type
          </div>
        )}
      </CardContent>
    </Card>
  );
}
