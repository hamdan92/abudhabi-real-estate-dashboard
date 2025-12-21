"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyTypeAnalysis } from "@/types";
import { translate } from "@/lib/translations";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Building2 } from "lucide-react";

interface PropertyTypeAnalysisChartProps {
  data: PropertyTypeAnalysis[];
}

const COLORS = [
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
];

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toFixed(0);
}

function formatCurrency(value: number): string {
  return `AED ${formatNumber(value)}`;
}

export function PropertyTypeAnalysisChart({ data }: PropertyTypeAnalysisChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Property Type Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare trend data for line chart
  const allYears = [...new Set(data.flatMap((d) => d.yearlyData.map((y) => y.year)))].sort();
  const trendData = allYears.map((year) => {
    const point: Record<string, number | string> = { year };
    data.forEach((type) => {
      const yearData = type.yearlyData.find((y) => y.year === year);
      if (yearData) {
        point[type.typeEn] = yearData.avgPricePerSqm;
      }
    });
    return point;
  });

  // Prepare growth comparison data
  const growthData = data
    .filter((d) => d.totalTransactions > 100)
    .map((d) => ({
      type: d.typeEn,
      yoyGrowth: d.yoyGrowth,
      cagr: d.cagr,
      volume: d.totalTransactions,
    }))
    .sort((a, b) => b.yoyGrowth - a.yoyGrowth);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.slice(0, 4).map((type, idx) => (
          <Card key={type.type} className="bg-slate-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-xs text-slate-400">{type.marketShare.toFixed(1)}% share</span>
              </div>
              <h4 className="text-sm font-medium text-slate-200 mb-1">{type.typeEn}</h4>
              <p className="text-lg font-bold text-white">
                AED {type.avgPricePerSqm.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span className="text-xs text-slate-400">/sqm</span>
              </p>
              <div className="flex items-center gap-1 mt-1">
                {type.yoyGrowth > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : type.yoyGrowth < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-400" />
                )}
                <span
                  className={`text-sm ${
                    type.yoyGrowth > 0
                      ? "text-emerald-400"
                      : type.yoyGrowth < 0
                      ? "text-red-400"
                      : "text-slate-400"
                  }`}
                >
                  {type.yoyGrowth > 0 ? "+" : ""}
                  {type.yoyGrowth.toFixed(1)}% YoY
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Price Trend by Property Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-5 h-5 text-amber-400" />
            Price Trend by Property Type
          </CardTitle>
          <p className="text-sm text-slate-400">
            Average price per sqm over time by unit type
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(v) => formatCurrency(v)}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [
                    `AED ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                    "",
                  ]}
                  labelStyle={{ color: "#f8fafc" }}
                />
                <Legend />
                {data.slice(0, 6).map((type, idx) => (
                  <Line
                    key={type.typeEn}
                    type="monotone"
                    dataKey={type.typeEn}
                    name={type.typeEn}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* YoY Growth Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Growth Comparison by Property Type</CardTitle>
          <p className="text-sm text-slate-400">
            Year-over-Year price growth (%) - Compare which property types are appreciating fastest
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="typeEn" stroke="#94a3b8" width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`,
                    name === "yoyGrowth" ? "YoY Growth" : "3Y CAGR",
                  ]}
                />
                <Bar dataKey="yoyGrowth" name="YoY Growth" radius={[0, 4, 4, 0]}>
                  {growthData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.yoyGrowth >= 0 ? "#10b981" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property Type Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-2 text-slate-400 font-medium">Type</th>
                  <th className="text-right py-3 px-2 text-slate-400 font-medium">Transactions</th>
                  <th className="text-right py-3 px-2 text-slate-400 font-medium">Avg Price/sqm</th>
                  <th className="text-right py-3 px-2 text-slate-400 font-medium">YoY Growth</th>
                  <th className="text-right py-3 px-2 text-slate-400 font-medium">CAGR</th>
                  <th className="text-right py-3 px-2 text-slate-400 font-medium">Market Share</th>
                </tr>
              </thead>
              <tbody>
                {data.map((type, idx) => (
                  <tr key={type.type} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-slate-200">{type.typeEn}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2 text-slate-300">
                      {type.totalTransactions.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-2 text-slate-300">
                      AED {type.avgPricePerSqm.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="text-right py-3 px-2">
                      <span
                        className={
                          type.yoyGrowth > 0
                            ? "text-emerald-400"
                            : type.yoyGrowth < 0
                            ? "text-red-400"
                            : "text-slate-400"
                        }
                      >
                        {type.yoyGrowth > 0 ? "+" : ""}
                        {type.yoyGrowth.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-2">
                      <span
                        className={
                          type.cagr > 0
                            ? "text-emerald-400"
                            : type.cagr < 0
                            ? "text-red-400"
                            : "text-slate-400"
                        }
                      >
                        {type.cagr > 0 ? "+" : ""}
                        {type.cagr.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-2 text-slate-300">
                      {type.marketShare.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

