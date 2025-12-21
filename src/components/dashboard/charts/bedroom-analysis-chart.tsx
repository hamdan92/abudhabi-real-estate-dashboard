"use client";

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
import { BedroomData } from "@/types";

interface BedroomAnalysisChartProps {
  data: BedroomData[];
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

export function BedroomAnalysisChart({
  data,
  title = "Bedroom Configuration Analysis",
}: BedroomAnalysisChartProps) {
  // Filter and sort data
  const chartData = data
    .filter((d) => BEDROOM_ORDER.includes(d.bedrooms))
    .sort((a, b) => BEDROOM_ORDER.indexOf(a.bedrooms) - BEDROOM_ORDER.indexOf(b.bedrooms))
    .map((d) => ({
      ...d,
      label: BEDROOM_LABELS[d.bedrooms] || d.bedrooms,
    }));

  // Find insights
  const mostPopular = chartData.reduce((max, d) => d.count > max.count ? d : max, chartData[0]);
  const highestPrice = chartData.reduce((max, d) => d.avgPricePerSqm > max.avgPricePerSqm ? d : max, chartData[0]);
  const bestValue = chartData.reduce((best, d) => {
    const valueScore = d.avgArea / d.avgPricePerSqm;
    const bestScore = best.avgArea / best.avgPricePerSqm;
    return valueScore > bestScore ? d : best;
  }, chartData[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Transaction count and average price by bedroom configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                formatter={(value: number, name: string) => {
                  if (name === "Transactions") return [formatNumber(value), name];
                  if (name === "Avg Price/SQM") return [`AED ${formatNumber(value)}`, name];
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ color: "#94a3b8" }} />
              <Bar
                yAxisId="left"
                dataKey="count"
                name="Transactions"
                fill="#3b82f6"
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
              {BEDROOM_LABELS[mostPopular?.bedrooms] || mostPopular?.bedrooms}
            </p>
            <p className="text-xs text-slate-500">
              {formatNumber(mostPopular?.count || 0)} transactions
            </p>
          </div>
          <div className="text-center p-3 bg-amber-500/10 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">Premium Segment</p>
            <p className="text-lg font-bold text-amber-400">
              {BEDROOM_LABELS[highestPrice?.bedrooms] || highestPrice?.bedrooms}
            </p>
            <p className="text-xs text-slate-500">
              AED {formatNumber(highestPrice?.avgPricePerSqm || 0)}/sqm
            </p>
          </div>
          <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">Best Value</p>
            <p className="text-lg font-bold text-emerald-400">
              {BEDROOM_LABELS[bestValue?.bedrooms] || bestValue?.bedrooms}
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
      </CardContent>
    </Card>
  );
}

