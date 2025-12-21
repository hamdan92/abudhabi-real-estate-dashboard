"use client";

import { useMemo } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardHeader } from "@/components/dashboard/header";
import { LoadingSpinner } from "@/components/dashboard/loading-skeleton";
import {
  PriceForecastChart,
  InvestmentScoreCard,
  MarketTimingCard,
} from "@/components/dashboard/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  Lightbulb,
  Target,
  ArrowLeft,
  Sparkles,
  Brain,
  LineChart,
  Shield,
  AlertTriangle,
  Activity,
  Gauge,
} from "lucide-react";
import Link from "next/link";
import { forecastValues, calculateRiskMetrics, RiskMetrics } from "@/lib/forecasting";

export default function InsightsPage() {
  const { data, transactions, isLoading, error, refetch } = useDashboardData();

  // Calculate forecasts and risk metrics
  const { forecasts, riskMetrics, forecastSummary } = useMemo(() => {
    if (!data) return { forecasts: null, riskMetrics: null, forecastSummary: null };

    const forecastResult = forecastValues(data.yearlyData, 3);
    const risk = calculateRiskMetrics(data.yearlyData);

    return {
      forecasts: forecastResult.forecasts,
      riskMetrics: risk,
      forecastSummary: forecastResult,
    };
  }, [data]);

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

  if (!data || !forecasts || !riskMetrics || !forecastSummary) {
    return null;
  }

  const { yearlyData, regionData } = data;

  // Filter to residential transactions for analysis
  const residentialTxns = transactions.filter((t) => t.assetCategory === "سكني");

  // Calculate some quick insights
  const latestYear = yearlyData[yearlyData.length - 1];
  const forecast2028 = forecasts[forecasts.length - 1];
  const projectedGrowth =
    ((forecast2028.predictedPrice - latestYear.medianPricePerSqm) /
      latestYear.medianPricePerSqm) *
    100;

  const getRiskColor = (level: RiskMetrics["riskLevel"]) => {
    switch (level) {
      case "Conservative":
        return "text-emerald-400";
      case "Moderate":
        return "text-amber-400";
      case "Aggressive":
        return "text-orange-400";
      case "Speculative":
        return "text-rose-400";
    }
  };

  const getQualityColor = (
    quality: "Excellent" | "Good" | "Fair" | "Poor"
  ) => {
    switch (quality) {
      case "Excellent":
        return "text-emerald-400";
      case "Good":
        return "text-blue-400";
      case "Fair":
        return "text-amber-400";
      case "Poor":
        return "text-rose-400";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <DashboardHeader onRefresh={refetch} isLoading={isLoading} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link & Title */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Overview
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-400" />
            Investment Insights
          </h2>
          <p className="text-slate-400">
            Predictive analytics, risk assessment, and investment recommendations
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">2028 Forecast</p>
                <p className="text-xl font-bold text-emerald-400">
                  AED {(forecast2028.predictedPrice / 1000).toFixed(1)}K/sqm
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <LineChart className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Expected CAGR</p>
                <p className="text-xl font-bold text-amber-400">
                  +{forecastSummary.expectedCAGR.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Risk Level</p>
                <p className={`text-xl font-bold ${getRiskColor(riskMetrics.riskLevel)}`}>
                  {riskMetrics.riskLevel}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Model Quality</p>
                <p
                  className={`text-xl font-bold ${getQualityColor(
                    forecastSummary.modelQuality.qualityRating
                  )}`}
                >
                  {forecastSummary.modelQuality.qualityRating}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Risk Metrics Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-6 h-6 text-amber-400" />
            <h3 className="text-2xl font-bold text-white">Risk Assessment</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Volatility</span>
              </div>
              <p className="text-2xl font-bold text-white">{riskMetrics.volatility}%</p>
              <p
                className={`text-sm ${
                  riskMetrics.priceVolatilityRating === "Low"
                    ? "text-emerald-400"
                    : riskMetrics.priceVolatilityRating === "Medium"
                    ? "text-amber-400"
                    : riskMetrics.priceVolatilityRating === "High"
                    ? "text-orange-400"
                    : "text-rose-400"
                }`}
              >
                {riskMetrics.priceVolatilityRating} volatility
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Max Drawdown</span>
              </div>
              <p className="text-2xl font-bold text-white">{riskMetrics.maxDrawdown}%</p>
              <p className="text-sm text-slate-400">Worst peak-to-trough decline</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Trend Stability</span>
              </div>
              <p className="text-2xl font-bold text-white">{riskMetrics.trendStability}%</p>
              <p
                className={`text-sm ${
                  riskMetrics.trendStability > 70
                    ? "text-emerald-400"
                    : riskMetrics.trendStability > 50
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                R² of price trend
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Growth Consistency</span>
              </div>
              <p className="text-2xl font-bold text-white">{riskMetrics.consistencyScore}%</p>
              <p
                className={`text-sm ${
                  riskMetrics.consistencyScore > 70
                    ? "text-emerald-400"
                    : riskMetrics.consistencyScore > 50
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                % of positive growth years
              </p>
            </Card>
          </div>

          {/* Model Quality Warnings */}
          {forecastSummary.modelQuality.warnings.length > 0 && (
            <Card className="bg-amber-500/10 border-amber-500/20">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Model Warnings
                </h4>
                <ul className="space-y-1">
                  {forecastSummary.modelQuality.warnings.map((warning, i) => (
                    <li key={i} className="text-sm text-amber-400/80">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Section: Market Timing */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="w-6 h-6 text-amber-400" />
            <h3 className="text-2xl font-bold text-white">Should You Buy Now?</h3>
          </div>

          <MarketTimingCard yearlyData={yearlyData} />
        </section>

        {/* Section: Price Forecast */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <LineChart className="w-6 h-6 text-amber-400" />
            <h3 className="text-2xl font-bold text-white">Price Forecast</h3>
          </div>

          <PriceForecastChart data={yearlyData} />
        </section>

        {/* Section: Investment Opportunities */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-6 h-6 text-amber-400" />
            <h3 className="text-2xl font-bold text-white">
              Top Investment Opportunities
            </h3>
          </div>

          <InvestmentScoreCard
            regionData={regionData}
            transactions={residentialTxns}
          />
        </section>

        {/* Key Takeaways */}
        <section className="mb-8">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Key Takeaways
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center bg-emerald-500/20 rounded text-emerald-400 text-sm">
                      1
                    </span>
                    Short-term (1-2 years)
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      Market shows{" "}
                      {yearlyData[yearlyData.length - 1]?.medianPricePerSqm >
                      yearlyData[yearlyData.length - 2]?.medianPricePerSqm
                        ? "positive"
                        : "mixed"}{" "}
                      momentum
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      Transaction volume trend indicates market health
                    </li>
                    <li className="flex items-start gap-2">
                      <span
                        className={
                          riskMetrics.volatility < 15
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      >
                        •
                      </span>
                      Price volatility: {riskMetrics.priceVolatilityRating}
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-500/20 rounded text-blue-400 text-sm">
                      2
                    </span>
                    Medium-term (3-5 years)
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      Expected CAGR: +{forecastSummary.expectedCAGR.toFixed(1)}%
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      Model reliability:{" "}
                      {forecastSummary.modelQuality.isReliable
                        ? "Good"
                        : "Limited data"}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      Trend R²: {riskMetrics.trendStability}% (
                      {riskMetrics.trendStability > 70 ? "strong" : "moderate"} trend)
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center bg-purple-500/20 rounded text-purple-400 text-sm">
                      3
                    </span>
                    Investment Strategy
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      Risk profile: {riskMetrics.riskLevel}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      Consider diversifying across regions
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      Compare Ready vs Off-Plan for best value
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-8">
          <p className="text-sm text-amber-400/80 flex items-start gap-2">
            <span className="font-bold">⚠️ Disclaimer:</span>
            The forecasts and recommendations provided are based on historical data
            analysis and statistical models. They should not be considered as financial
            advice. Real estate investments carry inherent risks, and actual results may
            vary significantly. Please consult with qualified professionals before making
            investment decisions.
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-slate-800">
          <p className="text-slate-500 text-sm">
            Abu Dhabi Real Estate Analytics Dashboard • Investment Insights
          </p>
        </footer>
      </main>
    </div>
  );
}
