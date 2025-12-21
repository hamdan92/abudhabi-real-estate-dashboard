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
import { formatNumber, formatPercentage } from "@/lib/utils";
import { MarketSegmentData } from "@/types";

interface MarketSegmentChartProps {
  saleTypeData: MarketSegmentData[];
  marketTypeData: MarketSegmentData[];
}

// Segment translations
const SEGMENT_LABELS: Record<string, string> = {
  "جاهزة": "Ready",
  "على المخطط": "Off-Plan",
  "أمر محكمة": "Court Order",
  "أولي": "Primary",
  "ثانوي": "Secondary",
};

const COLORS = {
  sale: ["#14b8a6", "#f59e0b", "#ef4444"],
  market: ["#3b82f6", "#8b5cf6"],
};

export function MarketSegmentChart({
  saleTypeData,
  marketTypeData,
}: MarketSegmentChartProps) {
  const saleData = saleTypeData.map((item) => ({
    ...item,
    name: SEGMENT_LABELS[item.segment] || item.segment,
  }));

  const marketData = marketTypeData.map((item) => ({
    ...item,
    name: SEGMENT_LABELS[item.segment] || item.segment,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Sale Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={saleData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
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
                  formatter={(value: number, _: string, props: { payload: { percentage: number } }) => [
                    `${formatNumber(value)} (${props.payload.percentage.toFixed(1)}%)`,
                    "Transactions",
                  ]}
                />
                <Bar dataKey="transactions" radius={[4, 4, 0, 0]}>
                  {saleData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.sale[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Market Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
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
                  formatter={(value: number, _: string, props: { payload: { percentage: number } }) => [
                    `${formatNumber(value)} (${props.payload.percentage.toFixed(1)}%)`,
                    "Transactions",
                  ]}
                />
                <Bar dataKey="transactions" radius={[4, 4, 0, 0]}>
                  {marketData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.market[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

