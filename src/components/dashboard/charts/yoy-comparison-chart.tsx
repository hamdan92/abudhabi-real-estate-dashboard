"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { formatNumber, formatPercentage } from "@/lib/utils";
import { YearlyData } from "@/types";
import { TrendingUp, TrendingDown } from "lucide-react";

interface YoYComparisonChartProps {
  data: YearlyData[];
  metric?: "avgPricePerSqm" | "medianPricePerSqm" | "transactions" | "totalValue";
  title?: string;
}

export function YoYComparisonChart({
  data,
  metric = "medianPricePerSqm",
  title = "Year-over-Year Price Growth",
}: YoYComparisonChartProps) {
  // Calculate YoY changes
  const yoyData = data.slice(1).map((item, index) => {
    const prevYear = data[index];
    const currentValue = item[metric] as number;
    const prevValue = prevYear[metric] as number;
    const change = ((currentValue - prevValue) / prevValue) * 100;

    return {
      year: item.year,
      currentValue,
      prevValue,
      change,
      isPositive: change >= 0,
    };
  });

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

  const avgGrowth = yoyData.reduce((sum, d) => sum + d.change, 0) / yoyData.length;

  return (
    <Card>
      <CardHeader>
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
        <div className="h-[300px]">
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
              {formatPercentage(
                (Math.pow(data[data.length - 1][metric] as number / (data[0][metric] as number), 1 / (data.length - 1)) - 1) * 100
              )}
            </p>
            <p className="text-xs text-slate-500">
              {data[0].year}-{data[data.length - 1].year}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

