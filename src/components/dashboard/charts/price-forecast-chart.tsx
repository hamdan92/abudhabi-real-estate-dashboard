"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { YearlyData } from "@/types";
import { forecastValues } from "@/lib/forecasting";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface PriceForecastChartProps {
  data: YearlyData[];
  title?: string;
}

export function PriceForecastChart({
  data,
  title = "Price Forecast (2026-2028)",
}: PriceForecastChartProps) {
  const forecastResult = forecastValues(data, 3);
  const forecasts = forecastResult.forecasts;

  // Combine historical and forecast data
  const chartData = [
    ...data.map((d) => ({
      year: d.year,
      actual: d.medianPricePerSqm,
      forecast: null as number | null,
      upperBound: null as number | null,
      lowerBound: null as number | null,
      type: "historical",
    })),
    // Add last actual point to forecast to connect lines
    {
      year: data[data.length - 1].year,
      actual: data[data.length - 1].medianPricePerSqm,
      forecast: data[data.length - 1].medianPricePerSqm,
      upperBound: data[data.length - 1].medianPricePerSqm,
      lowerBound: data[data.length - 1].medianPricePerSqm,
      type: "bridge",
    },
    ...forecasts.map((f) => ({
      year: f.year,
      actual: null as number | null,
      forecast: f.predictedPrice,
      upperBound: f.upperBound,
      lowerBound: f.lowerBound,
      type: "forecast",
    })),
  ];

  // Calculate key metrics
  const lastActual = data[data.length - 1].medianPricePerSqm;
  const forecastEnd = forecasts[forecasts.length - 1].predictedPrice;
  const totalGrowth = ((forecastEnd - lastActual) / lastActual) * 100;
  const avgAnnualGrowth = totalGrowth / forecasts.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            {avgAnnualGrowth > 5 ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : avgAnnualGrowth > 0 ? (
              <CheckCircle className="w-5 h-5 text-amber-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <span className={`text-sm font-medium ${avgAnnualGrowth > 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {avgAnnualGrowth > 0 ? "+" : ""}{avgAnnualGrowth.toFixed(1)}%/year
            </span>
          </div>
        </CardTitle>
        <CardDescription>
          Projected median price/sqm based on historical trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
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
                formatter={(value: number | null, name: string) => {
                  if (value === null) return ["-", name];
                  return [`AED ${formatNumber(value)}`, name];
                }}
              />
              <Legend wrapperStyle={{ color: "#94a3b8" }} />
              
              {/* Confidence band for forecast */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="#22c55e"
                fillOpacity={0.1}
                name="Upper Bound"
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="none"
                fill="#1e293b"
                fillOpacity={1}
                name="Lower Bound"
                connectNulls={false}
              />
              
              {/* Reference line at current year */}
              <ReferenceLine
                x={data[data.length - 1].year}
                stroke="#64748b"
                strokeDasharray="3 3"
                label={{
                  value: "Now",
                  position: "top",
                  fill: "#64748b",
                  fontSize: 11,
                }}
              />
              
              {/* Historical data */}
              <Line
                type="monotone"
                dataKey="actual"
                name="Historical"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: "#f59e0b", r: 4 }}
                connectNulls={false}
              />
              
              {/* Forecast data */}
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast"
                stroke="#22c55e"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ fill: "#22c55e", r: 4 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
          {forecasts.map((f) => (
            <div
              key={f.year}
              className={`text-center p-3 rounded-lg ${
                f.confidence === "high"
                  ? "bg-emerald-500/10"
                  : f.confidence === "medium"
                  ? "bg-amber-500/10"
                  : "bg-slate-800"
              }`}
            >
              <p className="text-sm text-slate-400">{f.year}</p>
              <p className="text-xl font-bold text-white">
                AED {(f.predictedPrice / 1000).toFixed(1)}K
              </p>
              <p className={`text-xs ${
                f.confidence === "high"
                  ? "text-emerald-400"
                  : f.confidence === "medium"
                  ? "text-amber-400"
                  : "text-slate-400"
              }`}>
                {f.confidence} confidence
              </p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 mt-4 text-center">
          * Forecasts are based on historical trend analysis and should not be considered financial advice.
          Actual results may vary significantly due to market conditions.
        </p>
      </CardContent>
    </Card>
  );
}

