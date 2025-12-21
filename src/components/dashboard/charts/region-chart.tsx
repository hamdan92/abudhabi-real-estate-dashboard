"use client";

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
import { RegionData } from "@/types";
import { translate } from "@/lib/translations";

interface RegionChartProps {
  data: RegionData[];
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

export function RegionChart({
  data,
  title = "Top Regions",
  metric = "transactions",
  limit = 10,
}: RegionChartProps) {
  const chartData = data.slice(0, limit);

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
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

