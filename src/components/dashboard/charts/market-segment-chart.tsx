"use client";

import { useMemo } from "react";
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
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumber, formatPercentage } from "@/lib/utils";
import { MarketSegmentData, Transaction } from "@/types";
import { translate } from "@/lib/translations";

interface MarketSegmentChartProps {
  saleTypeData: MarketSegmentData[];
  marketTypeData: MarketSegmentData[];
  transactions?: Transaction[];
}

// Segment translations
const SEGMENT_LABELS: Record<string, string> = {
  "جاهزة": "Ready",
  "على المخطط": "Off-Plan",
  "أمر محكمة": "Court Order",
  "أولي": "Primary",
  "ثانوي": "Secondary",
};

const SALE_TYPE_COLORS: Record<string, string> = {
  "جاهزة": "#14b8a6",
  "على المخطط": "#f59e0b",
  "أمر محكمة": "#ef4444",
};

const MARKET_TYPE_COLORS: Record<string, string> = {
  "أولي": "#3b82f6",
  "ثانوي": "#8b5cf6",
};

export function MarketSegmentChart({
  saleTypeData,
  marketTypeData,
  transactions = [],
}: MarketSegmentChartProps) {
  // Calculate yearly data for stacked bar charts
  const yearlySaleTypeData = useMemo(() => {
    if (!transactions.length) return null;

    const years = [...new Set(transactions.map(t => t.year))].sort();
    
    return years.map(year => {
      const yearTxns = transactions.filter(t => t.year === year);
      const total = yearTxns.length;
      
      const result: Record<string, number | string> = { year };
      
      // Count by sale type
      const typeCounts = new Map<string, number>();
      yearTxns.forEach(t => {
        const type = t.saleType;
        if (type) {
          typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
        }
      });

      Object.keys(SALE_TYPE_COLORS).forEach(type => {
        result[type] = typeCounts.get(type) || 0;
      });

      result.total = total;
      
      return result;
    });
  }, [transactions]);

  const yearlyMarketTypeData = useMemo(() => {
    if (!transactions.length) return null;

    const years = [...new Set(transactions.map(t => t.year))].sort();
    
    return years.map(year => {
      const yearTxns = transactions.filter(t => t.year === year);
      const total = yearTxns.length;
      
      const result: Record<string, number | string> = { year };
      
      // Count by market type
      const typeCounts = new Map<string, number>();
      yearTxns.forEach(t => {
        const type = t.marketType;
        if (type) {
          typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
        }
      });

      Object.keys(MARKET_TYPE_COLORS).forEach(type => {
        result[type] = typeCounts.get(type) || 0;
      });

      result.total = total;
      
      return result;
    });
  }, [transactions]);

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
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {yearlySaleTypeData ? (
                <BarChart data={yearlySaleTypeData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
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
                      const label = name ? (SEGMENT_LABELS[name] || name) : '';
                      return [typeof value === 'number' ? formatNumber(value) : '-', label];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: "#94a3b8" }}
                    formatter={(value: string) => SEGMENT_LABELS[value] || value}
                  />
                  {Object.entries(SALE_TYPE_COLORS).map(([type, color]) => (
                    <Bar
                      key={type}
                      dataKey={type}
                      name={type}
                      stackId="sale"
                      fill={color}
                    />
                  ))}
                </BarChart>
              ) : (
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
                    formatter={(value, _, props) => {
                      const pct = (props as { payload?: { percentage?: number } })?.payload?.percentage;
                      return [
                        typeof value === 'number' 
                          ? `${formatNumber(value)} (${typeof pct === 'number' ? pct.toFixed(1) : '0'}%)`
                          : '-',
                        "Transactions",
                      ];
                    }}
                  />
                  <Bar dataKey="transactions" radius={[4, 4, 0, 0]}>
                    {saleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SALE_TYPE_COLORS[saleTypeData[index]?.segment] || "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Market Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {yearlyMarketTypeData ? (
                <BarChart data={yearlyMarketTypeData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
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
                      const label = name ? (SEGMENT_LABELS[name] || name) : '';
                      return [typeof value === 'number' ? formatNumber(value) : '-', label];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: "#94a3b8" }}
                    formatter={(value: string) => SEGMENT_LABELS[value] || value}
                  />
                  {Object.entries(MARKET_TYPE_COLORS).map(([type, color]) => (
                    <Bar
                      key={type}
                      dataKey={type}
                      name={type}
                      stackId="market"
                      fill={color}
                    />
                  ))}
                </BarChart>
              ) : (
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
                    formatter={(value, _, props) => {
                      const pct = (props as { payload?: { percentage?: number } })?.payload?.percentage;
                      return [
                        typeof value === 'number' 
                          ? `${formatNumber(value)} (${typeof pct === 'number' ? pct.toFixed(1) : '0'}%)`
                          : '-',
                        "Transactions",
                      ];
                    }}
                  />
                  <Bar dataKey="transactions" radius={[4, 4, 0, 0]}>
                    {marketData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MARKET_TYPE_COLORS[marketTypeData[index]?.segment] || "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
