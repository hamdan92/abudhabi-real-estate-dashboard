"use client";

import { useState } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardHeader } from "@/components/dashboard/header";
import { LoadingSpinner } from "@/components/dashboard/loading-skeleton";
import {
  YoYComparisonChart,
  SeasonalityHeatmap,
  BedroomAnalysisChart,
  RegionBenchmarkChart,
  PropertyTypeAnalysisChart,
  SaleTypeAnalysisChart,
  SegmentComparisonTool,
  TrendComparisonTool,
} from "@/components/dashboard/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  MapPin,
  ArrowLeft,
  Percent,
  Home,
  Building2,
  ArrowRightLeft,
  Filter,
  Layers,
} from "lucide-react";
import Link from "next/link";

type TabType = "overview" | "unit-types" | "ready-vs-offplan" | "compare" | "trends";

export default function AnalyticsPage() {
  const { data, segmentedData, transactions, isLoading, error, refetch } = useDashboardData();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Error: {error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data || !segmentedData) {
    return null;
  }

  const { yearlyData, regionData, bedroomData } = data;
  const { propertyTypeAnalysis, saleTypeAnalysis, readyVsOffPlan } = segmentedData;

  // Filter to residential transactions for analysis
  const residentialTxns = transactions.filter((t) => t.assetCategory === "سكني");

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: BarChart3 },
    { id: "unit-types" as TabType, label: "By Unit Type", icon: Building2 },
    { id: "ready-vs-offplan" as TabType, label: "Ready vs Off-Plan", icon: ArrowRightLeft },
    { id: "compare" as TabType, label: "Compare Segments", icon: Filter },
    { id: "trends" as TabType, label: "Trend Compare", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <DashboardHeader onRefresh={refetch} isLoading={isLoading} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link & Title */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Overview
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Advanced Analytics</h2>
          <p className="text-slate-400">
            Segmented analysis and comparisons for Abu Dhabi real estate market
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 p-1 bg-slate-900/50 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-amber-500 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Percent className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">CAGR (2019-2025)</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {(
                        (Math.pow(
                          yearlyData[yearlyData.length - 1]?.medianPricePerSqm /
                            yearlyData[0]?.medianPricePerSqm,
                          1 / (yearlyData.length - 1)
                        ) -
                          1) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Layers className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Property Types</p>
                    <p className="text-xl font-bold text-amber-400">
                      {propertyTypeAnalysis.length}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Home className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Most Popular</p>
                    <p className="text-xl font-bold text-blue-400">
                      {propertyTypeAnalysis[0]?.typeEn || "Apartment"}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Peak Season</p>
                    <p className="text-xl font-bold text-purple-400">Q4</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Section: Year-over-Year Analysis */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-amber-400" />
                <h3 className="text-2xl font-bold text-white">Year-over-Year Analysis</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <YoYComparisonChart
                  data={yearlyData}
                  metric="medianPricePerSqm"
                  title="Median Price/SQM Growth"
                />
                <YoYComparisonChart
                  data={yearlyData}
                  metric="transactions"
                  title="Transaction Volume Growth"
                />
              </div>
            </section>

            {/* Section: Seasonality Patterns */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-6 h-6 text-amber-400" />
                <h3 className="text-2xl font-bold text-white">Seasonality Patterns</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SeasonalityHeatmap
                  transactions={residentialTxns}
                  metric="count"
                  title="Monthly Transaction Volume"
                />
                <SeasonalityHeatmap
                  transactions={residentialTxns}
                  metric="pricePerSqm"
                  title="Monthly Average Price/SQM"
                />
              </div>
            </section>

            {/* Section: Bedroom Configuration */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-6 h-6 text-amber-400" />
                <h3 className="text-2xl font-bold text-white">
                  Bedroom Configuration Analysis
                </h3>
              </div>

              <BedroomAnalysisChart data={bedroomData} />
            </section>

            {/* Section: Region Benchmarking */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-6 h-6 text-amber-400" />
                <h3 className="text-2xl font-bold text-white">Region Benchmarking</h3>
              </div>

              <RegionBenchmarkChart data={regionData} />
            </section>
          </>
        )}

        {activeTab === "unit-types" && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-6 h-6 text-amber-400" />
              <h3 className="text-2xl font-bold text-white">
                Analysis by Property Type
              </h3>
            </div>
            <p className="text-slate-400 mb-6">
              Compare price trends, growth rates, and market share across different property
              types (Apartments, Villas, Townhouses, etc.)
            </p>

            <PropertyTypeAnalysisChart data={propertyTypeAnalysis} />
          </section>
        )}

        {activeTab === "ready-vs-offplan" && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <ArrowRightLeft className="w-6 h-6 text-amber-400" />
              <h3 className="text-2xl font-bold text-white">Ready vs Off-Plan Analysis</h3>
            </div>
            <p className="text-slate-400 mb-6">
              Compare pricing, growth, and volume between ready properties and off-plan
              properties. Understand the premium/discount dynamics.
            </p>

            <SaleTypeAnalysisChart
              saleTypeData={saleTypeAnalysis}
              readyVsOffPlan={readyVsOffPlan}
            />
          </section>
        )}

        {activeTab === "compare" && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-6 h-6 text-amber-400" />
              <h3 className="text-2xl font-bold text-white">Segment Comparison Tool</h3>
            </div>
            <p className="text-slate-400 mb-6">
              Compare regions with the same property type, sale type, and bedroom
              configuration. Filter to compare like-for-like.
            </p>

            <SegmentComparisonTool transactions={transactions} />
          </section>
        )}

        {activeTab === "trends" && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-amber-400" />
              <h3 className="text-2xl font-bold text-white">Trend Comparison</h3>
            </div>
            <p className="text-slate-400 mb-6">
              Compare price/sqm trends across multiple segments. Example: 4BR Villa in Yas vs 
              Saadiyat, or Yas Island vs Overall Market.
            </p>

            <TrendComparisonTool transactions={transactions} />
          </section>
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t border-slate-800 mt-12">
          <p className="text-slate-500 text-sm">
            Abu Dhabi Real Estate Analytics Dashboard • Segmented Analytics
          </p>
        </footer>
      </main>
    </div>
  );
}
