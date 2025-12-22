"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types";
import { translate } from "@/lib/translations";
import { calculateRegionComparison } from "@/lib/data-processor";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { Filter, BarChart3, Radar as RadarIcon, Grid3X3, Info } from "lucide-react";

interface SegmentComparisonToolProps {
  transactions: Transaction[];
}

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

export function SegmentComparisonTool({ transactions }: SegmentComparisonToolProps) {
  const [propertyType, setPropertyType] = useState<string>("");
  const [saleType, setSaleType] = useState<string>("");
  const [bedrooms, setBedrooms] = useState<string>("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"bar" | "radar" | "scatter">("bar");

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const residential = transactions.filter((t) => t.assetCategory === "سكني");
    return {
      propertyTypes: [...new Set(residential.map((t) => t.propertyType))].filter(Boolean).sort(),
      saleTypes: [...new Set(residential.map((t) => t.saleType))].filter(Boolean),
      bedrooms: [...new Set(residential.map((t) => t.propertyDesign))].filter(Boolean),
    };
  }, [transactions]);

  // Calculate comparison data with current filters
  const comparisonData = useMemo(() => {
    const filters: {
      propertyType?: string;
      saleType?: string;
      bedrooms?: string;
    } = {};
    if (propertyType) filters.propertyType = propertyType;
    if (saleType) filters.saleType = saleType;
    if (bedrooms) filters.bedrooms = bedrooms;

    return calculateRegionComparison(transactions, filters);
  }, [transactions, propertyType, saleType, bedrooms]);

  // Filter to selected regions for detailed comparison
  const selectedData = useMemo(() => {
    if (selectedRegions.length === 0) return comparisonData.slice(0, 10);
    return comparisonData.filter((d) => selectedRegions.includes(d.region));
  }, [comparisonData, selectedRegions]);

  // Top regions for selection
  const topRegions = useMemo(() => {
    return comparisonData.slice(0, 20);
  }, [comparisonData]);

  // Prepare radar chart data (normalized 0-100)
  const radarData = useMemo(() => {
    if (selectedData.length === 0) return [];

    const maxPrice = Math.max(...selectedData.map((d) => d.avgPricePerSqm));
    const maxVolume = Math.max(...selectedData.map((d) => d.transactions));
    const maxGrowth = Math.max(...selectedData.map((d) => Math.abs(d.yoyGrowth)));
    const maxCagr = Math.max(...selectedData.map((d) => Math.abs(d.cagr3y)));

    return [
      {
        metric: "Price Level",
        ...Object.fromEntries(
          selectedData.map((d) => [d.region, (d.avgPricePerSqm / maxPrice) * 100])
        ),
      },
      {
        metric: "Volume",
        ...Object.fromEntries(
          selectedData.map((d) => [d.region, (d.transactions / maxVolume) * 100])
        ),
      },
      {
        metric: "YoY Growth",
        ...Object.fromEntries(
          selectedData.map((d) => [
            d.region,
            50 + (d.yoyGrowth / (maxGrowth || 1)) * 50,
          ])
        ),
      },
      {
        metric: "3Y CAGR",
        ...Object.fromEntries(
          selectedData.map((d) => [d.region, 50 + (d.cagr3y / (maxCagr || 1)) * 50])
        ),
      },
      {
        metric: "Stability",
        ...Object.fromEntries(
          selectedData.map((d) => [d.region, Math.max(0, 100 - d.volatility)])
        ),
      },
    ];
  }, [selectedData]);

  // Scatter chart data (price vs growth)
  const scatterData = useMemo(() => {
    return selectedData.map((d, idx) => ({
      name: d.regionEn,
      x: d.avgPricePerSqm,
      y: d.yoyGrowth,
      z: d.transactions,
      color: COLORS[idx % COLORS.length],
    }));
  }, [selectedData]);

  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter((r) => r !== region));
    } else if (selectedRegions.length < 6) {
      setSelectedRegions([...selectedRegions, region]);
    }
  };

  const clearFilters = () => {
    setPropertyType("");
    setSaleType("");
    setBedrooms("");
    setSelectedRegions([]);
  };

  const activeFiltersCount =
    (propertyType ? 1 : 0) + (saleType ? 1 : 0) + (bedrooms ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-5 h-5 text-amber-400" />
              Segment Comparison Tool
              {activeFiltersCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                  {activeFiltersCount} filters
                </span>
              )}
            </CardTitle>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Clear all
              </button>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Compare regions with the same property type, sale type, and bedroom configuration
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Property Type Filter */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">All Types</option>
                {filterOptions.propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {translate(type, 'propertyType')}
                  </option>
                ))}
              </select>
            </div>

            {/* Sale Type Filter */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sale Type</label>
              <select
                value={saleType}
                onChange={(e) => setSaleType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">All (Ready + Off-Plan)</option>
                {filterOptions.saleTypes.map((type) => (
                  <option key={type} value={type}>
                    {translate(type, 'saleType')}
                  </option>
                ))}
              </select>
            </div>

            {/* Bedrooms Filter */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Bedrooms</label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">All Configurations</option>
                {filterOptions.bedrooms.map((bed) => (
                  <option key={bed} value={bed}>
                    {translate(bed, "bedroom")}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">View</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode("bar")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg ${
                    viewMode === "bar"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => setViewMode("radar")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg ${
                    viewMode === "radar"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <RadarIcon className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => setViewMode("scatter")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg ${
                    viewMode === "scatter"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>

          {/* Region Selection */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-slate-400">Select Regions to Compare</label>
              <span className="text-xs text-slate-500">
                ({selectedRegions.length}/6 selected)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {topRegions.map((region, idx) => (
                <button
                  key={region.region}
                  onClick={() => toggleRegion(region.region)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    selectedRegions.includes(region.region)
                      ? "text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  style={{
                    backgroundColor: selectedRegions.includes(region.region)
                      ? COLORS[selectedRegions.indexOf(region.region) % COLORS.length]
                      : undefined,
                  }}
                >
                  {region.regionEn}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg">
          <Info className="w-4 h-4" />
          <span>
            Showing data for{" "}
            {propertyType && (
              <span className="text-amber-400">
                    {translate(propertyType, 'propertyType')}
              </span>
            )}
            {propertyType && saleType && " • "}
            {saleType && (
              <span className="text-emerald-400">
                {translate(saleType, 'saleType')}
              </span>
            )}
            {(propertyType || saleType) && bedrooms && " • "}
            {bedrooms && (
              <span className="text-blue-400">
                {translate(bedrooms, 'bedroom')}
              </span>
            )}
            {" "}({comparisonData.length} regions with data)
          </span>
        </div>
      )}

      {/* Comparison Charts */}
      {comparisonData.length > 0 ? (
        <>
          {viewMode === "bar" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Price & Growth Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedData} layout="vertical">
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
                        formatter={(value: number, name: string) => {
                          if (name === "avgPricePerSqm") {
                            return [
                              `AED ${value.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}`,
                              "Avg Price/sqm",
                            ];
                          }
                          return [`${value.toFixed(1)}%`, name];
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="avgPricePerSqm"
                        name="Avg Price/sqm"
                        fill="#f59e0b"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === "radar" && selectedData.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Multi-Metric Comparison</CardTitle>
                <p className="text-sm text-slate-400">
                  Normalized scores (0-100) across key metrics
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="metric" stroke="#94a3b8" />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        stroke="#334155"
                      />
                      {selectedData.slice(0, 6).map((d, idx) => (
                        <Radar
                          key={d.region}
                          name={d.regionEn}
                          dataKey={d.region}
                          stroke={COLORS[idx % COLORS.length]}
                          fill={COLORS[idx % COLORS.length]}
                          fillOpacity={0.2}
                        />
                      ))}
                      <Legend />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === "scatter" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Price vs Growth Analysis</CardTitle>
                <p className="text-sm text-slate-400">
                  X: Average Price/sqm • Y: YoY Growth (%) • Bubble Size: Transaction Volume
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Price"
                        stroke="#94a3b8"
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                        label={{
                          value: "Avg Price/sqm (AED)",
                          position: "insideBottom",
                          offset: -5,
                          fill: "#64748b",
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Growth"
                        stroke="#94a3b8"
                        tickFormatter={(v) => `${v}%`}
                        label={{
                          value: "YoY Growth (%)",
                          angle: -90,
                          position: "insideLeft",
                          fill: "#64748b",
                        }}
                      />
                      <ZAxis type="number" dataKey="z" range={[100, 1000]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === "Price")
                            return [
                              `AED ${value.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}`,
                              "Avg Price/sqm",
                            ];
                          if (name === "Growth") return [`${value.toFixed(1)}%`, "YoY Growth"];
                          return [value.toLocaleString(), "Transactions"];
                        }}
                        labelFormatter={(label) => {
                          const point = scatterData.find((d) => d.x === label);
                          return point?.name || "";
                        }}
                      />
                      {scatterData.map((entry, index) => (
                        <Scatter
                          key={entry.name}
                          name={entry.name}
                          data={[entry]}
                          fill={entry.color}
                        />
                      ))}
                      <Legend />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detailed Comparison Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-2 text-slate-400 font-medium">
                        Region
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">
                        Transactions
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">
                        Avg Price/sqm
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">
                        Median Price/sqm
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">
                        YoY Growth
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">
                        3Y CAGR
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">
                        Volatility
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedData.map((row, idx) => (
                      <tr
                        key={row.region}
                        className="border-b border-slate-800 hover:bg-slate-800/30"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {selectedRegions.includes(row.region) && (
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    COLORS[
                                      selectedRegions.indexOf(row.region) % COLORS.length
                                    ],
                                }}
                              />
                            )}
                            <span className="text-slate-200">{row.regionEn}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2 text-slate-300">
                          {row.transactions.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-2 text-slate-300">
                          AED{" "}
                          {row.avgPricePerSqm.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td className="text-right py-3 px-2 text-slate-300">
                          AED{" "}
                          {row.medianPricePerSqm.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td className="text-right py-3 px-2">
                          <span
                            className={
                              row.yoyGrowth > 0
                                ? "text-emerald-400"
                                : row.yoyGrowth < 0
                                ? "text-red-400"
                                : "text-slate-400"
                            }
                          >
                            {row.yoyGrowth > 0 ? "+" : ""}
                            {row.yoyGrowth.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-2">
                          <span
                            className={
                              row.cagr3y > 0
                                ? "text-emerald-400"
                                : row.cagr3y < 0
                                ? "text-red-400"
                                : "text-slate-400"
                            }
                          >
                            {row.cagr3y > 0 ? "+" : ""}
                            {row.cagr3y.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-2">
                          <span
                            className={
                              row.volatility < 15
                                ? "text-emerald-400"
                                : row.volatility < 25
                                ? "text-amber-400"
                                : "text-red-400"
                            }
                          >
                            {row.volatility.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">
              No data available for the selected filters. Try adjusting your selection.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

