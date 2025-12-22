"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardHeader } from "@/components/dashboard/header";
import { LoadingSpinner } from "@/components/dashboard/loading-skeleton";
import {
  YoYComparisonChart,
  BedroomAnalysisChart,
  TrendComparisonTool,
} from "@/components/dashboard/charts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  ArrowLeft,
  Percent,
  Home,
  ArrowRightLeft,
  Layers,
  Repeat,
  Building2,
  Construction,
  Star,
  CheckCircle,
  Minus,
  AlertTriangle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { calculateInvestmentScores, InvestmentScore } from "@/lib/forecasting";

type TabType = "overview" | "ready-vs-offplan" | "offplan-premium" | "trends" | "resale";

// Helper functions for investment score styling
const getRecommendationStyle = (rec: InvestmentScore["recommendation"]) => {
  switch (rec) {
    case "Strong Buy":
      return { bg: "bg-emerald-500/20", text: "text-emerald-400", icon: Star };
    case "Buy":
      return { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: CheckCircle };
    case "Hold":
      return { bg: "bg-amber-500/10", text: "text-amber-400", icon: Minus };
    case "Caution":
      return { bg: "bg-orange-500/10", text: "text-orange-400", icon: AlertTriangle };
    case "Avoid":
      return { bg: "bg-rose-500/10", text: "text-rose-400", icon: XCircle };
  }
};

const ScoreBar = ({ score, max, color }: { score: number; max: number; color: string }) => (
  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
    <div
      className={`h-full ${color} transition-all duration-500`}
      style={{ width: `${(score / max) * 100}%` }}
    />
  </div>
);

export default function AnalyticsPage() {
  const { data, segmentedData, transactions, isLoading, error, refetch } = useDashboardData();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Calculate investment scores for all regions
  const investmentScores = useMemo(() => {
    if (!data || !transactions) return [];
    return calculateInvestmentScores(data.regionData, transactions);
  }, [data, transactions]);

  // Sort scores by overall score
  const sortedScores = useMemo(() => {
    return [...investmentScores].sort((a, b) => b.overallScore - a.overallScore);
  }, [investmentScores]);

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

  const { yearlyData, bedroomData } = data;
  const { propertyTypeAnalysis } = segmentedData;

  // Filter to residential transactions for analysis
  const residentialTxns = transactions.filter((t) => t.assetCategory === "سكني");

  // Define which tabs are available
  const availableTabs = ["overview", "trends"];

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: BarChart3, available: true },
    { id: "trends" as TabType, label: "Trend Comparison", icon: TrendingUp, available: true },
    { id: "ready-vs-offplan" as TabType, label: "Ready vs Off-Plan", icon: ArrowRightLeft, available: false },
    { id: "offplan-premium" as TabType, label: "Off-Plan Premium", icon: Building2, available: false },
    { id: "resale" as TabType, label: "Resale Analysis", icon: Repeat, available: false },
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
            const isAvailable = tab.available;
            return (
              <button
                key={tab.id}
                onClick={() => isAvailable && setActiveTab(tab.id)}
                disabled={!isAvailable}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-amber-500 text-white shadow-lg"
                    : isAvailable
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    : "text-slate-600 cursor-not-allowed opacity-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {!isAvailable && <span className="text-[10px] ml-1">(Soon)</span>}
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
                  transactions={residentialTxns}
                  metric="medianPricePerSqm"
                  title="Median Price/SQM Growth"
                  showPropertyTypeTabs={true}
                />
                <YoYComparisonChart
                  data={yearlyData}
                  transactions={residentialTxns}
                  metric="transactions"
                  title="Transaction Volume Growth"
                  showPropertyTypeTabs={true}
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

              <BedroomAnalysisChart 
                data={bedroomData} 
                transactions={residentialTxns}
              />
            </section>

            {/* Section: Investment Opportunities - Full Table */}
            <section className="mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    Investment Opportunities by Region
                  </CardTitle>
                  <CardDescription>
                    All regions scored based on growth, liquidity, value, and momentum
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Top 3 Picks */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {sortedScores.slice(0, 3).map((score, index) => {
                      const style = getRecommendationStyle(score.recommendation);
                      const Icon = style.icon;
                      return (
                        <div
                          key={score.region}
                          className={`p-4 rounded-lg ${style.bg} border border-slate-700`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400">#{index + 1} Pick</span>
                            <span className={`text-sm font-bold ${style.text}`}>
                              {score.overallScore}/100
                            </span>
                          </div>
                          <h4 className="font-semibold text-white mb-2 truncate" title={score.region}>
                            {score.region}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${style.text}`} />
                            <span className={`text-sm font-medium ${style.text}`}>
                              {score.recommendation}
                            </span>
                          </div>
                          <div className="mt-3 space-y-1">
                            {score.reasons.slice(0, 2).map((reason, i) => (
                              <p key={i} className="text-xs text-slate-400 flex items-start gap-1">
                                <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                {reason}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Full Score Table with Scroll */}
                  <div className="max-h-[600px] overflow-y-auto border border-slate-700 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-slate-900 z-10">
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-3 text-slate-400 font-medium">#</th>
                          <th className="text-left py-3 px-3 text-slate-400 font-medium">Region</th>
                          <th className="text-center py-3 px-3 text-slate-400 font-medium">Score</th>
                          <th className="text-center py-3 px-3 text-slate-400 font-medium hidden md:table-cell">Growth</th>
                          <th className="text-center py-3 px-3 text-slate-400 font-medium hidden md:table-cell">Volume</th>
                          <th className="text-center py-3 px-3 text-slate-400 font-medium hidden md:table-cell">Value</th>
                          <th className="text-center py-3 px-3 text-slate-400 font-medium hidden md:table-cell">Momentum</th>
                          <th className="text-right py-3 px-3 text-slate-400 font-medium">Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedScores.map((score, index) => {
                          const style = getRecommendationStyle(score.recommendation);
                          const Icon = style.icon;
                          return (
                            <tr key={score.region} className="border-b border-slate-800 hover:bg-slate-800/50">
                              <td className="py-3 px-3 text-slate-500 text-xs">
                                {index + 1}
                              </td>
                              <td className="py-3 px-3 text-slate-200 max-w-[200px] truncate" title={score.region}>
                                {score.region}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="inline-flex items-center gap-2">
                                  <span className="text-white font-bold">{score.overallScore}</span>
                                  <div className="w-16 hidden sm:block">
                                    <ScoreBar
                                      score={score.overallScore}
                                      max={100}
                                      color={score.overallScore >= 65 ? "bg-emerald-500" : score.overallScore >= 50 ? "bg-amber-500" : "bg-rose-500"}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center hidden md:table-cell">
                                <span className={score.priceGrowthScore >= 20 ? "text-emerald-400" : score.priceGrowthScore >= 15 ? "text-amber-400" : "text-slate-400"}>
                                  {score.priceGrowthScore}/25
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center hidden md:table-cell">
                                <span className={score.volumeScore >= 15 ? "text-emerald-400" : score.volumeScore >= 10 ? "text-amber-400" : "text-slate-400"}>
                                  {score.volumeScore}/25
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center hidden md:table-cell">
                                <span className={score.valueScore >= 20 ? "text-emerald-400" : score.valueScore >= 15 ? "text-amber-400" : "text-slate-400"}>
                                  {score.valueScore}/25
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center hidden md:table-cell">
                                <span className={score.momentumScore >= 20 ? "text-emerald-400" : score.momentumScore >= 15 ? "text-amber-400" : "text-slate-400"}>
                                  {score.momentumScore}/25
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                                  <Icon className="w-3 h-3" />
                                  {score.recommendation}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Scoring Methodology */}
                  <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-200 mb-2">Scoring Methodology</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400">
                      <div>
                        <p className="font-medium text-slate-300">Growth (25 pts)</p>
                        <p>YoY price appreciation</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-300">Volume (25 pts)</p>
                        <p>Market liquidity</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-300">Value (25 pts)</p>
                        <p>Price vs market average</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-300">Momentum (25 pts)</p>
                        <p>Recent performance trend</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
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

        {/* Under Development Message for disabled tabs */}
        {!availableTabs.includes(activeTab) && (
          <section className="flex flex-col items-center justify-center py-20">
            <Construction className="w-16 h-16 text-amber-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Under Development</h3>
            <p className="text-slate-400 text-center max-w-md">
              This feature is currently being built. Please check back soon for updates.
            </p>
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
