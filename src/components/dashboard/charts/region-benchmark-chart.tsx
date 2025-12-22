"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { RegionData } from "@/types";
import { X } from "lucide-react";

interface RegionBenchmarkChartProps {
  data: RegionData[];
  title?: string;
}

const METRICS = [
  { key: "transactions", label: "Volume", format: "number" },
  { key: "avgPricePerSqm", label: "Price/SQM", format: "currency" },
  { key: "totalValue", label: "Total Value", format: "currency" },
  { key: "yoyGrowth", label: "YoY Growth", format: "percent" },
];

const COLORS = ["#f59e0b", "#3b82f6", "#22c55e", "#8b5cf6", "#ec4899"];

export function RegionBenchmarkChart({
  data,
  title = "Region Benchmark Comparison",
}: RegionBenchmarkChartProps) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const topRegions = data.slice(0, 15);

  // Normalize data for radar chart
  const radarData = useMemo(() => {
    if (selectedRegions.length === 0) return [];

    const selectedData = data.filter((d) => selectedRegions.includes(d.region));
    
    // Find max values for normalization
    const maxValues = {
      transactions: Math.max(...selectedData.map((d) => d.transactions)),
      avgPricePerSqm: Math.max(...selectedData.map((d) => d.avgPricePerSqm)),
      totalValue: Math.max(...selectedData.map((d) => d.totalValue)),
      yoyGrowth: Math.max(...selectedData.map((d) => Math.abs(d.yoyGrowth))),
    };

    return METRICS.map((metric) => {
      const result: Record<string, string | number> = { metric: metric.label };
      selectedData.forEach((region) => {
        const value = region[metric.key as keyof RegionData] as number;
        const maxValue = maxValues[metric.key as keyof typeof maxValues];
        const normalizedValue = metric.key === "yoyGrowth" 
          ? (value + 100) / 2 // Normalize growth to 0-100 scale
          : (value / maxValue) * 100;
        result[region.region] = Math.max(0, Math.min(100, normalizedValue));
      });
      return result;
    });
  }, [data, selectedRegions]);

  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter((r) => r !== region));
    } else if (selectedRegions.length < 5) {
      setSelectedRegions([...selectedRegions, region]);
    }
  };

  const getRegionStats = (region: string) => {
    return data.find((d) => d.region === region);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Select up to 5 regions to compare across key metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Region Selection */}
        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-2">Select regions to compare:</p>
          <div className="flex flex-wrap gap-2">
            {topRegions.map((region, index) => (
              <button
                key={region.region}
                onClick={() => toggleRegion(region.region)}
                disabled={!selectedRegions.includes(region.region) && selectedRegions.length >= 5}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedRegions.includes(region.region)
                    ? "text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
                style={{
                  backgroundColor: selectedRegions.includes(region.region)
                    ? COLORS[selectedRegions.indexOf(region.region)]
                    : undefined,
                }}
              >
                {region.regionEn || region.region}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Regions Pills */}
        {selectedRegions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-700">
            {selectedRegions.map((region, index) => {
              const regionData = data.find((d) => d.region === region);
              return (
                <span
                  key={region}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm text-white rounded-lg"
                  style={{ backgroundColor: COLORS[index] }}
                >
                  {regionData?.regionEn || region}
                  <button onClick={() => toggleRegion(region)} className="hover:opacity-80">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Radar Chart */}
        {selectedRegions.length >= 2 ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                {selectedRegions.map((region, index) => {
                  const regionData = data.find((d) => d.region === region);
                  return (
                    <Radar
                      key={region}
                      name={regionData?.regionEn || region}
                      dataKey={region}
                      stroke={COLORS[index]}
                      fill={COLORS[index]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  );
                })}
                <Legend wrapperStyle={{ color: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f1f5f9" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-slate-400">
            Select at least 2 regions to see comparison
          </div>
        )}

        {/* Comparison Table */}
        {selectedRegions.length >= 2 && (
          <div className="mt-4 pt-4 border-t border-slate-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-2 text-slate-400 font-medium">Region</th>
                  <th className="text-right py-2 px-2 text-slate-400 font-medium">Transactions</th>
                  <th className="text-right py-2 px-2 text-slate-400 font-medium">Avg Price/SQM</th>
                  <th className="text-right py-2 px-2 text-slate-400 font-medium">Total Value</th>
                  <th className="text-right py-2 px-2 text-slate-400 font-medium">YoY Growth</th>
                </tr>
              </thead>
              <tbody>
                {selectedRegions.map((region, index) => {
                  const stats = getRegionStats(region);
                  if (!stats) return null;
                  return (
                    <tr key={region} className="border-b border-slate-800">
                      <td className="py-2 px-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <span className="text-slate-200">{stats.regionEn || region}</span>
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">
                        {formatNumber(stats.transactions)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">
                        AED {formatNumber(stats.avgPricePerSqm)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">
                        {formatCurrency(stats.totalValue, true)}
                      </td>
                      <td className={`py-2 px-2 text-right ${stats.yoyGrowth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {stats.yoyGrowth >= 0 ? "+" : ""}{stats.yoyGrowth.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

