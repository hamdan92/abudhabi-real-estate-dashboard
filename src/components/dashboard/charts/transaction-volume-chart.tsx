"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { YearlyData, Transaction } from "@/types";
import { translate } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface TransactionVolumeChartProps {
  data: YearlyData[];
  transactions?: Transaction[];
  title?: string;
}

// Property type colors - using actual Arabic characters from data
const PROPERTY_TYPE_COLORS: Record<string, string> = {
  "شقة": "#3b82f6",
  "ڨيلا": "#10b981",
  "تاونهاوس / ڨيلا شبه منفصلة": "#8b5cf6",
  "أرض لڨيلا": "#ef4444",
  "أخرى": "#94a3b8",
};

const VIEW_MODES = ["Combined", "Stacked by Type"] as const;
type ViewMode = typeof VIEW_MODES[number];

export function TransactionVolumeChart({
  data,
  transactions = [],
  title = "Transaction Volume & Value",
}: TransactionVolumeChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("Combined");

  // Calculate stacked data by property type
  const stackedData = useMemo(() => {
    if (!transactions.length) return null;

    const years = [...new Set(transactions.map(t => t.year))].sort();
    const residentialTxns = transactions.filter(t => t.assetCategory === "سكني");
    
    return years.map(year => {
      const yearTxns = residentialTxns.filter(t => t.year === year);
      
      const result: Record<string, number> = { year };
      
      // Count by property type
      const typeCounts = new Map<string, number>();
      yearTxns.forEach(t => {
        const type = t.propertyType;
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      });

      // Map to main types
      Object.keys(PROPERTY_TYPE_COLORS).forEach(type => {
        if (type === "أخرى") {
          // Sum all other types
          let other = 0;
          typeCounts.forEach((count, t) => {
            if (!Object.keys(PROPERTY_TYPE_COLORS).includes(t) || t === "أخرى") {
              other += count;
            }
          });
          result[type] = other;
        } else {
          result[type] = typeCounts.get(type) || 0;
        }
      });

      // Total value for the line
      result.totalValue = yearTxns.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
      
      return result;
    });
  }, [transactions]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-1">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  viewMode === mode
                    ? "bg-blue-500 text-white"
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
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "Combined" ? (
              <ComposedChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="year"
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
                  tickFormatter={(value) => `${(value / 1_000_000_000).toFixed(0)}B`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f1f5f9" }}
                  formatter={(value: number, name: string) => {
                    if (name === "Transactions") {
                      return [formatNumber(value), name];
                    }
                    return [formatCurrency(value, true), name];
                  }}
                />
                <Legend wrapperStyle={{ color: "#94a3b8" }} />
                <Bar
                  yAxisId="left"
                  dataKey="transactions"
                  name="Transactions"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalValue"
                  name="Total Value (AED)"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: "#f59e0b", strokeWidth: 2 }}
                />
              </ComposedChart>
            ) : stackedData ? (
              <ComposedChart
                data={stackedData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="year"
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
                  tickFormatter={(value) => `${(value / 1_000_000_000).toFixed(0)}B`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f1f5f9" }}
                  formatter={(value: number, name: string) => {
                    if (name === "Total Value (AED)") {
                      return [formatCurrency(value, true), name];
                    }
                    return [formatNumber(value), translate(name, "propertyType")];
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: "#94a3b8" }} 
                  formatter={(value: string) => {
                    if (value === "Total Value (AED)") return value;
                    return translate(value, "propertyType");
                  }}
                />
                {Object.entries(PROPERTY_TYPE_COLORS).map(([type, color]) => (
                  <Bar
                    key={type}
                    yAxisId="left"
                    dataKey={type}
                    name={type}
                    stackId="types"
                    fill={color}
                  />
                ))}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalValue"
                  name="Total Value (AED)"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: "#f59e0b", strokeWidth: 2 }}
                />
              </ComposedChart>
            ) : null}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
