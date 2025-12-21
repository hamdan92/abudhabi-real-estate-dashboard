"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { RegionData, Transaction } from "@/types";
import { calculateInvestmentScores, InvestmentScore } from "@/lib/forecasting";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Star, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";

interface InvestmentScoreCardProps {
  regionData: RegionData[];
  transactions: Transaction[];
  title?: string;
}

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

export function InvestmentScoreCard({
  regionData,
  transactions,
  title = "Investment Opportunities",
}: InvestmentScoreCardProps) {
  const scores = useMemo(
    () => calculateInvestmentScores(regionData, transactions),
    [regionData, transactions]
  );

  // Sort by overall score descending
  const sortedScores = [...scores].sort((a, b) => b.overallScore - a.overallScore);
  const topOpportunities = sortedScores.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          {title}
        </CardTitle>
        <CardDescription>
          Investment scoring based on growth, liquidity, value, and momentum
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

        {/* Score Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-2 text-slate-400 font-medium">Region</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Score</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium hidden md:table-cell">Growth</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium hidden md:table-cell">Volume</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium hidden md:table-cell">Value</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium hidden md:table-cell">Momentum</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {topOpportunities.map((score) => {
                const style = getRecommendationStyle(score.recommendation);
                const Icon = style.icon;
                return (
                  <tr key={score.region} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-2 text-slate-200 max-w-[150px] truncate" title={score.region}>
                      {score.region}
                    </td>
                    <td className="py-3 px-2 text-center">
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
                    <td className="py-3 px-2 text-center hidden md:table-cell">
                      <span className={score.priceGrowthScore >= 20 ? "text-emerald-400" : score.priceGrowthScore >= 15 ? "text-amber-400" : "text-slate-400"}>
                        {score.priceGrowthScore}/25
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center hidden md:table-cell">
                      <span className={score.volumeScore >= 15 ? "text-emerald-400" : score.volumeScore >= 10 ? "text-amber-400" : "text-slate-400"}>
                        {score.volumeScore}/25
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center hidden md:table-cell">
                      <span className={score.valueScore >= 20 ? "text-emerald-400" : score.valueScore >= 15 ? "text-amber-400" : "text-slate-400"}>
                        {score.valueScore}/25
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center hidden md:table-cell">
                      <span className={score.momentumScore >= 20 ? "text-emerald-400" : score.momentumScore >= 15 ? "text-amber-400" : "text-slate-400"}>
                        {score.momentumScore}/25
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
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
  );
}

