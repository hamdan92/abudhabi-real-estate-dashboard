"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaleTypeAnalysis, ReadyVsOffPlanComparison } from "@/types";
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
  ComposedChart,
  Area,
} from "recharts";
import { Home, TrendingUp, TrendingDown, ArrowRightLeft, Info } from "lucide-react";

interface SaleTypeAnalysisChartProps {
  saleTypeData: SaleTypeAnalysis[];
  readyVsOffPlan: ReadyVsOffPlanComparison[];
}

const READY_COLOR = "#10b981"; // emerald
const OFFPLAN_COLOR = "#f59e0b"; // amber

function formatCurrency(value: number): string {
  if (value >= 1000000) return `AED ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `AED ${(value / 1000).toFixed(0)}K`;
  return `AED ${value.toFixed(0)}`;
}

export function SaleTypeAnalysisChart({
  saleTypeData,
  readyVsOffPlan,
}: SaleTypeAnalysisChartProps) {
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("all");

  if (!saleTypeData || saleTypeData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-amber-400" />
            Ready vs Off-Plan Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const readyData = saleTypeData.find((s) => s.saleTypeEn === "Ready");
  const offPlanData = saleTypeData.find((s) => s.saleTypeEn === "Off-Plan");

  // Prepare price trend comparison
  const allYears = [
    ...new Set([
      ...(readyData?.yearlyData.map((y) => y.year) || []),
      ...(offPlanData?.yearlyData.map((y) => y.year) || []),
    ]),
  ].sort();

  const trendData = allYears.map((year) => {
    const ready = readyData?.yearlyData.find((y) => y.year === year);
    const offPlan = offPlanData?.yearlyData.find((y) => y.year === year);
    return {
      year,
      Ready: ready?.avgPricePerSqm || 0,
      "Off-Plan": offPlan?.avgPricePerSqm || 0,
      ReadyVolume: ready?.transactions || 0,
      OffPlanVolume: offPlan?.transactions || 0,
      premium:
        ready && offPlan && offPlan.avgPricePerSqm > 0
          ? ((ready.avgPricePerSqm - offPlan.avgPricePerSqm) / offPlan.avgPricePerSqm) * 100
          : 0,
    };
  });

  // Market share trend
  const marketShareData = allYears.map((year) => {
    const ready = readyData?.yearlyData.find((y) => y.year === year);
    const offPlan = offPlanData?.yearlyData.find((y) => y.year === year);
    const total = (ready?.transactions || 0) + (offPlan?.transactions || 0);
    return {
      year,
      Ready: total > 0 ? ((ready?.transactions || 0) / total) * 100 : 0,
      "Off-Plan": total > 0 ? ((offPlan?.transactions || 0) / total) * 100 : 0,
    };
  });

  // Filter comparison data by property type
  const propertyTypes = [...new Set(readyVsOffPlan.map((r) => r.propertyType))];
  const filteredComparison =
    selectedPropertyType === "all"
      ? readyVsOffPlan
      : readyVsOffPlan.filter((r) => r.propertyType === selectedPropertyType);

  // Prepare comparison data for chart
  const comparisonChartData = filteredComparison
    .filter((r) => r.ready && r.offPlan)
    .slice(0, 15)
    .map((r) => ({
      region: r.region,
      regionEn: r.regionEn,
      Ready: r.ready?.avgPricePerSqm || 0,
      "Off-Plan": r.offPlan?.avgPricePerSqm || 0,
      premium: r.pricePremium,
    }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ready Summary */}
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-400">Ready Properties</span>
            </div>
            {readyData && (
              <>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(readyData.avgPricePerSqm)}
                  <span className="text-sm text-slate-400">/sqm</span>
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-slate-400">
                    {readyData.totalTransactions.toLocaleString()} txns
                  </span>
                  <span
                    className={
                      readyData.yoyGrowth >= 0 ? "text-emerald-400" : "text-red-400"
                    }
                  >
                    {readyData.yoyGrowth >= 0 ? "+" : ""}
                    {readyData.yoyGrowth.toFixed(1)}% YoY
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {readyData.marketShare.toFixed(1)}% market share • CAGR:{" "}
                  {readyData.cagr.toFixed(1)}%
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Off-Plan Summary */}
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-400">Off-Plan Properties</span>
            </div>
            {offPlanData && (
              <>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(offPlanData.avgPricePerSqm)}
                  <span className="text-sm text-slate-400">/sqm</span>
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-slate-400">
                    {offPlanData.totalTransactions.toLocaleString()} txns
                  </span>
                  <span
                    className={
                      offPlanData.yoyGrowth >= 0 ? "text-emerald-400" : "text-red-400"
                    }
                  >
                    {offPlanData.yoyGrowth >= 0 ? "+" : ""}
                    {offPlanData.yoyGrowth.toFixed(1)}% YoY
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {offPlanData.marketShare.toFixed(1)}% market share • CAGR:{" "}
                  {offPlanData.cagr.toFixed(1)}%
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Premium Comparison */}
        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Price Differential</span>
            </div>
            {readyData && offPlanData && (
              <>
                <p className="text-2xl font-bold text-white">
                  {readyData.avgPricePerSqm > offPlanData.avgPricePerSqm ? "+" : "-"}
                  {Math.abs(
                    ((readyData.avgPricePerSqm - offPlanData.avgPricePerSqm) /
                      offPlanData.avgPricePerSqm) *
                      100
                  ).toFixed(1)}
                  %
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Ready {readyData.avgPricePerSqm > offPlanData.avgPricePerSqm ? "premium" : "discount"} vs Off-Plan
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                  <Info className="w-3 h-3" />
                  <span>
                    AED{" "}
                    {Math.abs(
                      readyData.avgPricePerSqm - offPlanData.avgPricePerSqm
                    ).toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                    difference
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Price Trend Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Price Trend: Ready vs Off-Plan</CardTitle>
          <p className="text-sm text-slate-400">
            Average price per sqm over time - Compare appreciation rates
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis
                  yAxisId="price"
                  stroke="#94a3b8"
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  orientation="left"
                />
                <YAxis
                  yAxisId="premium"
                  stroke="#3b82f6"
                  tickFormatter={(v) => `${v}%`}
                  orientation="right"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "premium") return [`${value.toFixed(1)}%`, "Ready Premium"];
                    return [
                      `AED ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                      name,
                    ];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="Ready"
                  stroke={READY_COLOR}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="Off-Plan"
                  stroke={OFFPLAN_COLOR}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Area
                  yAxisId="premium"
                  type="monotone"
                  dataKey="premium"
                  name="Ready Premium %"
                  stroke="#3b82f6"
                  fill="#3b82f620"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Market Share Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Market Share Trend</CardTitle>
          <p className="text-sm text-slate-400">
            Percentage of transactions - Is market shifting towards ready or off-plan?
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketShareData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, ""]}
                />
                <Legend />
                <Bar dataKey="Ready" stackId="a" fill={READY_COLOR} />
                <Bar dataKey="Off-Plan" stackId="a" fill={OFFPLAN_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Region Comparison with Property Type Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Ready vs Off-Plan by Region
              </CardTitle>
              <p className="text-sm text-slate-400">
                Compare pricing within same region and property type
              </p>
            </div>
            <select
              value={selectedPropertyType}
              onChange={(e) => setSelectedPropertyType(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Property Types</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {translate(type, 'propertyType')}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {comparisonChartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  />
                  <YAxis
                    type="category"
                    dataKey="regionEn"
                    stroke="#94a3b8"
                    width={130}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [
                      `AED ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                      name,
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="Ready" fill={READY_COLOR} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Off-Plan" fill={OFFPLAN_COLOR} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">
              No comparison data available for selected property type
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed Comparison</CardTitle>
          <p className="text-sm text-slate-400">
            Ready vs Off-Plan within same region and property type
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-2 text-slate-400 font-medium">Region</th>
                  <th className="text-left py-3 px-2 text-slate-400 font-medium">Type</th>
                  <th className="text-right py-3 px-2 text-slate-400 font-medium">Ready (AED/sqm)</th>
                  <th className="text-right py-3 px-2 text-slate-400 font-medium">Off-Plan (AED/sqm)</th>
                  <th className="text-right py-3 px-2 text-slate-400 font-medium">Premium</th>
                  <th className="text-right py-3 px-2 text-slate-400 font-medium">Volume Ratio</th>
                </tr>
              </thead>
              <tbody>
                {filteredComparison.slice(0, 20).map((row, idx) => (
                  <tr
                    key={`${row.region}-${row.propertyType}`}
                    className="border-b border-slate-800 hover:bg-slate-800/30"
                  >
                    <td className="py-3 px-2 text-slate-200">{row.region}</td>
                    <td className="py-3 px-2 text-slate-300">{row.propertyTypeEn}</td>
                    <td className="text-right py-3 px-2 text-emerald-400">
                      {row.ready
                        ? row.ready.avgPricePerSqm.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })
                        : "-"}
                    </td>
                    <td className="text-right py-3 px-2 text-amber-400">
                      {row.offPlan
                        ? row.offPlan.avgPricePerSqm.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })
                        : "-"}
                    </td>
                    <td className="text-right py-3 px-2">
                      {row.ready && row.offPlan ? (
                        <span
                          className={
                            row.pricePremium >= 0 ? "text-emerald-400" : "text-red-400"
                          }
                        >
                          {row.pricePremium >= 0 ? "+" : ""}
                          {row.pricePremium.toFixed(1)}%
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="text-right py-3 px-2 text-slate-300">
                      {row.ready && row.offPlan
                        ? `${row.volumeRatio.toFixed(2)}:1`
                        : "-"}
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

