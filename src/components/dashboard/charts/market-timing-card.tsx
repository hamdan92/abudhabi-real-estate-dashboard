"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { YearlyData } from "@/types";
import { calculateMarketTiming, MarketTiming } from "@/lib/forecasting";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Gauge,
  ArrowUp,
  ArrowDown,
  Activity,
  ShieldAlert,
  Zap,
} from "lucide-react";

interface MarketTimingCardProps {
  yearlyData: YearlyData[];
  title?: string;
}

const getIndicatorStyle = (indicator: MarketTiming["indicator"]) => {
  switch (indicator) {
    case "Strong Buy":
      return {
        bg: "bg-gradient-to-br from-emerald-500/30 to-emerald-600/20",
        border: "border-emerald-400/50",
        text: "text-emerald-400",
        icon: Zap,
        description: "Excellent buying opportunity",
        scoreColor: "text-emerald-400",
      };
    case "Buy":
      return {
        bg: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        icon: CheckCircle,
        description: "Market conditions favor buying",
        scoreColor: "text-emerald-400",
      };
    case "Hold":
      return {
        bg: "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        icon: Clock,
        description: "Mixed signals - maintain position",
        scoreColor: "text-amber-400",
      };
    case "Wait":
      return {
        bg: "bg-gradient-to-br from-orange-500/20 to-orange-600/10",
        border: "border-orange-500/30",
        text: "text-orange-400",
        icon: AlertTriangle,
        description: "Consider delaying purchase",
        scoreColor: "text-orange-400",
      };
    case "Strong Wait":
      return {
        bg: "bg-gradient-to-br from-rose-500/20 to-rose-600/10",
        border: "border-rose-500/30",
        text: "text-rose-400",
        icon: ShieldAlert,
        description: "Wait for significant correction",
        scoreColor: "text-rose-400",
      };
  }
};

const getSignalIcon = (type: "bullish" | "bearish" | "neutral") => {
  switch (type) {
    case "bullish":
      return <TrendingUp className="w-3 h-3 text-emerald-400" />;
    case "bearish":
      return <TrendingDown className="w-3 h-3 text-rose-400" />;
    default:
      return <Activity className="w-3 h-3 text-slate-400" />;
  }
};

export function MarketTimingCard({
  yearlyData,
  title = "Market Timing Indicator",
}: MarketTimingCardProps) {
  const timing = useMemo(() => calculateMarketTiming(yearlyData), [yearlyData]);
  const style = getIndicatorStyle(timing.indicator);
  const Icon = style.icon;

  // Calculate bullish vs bearish signals
  const bullishCount = timing.signals.filter((s) => s.type === "bullish").length;
  const bearishCount = timing.signals.filter((s) => s.type === "bearish").length;

  return (
    <Card className={`${style.bg} border ${style.border}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-amber-400" />
            {title}
          </span>
          <span className={`text-sm font-normal ${style.text}`}>
            Score: {timing.score}/100
          </span>
        </CardTitle>
        <CardDescription>
          Is it a good time to buy property in Abu Dhabi?
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Main Indicator */}
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${style.bg} border-2 ${style.border} mb-3`}
            >
              <Icon className={`w-10 h-10 ${style.text}`} />
            </div>
            <h3 className={`text-2xl font-bold ${style.text}`}>{timing.indicator}</h3>
            <p className="text-sm text-slate-400 mt-1">{style.description}</p>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs">
              <span className="text-slate-400">
                Confidence: <span className={`font-bold ${style.text}`}>{timing.confidence}%</span>
              </span>
              <span className="text-slate-500">|</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">{bullishCount}</span>
                <span className="text-slate-500 mx-1">/</span>
                <TrendingDown className="w-3 h-3 text-rose-400" />
                <span className="text-rose-400">{bearishCount}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-slate-700">
          <div className="text-center p-2 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              {timing.metrics.priceVsAverage > 0 ? (
                <ArrowUp className="w-3 h-3 text-amber-400" />
              ) : (
                <ArrowDown className="w-3 h-3 text-emerald-400" />
              )}
              <span className="text-xs text-slate-400">vs Avg</span>
            </div>
            <p
              className={`text-base font-bold ${
                timing.metrics.priceVsAverage > 15
                  ? "text-amber-400"
                  : timing.metrics.priceVsAverage < 0
                  ? "text-emerald-400"
                  : "text-slate-200"
              }`}
            >
              {timing.metrics.priceVsAverage > 0 ? "+" : ""}
              {timing.metrics.priceVsAverage.toFixed(1)}%
            </p>
          </div>

          <div className="text-center p-2 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              {timing.metrics.yoyPriceChange > 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-400" />
              )}
              <span className="text-xs text-slate-400">YoY</span>
            </div>
            <p
              className={`text-base font-bold ${
                timing.metrics.yoyPriceChange > 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {timing.metrics.yoyPriceChange > 0 ? "+" : ""}
              {timing.metrics.yoyPriceChange.toFixed(1)}%
            </p>
          </div>

          <div className="text-center p-2 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="text-xs text-slate-400">Volatility</span>
            </div>
            <p
              className={`text-base font-bold ${
                timing.metrics.volatility < 15
                  ? "text-emerald-400"
                  : timing.metrics.volatility < 25
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {timing.metrics.volatility.toFixed(1)}%
            </p>
          </div>

          <div className="text-center p-2 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="text-xs text-slate-400">Volume</span>
            </div>
            <p
              className={`text-base font-bold ${
                timing.metrics.volumeTrend === "Surging" ||
                timing.metrics.volumeTrend === "Growing"
                  ? "text-emerald-400"
                  : timing.metrics.volumeTrend === "Declining" ||
                    timing.metrics.volumeTrend === "Contracting"
                  ? "text-rose-400"
                  : "text-slate-200"
              }`}
            >
              {timing.metrics.volumeTrend}
            </p>
          </div>

          <div className="text-center p-2 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="text-xs text-slate-400">Momentum</span>
            </div>
            <p
              className={`text-base font-bold ${
                timing.metrics.marketMomentum === "Bullish" ||
                timing.metrics.marketMomentum === "Accelerating"
                  ? "text-emerald-400"
                  : timing.metrics.marketMomentum === "Bearish"
                  ? "text-rose-400"
                  : "text-amber-400"
              }`}
            >
              {timing.metrics.marketMomentum}
            </p>
          </div>

          <div className="text-center p-2 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="text-xs text-slate-400">Trend R²</span>
            </div>
            <p
              className={`text-base font-bold ${
                timing.metrics.trendStrength > 70
                  ? "text-emerald-400"
                  : timing.metrics.trendStrength > 50
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {timing.metrics.trendStrength}%
            </p>
          </div>
        </div>

        {/* Signals */}
        <div className="mt-3 p-3 bg-slate-800/30 rounded-lg">
          <h4 className="text-xs font-medium text-slate-200 mb-2">Market Signals</h4>
          <div className="space-y-1.5">
            {timing.signals.slice(0, 5).map((signal, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs"
              >
                {getSignalIcon(signal.type)}
                <div className="flex-1">
                  <span className="text-slate-400">{signal.factor}:</span>{" "}
                  <span className="text-slate-300">{signal.description}</span>
                </div>
                <span
                  className={`text-xs font-medium ${
                    signal.impact > 0
                      ? "text-emerald-400"
                      : signal.impact < 0
                      ? "text-rose-400"
                      : "text-slate-400"
                  }`}
                >
                  {signal.impact > 0 ? "+" : ""}
                  {signal.impact}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Reasons */}
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {timing.reasons.slice(0, 3).map((reason, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-slate-800/50 text-slate-400 rounded"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 mt-3 text-center">
          * Historical analysis only. Not financial advice.
        </p>
      </CardContent>
    </Card>
  );
}
