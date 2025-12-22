"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Transaction, ResaleAnalysisResult, UnitHistory } from "@/types";
import { performResaleAnalysis, getResaleConfidence } from "@/lib/resale-analysis";
import { identifyResales } from "@/lib/resale-analysis";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Percent,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ResaleAnalysisProps {
  transactions: Transaction[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function ResaleAnalysis({ transactions }: ResaleAnalysisProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("overview");
  
  const analysis = useMemo(() => {
    return performResaleAnalysis(transactions);
  }, [transactions]);
  
  const confidence = useMemo(() => {
    const unitHistories = identifyResales(transactions);
    return getResaleConfidence(unitHistories);
  }, [transactions]);
  
  const { metrics } = analysis;
  
  // Prepare scatter data for holding period vs appreciation
  const scatterData = useMemo(() => {
    const unitHistories = identifyResales(transactions);
    return unitHistories
      .flatMap((u) => u.transactions)
      .filter((t) => t.isResale && t.holdingPeriodYears && t.priceChangePercent !== undefined)
      .map((t) => ({
        holdingYears: t.holdingPeriodYears!,
        appreciation: t.priceChangePercent!,
        return: t.annualizedReturn || 0,
      }))
      .filter((d) => d.holdingYears > 0 && d.holdingYears < 10 && Math.abs(d.appreciation) < 200);
  }, [transactions]);
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-6">
      {/* Header with Confidence Indicator */}
      <div className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 rounded-xl p-6 border border-emerald-500/20">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Resale Analysis</h2>
            <p className="text-gray-400 max-w-2xl">
              Analysis of units that were sold more than once. Units are identified using a fingerprinting 
              algorithm based on region, project, property type, configuration, and area.
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Identification Confidence</div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white">{confidence.high}</span>
                <span className="text-gray-500">High</span>
              </div>
              <div className="flex items-center gap-1">
                <Info className="w-4 h-4 text-yellow-400" />
                <span className="text-white">{confidence.medium}</span>
                <span className="text-gray-500">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-white">{confidence.low}</span>
                <span className="text-gray-500">Low</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard
          title="Units Analyzed"
          value={metrics.totalUnitsAnalyzed.toLocaleString()}
          icon={<Info className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="Units with Resale"
          value={metrics.unitsWithResale.toLocaleString()}
          subtitle={`${metrics.resaleRate.toFixed(1)}% resale rate`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
        />
        <KPICard
          title="Total Resales"
          value={metrics.totalResaleTransactions.toLocaleString()}
          icon={<DollarSign className="w-5 h-5" />}
          color="cyan"
        />
        <KPICard
          title="Avg Holding Period"
          value={`${metrics.avgHoldingPeriodYears.toFixed(1)} yrs`}
          subtitle={`Median: ${metrics.medianHoldingPeriodYears.toFixed(1)} yrs`}
          icon={<Clock className="w-5 h-5" />}
          color="purple"
        />
        <KPICard
          title="Avg Appreciation"
          value={`${metrics.avgAppreciation >= 0 ? "+" : ""}${metrics.avgAppreciation.toFixed(1)}%`}
          subtitle={`${metrics.positiveResaleRate.toFixed(0)}% positive`}
          icon={metrics.avgAppreciation >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          color={metrics.avgAppreciation >= 0 ? "emerald" : "red"}
        />
        <KPICard
          title="Avg Annual Return"
          value={`${metrics.avgAnnualizedReturn >= 0 ? "+" : ""}${metrics.avgAnnualizedReturn.toFixed(1)}%`}
          subtitle="CAGR"
          icon={<Percent className="w-5 h-5" />}
          color={metrics.avgAnnualizedReturn >= 0 ? "emerald" : "red"}
        />
      </div>

      {/* Flip vs Long-term */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-yellow-400">⚡</span> Flippers (≤2 years)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-white">{metrics.flipCount}</div>
              <div className="text-sm text-gray-400">Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{metrics.flipRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">of Resales</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${metrics.avgFlipReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                {metrics.avgFlipReturn >= 0 ? "+" : ""}{metrics.avgFlipReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Avg Return</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-blue-400">🏠</span> Long-term Holders (5+ years)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-white">{metrics.longTermCount}</div>
              <div className="text-sm text-gray-400">Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{metrics.longTermRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">of Resales</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${metrics.avgLongTermReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                {metrics.avgLongTermReturn >= 0 ? "+" : ""}{metrics.avgLongTermReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Avg Return</div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      <CollapsibleSection
        title="Holding Period vs Appreciation"
        isExpanded={expandedSection === "scatter"}
        onToggle={() => toggleSection("scatter")}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scatter Plot */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-4">Holding Period vs Total Appreciation</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="holdingYears" 
                    name="Holding Years"
                    stroke="#9ca3af"
                    label={{ value: 'Holding Period (Years)', position: 'bottom', fill: '#9ca3af' }}
                  />
                  <YAxis 
                    dataKey="appreciation" 
                    name="Appreciation"
                    stroke="#9ca3af"
                    label={{ value: 'Appreciation %', angle: -90, position: 'left', fill: '#9ca3af' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}${name === "Appreciation" ? "%" : " years"}`,
                      name,
                    ]}
                  />
                  <Scatter 
                    data={scatterData} 
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Holding Period Distribution */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-4">Holding Period Distribution</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.holdingPeriodDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis dataKey="range" type="category" stroke="#9ca3af" width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                    formatter={(value: number, name: string) => [
                      name === "count" ? value : `${value.toFixed(1)}%`,
                      name === "count" ? "Transactions" : "Avg Return",
                    ]}
                  />
                  <Bar dataKey="count" fill="#3b82f6" name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Holding Period Performance Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-2 pr-4">Holding Period</th>
                <th className="pb-2 pr-4 text-right">Count</th>
                <th className="pb-2 pr-4 text-right">Avg Appreciation</th>
                <th className="pb-2 pr-4 text-right">Avg Annual Return</th>
                <th className="pb-2 text-right">Positive Rate</th>
              </tr>
            </thead>
            <tbody>
              {analysis.holdingPeriodDistribution.map((bucket) => (
                <tr key={bucket.range} className="border-b border-gray-800 text-white">
                  <td className="py-2 pr-4">{bucket.range}</td>
                  <td className="py-2 pr-4 text-right">{bucket.count}</td>
                  <td className={`py-2 pr-4 text-right ${bucket.avgAppreciation >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {bucket.avgAppreciation >= 0 ? "+" : ""}{bucket.avgAppreciation.toFixed(1)}%
                  </td>
                  <td className={`py-2 pr-4 text-right ${bucket.avgAnnualizedReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {bucket.avgAnnualizedReturn >= 0 ? "+" : ""}{bucket.avgAnnualizedReturn.toFixed(1)}%
                  </td>
                  <td className="py-2 text-right">{bucket.positiveRate.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Appreciation Distribution"
        isExpanded={expandedSection === "appreciation"}
        onToggle={() => toggleSection("appreciation")}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-4">Distribution of Returns</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.appreciationDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                    formatter={(value: number) => [value, "Transactions"]}
                  />
                  <Bar dataKey="count" fill="#8b5cf6">
                    {analysis.appreciationDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.range.includes("-") && !entry.range.includes("to 0") ? "#ef4444" : "#10b981"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Pie Chart */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-4">Return Distribution</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysis.appreciationDistribution.filter((d) => d.count > 0)}
                    dataKey="count"
                    nameKey="range"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {analysis.appreciationDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                    formatter={(value: number) => [value, "Transactions"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Performance by Region"
        isExpanded={expandedSection === "region"}
        onToggle={() => toggleSection("region")}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-4">Resale Count by Region</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.byRegion.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis dataKey="segmentEn" type="category" stroke="#9ca3af" width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                  />
                  <Bar dataKey="resaleCount" fill="#3b82f6" name="Resales" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Radar Chart */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-4">Top 6 Regions Comparison</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={[
                  { metric: "Resale Count", ...Object.fromEntries(analysis.byRegion.slice(0, 6).map((r) => [r.segmentEn, r.resaleCount / Math.max(...analysis.byRegion.slice(0, 6).map((x) => x.resaleCount)) * 100])) },
                  { metric: "Avg Appreciation", ...Object.fromEntries(analysis.byRegion.slice(0, 6).map((r) => [r.segmentEn, Math.max(0, r.avgAppreciation)])) },
                  { metric: "Annual Return", ...Object.fromEntries(analysis.byRegion.slice(0, 6).map((r) => [r.segmentEn, Math.max(0, r.avgAnnualizedReturn)])) },
                  { metric: "Positive Rate", ...Object.fromEntries(analysis.byRegion.slice(0, 6).map((r) => [r.segmentEn, r.positiveResaleRate])) },
                ]}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="metric" stroke="#9ca3af" />
                  <PolarRadiusAxis stroke="#9ca3af" />
                  {analysis.byRegion.slice(0, 6).map((region, index) => (
                    <Radar
                      key={region.segment}
                      name={region.segmentEn}
                      dataKey={region.segmentEn}
                      stroke={COLORS[index]}
                      fill={COLORS[index]}
                      fillOpacity={0.1}
                    />
                  ))}
                  <Legend />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Region Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-2 pr-4">Region</th>
                <th className="pb-2 pr-4 text-right">Resales</th>
                <th className="pb-2 pr-4 text-right">Resale Rate</th>
                <th className="pb-2 pr-4 text-right">Avg Appreciation</th>
                <th className="pb-2 pr-4 text-right">Avg Holding</th>
                <th className="pb-2 pr-4 text-right">Annual Return</th>
                <th className="pb-2 text-right">Positive Rate</th>
              </tr>
            </thead>
            <tbody>
              {analysis.byRegion.slice(0, 20).map((region) => (
                <tr key={region.segment} className="border-b border-gray-800 text-white">
                  <td className="py-2 pr-4">{region.segmentEn}</td>
                  <td className="py-2 pr-4 text-right">{region.resaleCount}</td>
                  <td className="py-2 pr-4 text-right">{region.resaleRate.toFixed(1)}%</td>
                  <td className={`py-2 pr-4 text-right ${region.avgAppreciation >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {region.avgAppreciation >= 0 ? "+" : ""}{region.avgAppreciation.toFixed(1)}%
                  </td>
                  <td className="py-2 pr-4 text-right">{region.avgHoldingPeriodYears.toFixed(1)} yrs</td>
                  <td className={`py-2 pr-4 text-right ${region.avgAnnualizedReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {region.avgAnnualizedReturn >= 0 ? "+" : ""}{region.avgAnnualizedReturn.toFixed(1)}%
                  </td>
                  <td className="py-2 text-right">{region.positiveResaleRate.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Performance by Property Type"
        isExpanded={expandedSection === "propertyType"}
        onToggle={() => toggleSection("propertyType")}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-4">Appreciation by Property Type</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.byPropertyType.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="segmentEn" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }} />
                  <Bar dataKey="avgAppreciation" fill="#10b981" name="Avg Appreciation %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-4">Annual Return by Property Type</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.byPropertyType.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="segmentEn" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }} />
                  <Bar dataKey="avgAnnualizedReturn" fill="#8b5cf6" name="Avg Annual Return %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Property Type Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-2 pr-4">Property Type</th>
                <th className="pb-2 pr-4 text-right">Resales</th>
                <th className="pb-2 pr-4 text-right">Avg Appreciation</th>
                <th className="pb-2 pr-4 text-right">Annual Return</th>
                <th className="pb-2 text-right">Positive Rate</th>
              </tr>
            </thead>
            <tbody>
              {analysis.byPropertyType.map((type) => (
                <tr key={type.segment} className="border-b border-gray-800 text-white">
                  <td className="py-2 pr-4">{type.segmentEn}</td>
                  <td className="py-2 pr-4 text-right">{type.resaleCount}</td>
                  <td className={`py-2 pr-4 text-right ${type.avgAppreciation >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {type.avgAppreciation >= 0 ? "+" : ""}{type.avgAppreciation.toFixed(1)}%
                  </td>
                  <td className={`py-2 pr-4 text-right ${type.avgAnnualizedReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {type.avgAnnualizedReturn >= 0 ? "+" : ""}{type.avgAnnualizedReturn.toFixed(1)}%
                  </td>
                  <td className="py-2 text-right">{type.positiveResaleRate.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Off-Plan vs Ready (Original Purchase)"
        isExpanded={expandedSection === "saleType"}
        onToggle={() => toggleSection("saleType")}
      >
        <div className="bg-gray-800/30 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-4">
            Comparing resale performance based on whether the unit was originally purchased as Off-Plan or Ready.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.bySaleType.map((saleType) => (
              <div key={saleType.segment} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-lg font-semibold text-white mb-4">{saleType.segmentEn}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-white">{saleType.resaleCount}</div>
                    <div className="text-sm text-gray-400">Resales</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${saleType.avgAppreciation >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {saleType.avgAppreciation >= 0 ? "+" : ""}{saleType.avgAppreciation.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">Avg Appreciation</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{saleType.avgHoldingPeriodYears.toFixed(1)} yrs</div>
                    <div className="text-sm text-gray-400">Avg Holding</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${saleType.avgAnnualizedReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {saleType.avgAnnualizedReturn >= 0 ? "+" : ""}{saleType.avgAnnualizedReturn.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">Annual Return</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Positive Rate</span>
                    <span className="text-white font-medium">{saleType.positiveResaleRate.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Performance by Purchase Year (Vintage)"
        isExpanded={expandedSection === "vintage"}
        onToggle={() => toggleSection("vintage")}
      >
        <div className="bg-gray-800/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-4">Which purchase vintage performed best?</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysis.byPurchaseYear}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="segment" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }} />
                <Legend />
                <Line type="monotone" dataKey="avgAppreciation" stroke="#10b981" name="Avg Appreciation %" strokeWidth={2} />
                <Line type="monotone" dataKey="avgAnnualizedReturn" stroke="#8b5cf6" name="Annual Return %" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Vintage Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-2 pr-4">Purchase Year</th>
                <th className="pb-2 pr-4 text-right">Resales</th>
                <th className="pb-2 pr-4 text-right">Avg Holding</th>
                <th className="pb-2 pr-4 text-right">Avg Appreciation</th>
                <th className="pb-2 pr-4 text-right">Annual Return</th>
                <th className="pb-2 text-right">Positive Rate</th>
              </tr>
            </thead>
            <tbody>
              {analysis.byPurchaseYear.map((year) => (
                <tr key={year.segment} className="border-b border-gray-800 text-white">
                  <td className="py-2 pr-4">{year.segment}</td>
                  <td className="py-2 pr-4 text-right">{year.resaleCount}</td>
                  <td className="py-2 pr-4 text-right">{year.avgHoldingPeriodYears.toFixed(1)} yrs</td>
                  <td className={`py-2 pr-4 text-right ${year.avgAppreciation >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {year.avgAppreciation >= 0 ? "+" : ""}{year.avgAppreciation.toFixed(1)}%
                  </td>
                  <td className={`py-2 pr-4 text-right ${year.avgAnnualizedReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {year.avgAnnualizedReturn >= 0 ? "+" : ""}{year.avgAnnualizedReturn.toFixed(1)}%
                  </td>
                  <td className="py-2 text-right">{year.positiveResaleRate.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "cyan" | "purple" | "red" | "yellow";
}

function KPICard({ title, value, subtitle, icon, color }: KPICardProps) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };
  
  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{title}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, isExpanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-700/30 transition-colors"
      >
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isExpanded && <div className="p-5 pt-0">{children}</div>}
    </div>
  );
}

export default ResaleAnalysis;

