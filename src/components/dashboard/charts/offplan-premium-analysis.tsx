"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Transaction } from "@/types";
import { translate } from "@/lib/translations";
import { formatNumber } from "@/lib/utils";
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
  Cell,
  ComposedChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { 
  TrendingUp, 
  Calculator, 
  Clock, 
  DollarSign, 
  Percent,
  Info,
  Building2,
  Calendar,
  ArrowRight,
  Banknote,
  PiggyBank,
} from "lucide-react";

interface OffPlanPremiumAnalysisProps {
  transactions: Transaction[];
}

const READY_COLOR = "#10b981"; // emerald
const OFFPLAN_COLOR = "#f59e0b"; // amber

// Calculate median
function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Calculate average
function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function OffPlanPremiumAnalysis({ transactions }: OffPlanPremiumAnalysisProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("all");

  // Filter to residential transactions
  const residentialTxns = useMemo(() => 
    transactions.filter((t) => t.assetCategory === "سكني" && t.pricePerSqm > 0 && t.pricePerSqm < 100000),
    [transactions]
  );

  // Get filter options
  const filterOptions = useMemo(() => {
    const regionCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();
    
    residentialTxns.forEach((t) => {
      if (t.region) regionCounts.set(t.region, (regionCounts.get(t.region) || 0) + 1);
      if (t.propertyType) typeCounts.set(t.propertyType, (typeCounts.get(t.propertyType) || 0) + 1);
    });

    return {
      regions: [...regionCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([r]) => r),
      propertyTypes: [...typeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t),
    };
  }, [residentialTxns]);

  // Filter transactions based on selection
  const filteredTxns = useMemo(() => {
    let filtered = residentialTxns;
    if (selectedRegion !== "all") {
      filtered = filtered.filter((t) => t.region === selectedRegion);
    }
    if (selectedPropertyType !== "all") {
      filtered = filtered.filter((t) => t.propertyType === selectedPropertyType);
    }
    return filtered;
  }, [residentialTxns, selectedRegion, selectedPropertyType]);

  // Calculate Off-Plan vs Ready price premium over time
  const premiumTrendData = useMemo(() => {
    const years = [...new Set(filteredTxns.map((t) => t.year))].sort();
    
    return years.map((year) => {
      const yearTxns = filteredTxns.filter((t) => t.year === year);
      const readyTxns = yearTxns.filter((t) => t.saleType === "جاهزة");
      const offPlanTxns = yearTxns.filter((t) => t.saleType === "على المخطط");
      
      const readyPrices = readyTxns.map((t) => t.pricePerSqm);
      const offPlanPrices = offPlanTxns.map((t) => t.pricePerSqm);
      
      const readyMedian = median(readyPrices);
      const offPlanMedian = median(offPlanPrices);
      
      // Calculate premium: positive = off-plan is more expensive
      const premium = readyMedian > 0 && offPlanMedian > 0
        ? ((offPlanMedian - readyMedian) / readyMedian) * 100
        : null;
      
      return {
        year,
        ready: readyMedian,
        offPlan: offPlanMedian,
        readyCount: readyTxns.length,
        offPlanCount: offPlanTxns.length,
        premium,
        premiumAbs: offPlanMedian - readyMedian,
      };
    }).filter((d) => d.ready > 0 || d.offPlan > 0);
  }, [filteredTxns]);

  // Vintage Analysis: Track off-plan purchases by year
  // For units sold off-plan in year X, what's their performance when resold?
  const vintageAnalysis = useMemo(() => {
    const years = [...new Set(filteredTxns.map((t) => t.year))].sort();
    
    // Group off-plan by purchase year
    const vintageData = years.map((purchaseYear) => {
      const offPlanPurchases = filteredTxns.filter(
        (t) => t.year === purchaseYear && t.saleType === "على المخطط"
      );
      
      if (offPlanPurchases.length === 0) return null;
      
      const purchasePrices = offPlanPurchases.map((t) => t.pricePerSqm);
      const avgPurchasePrice = median(purchasePrices);
      
      // Get current market price (latest year data for same segment)
      const latestYear = Math.max(...years);
      const currentReadyTxns = filteredTxns.filter(
        (t) => t.year === latestYear && t.saleType === "جاهزة"
      );
      const currentReadyPrice = currentReadyTxns.length > 0 
        ? median(currentReadyTxns.map((t) => t.pricePerSqm))
        : 0;
      
      // Calculate appreciation
      const appreciation = avgPurchasePrice > 0 && currentReadyPrice > 0
        ? ((currentReadyPrice - avgPurchasePrice) / avgPurchasePrice) * 100
        : 0;
      
      // Calculate years held
      const yearsHeld = latestYear - purchaseYear;
      
      // Calculate annualized return (CAGR)
      const cagr = yearsHeld > 0 && avgPurchasePrice > 0 && currentReadyPrice > 0
        ? (Math.pow(currentReadyPrice / avgPurchasePrice, 1 / yearsHeld) - 1) * 100
        : 0;
      
      return {
        purchaseYear,
        purchasePrice: avgPurchasePrice,
        currentPrice: currentReadyPrice,
        appreciation,
        yearsHeld,
        cagr,
        volume: offPlanPurchases.length,
        totalValue: offPlanPurchases.reduce((sum, t) => sum + (t.totalPrice || 0), 0),
      };
    }).filter((d): d is NonNullable<typeof d> => d !== null && d.yearsHeld > 0);
    
    return vintageData;
  }, [filteredTxns]);

  // Financing Advantage Analysis
  // Compare the cost of buying off-plan (installments) vs ready (mortgage)
  const financingAnalysis = useMemo(() => {
    const latestYear = Math.max(...premiumTrendData.map((d) => d.year));
    const latestData = premiumTrendData.find((d) => d.year === latestYear);
    
    if (!latestData || !latestData.ready || !latestData.offPlan) return null;
    
    // Assumptions
    const unitSize = 100; // sqm
    const readyDownPayment = 0.20; // 20%
    const mortgageRate = 0.045; // 4.5% annual
    const mortgageTerm = 25; // years
    
    // Off-plan payment schedule (typical)
    const offPlanSchedule = [
      { phase: "Booking", percentage: 0.10, monthsFromStart: 0 },
      { phase: "During Construction", percentage: 0.40, monthsFromStart: 18 },
      { phase: "Handover", percentage: 0.50, monthsFromStart: 36 },
    ];
    
    // Ready property
    const readyTotalPrice = latestData.ready * unitSize;
    const readyDownPaymentAmount = readyTotalPrice * readyDownPayment;
    const readyLoanAmount = readyTotalPrice - readyDownPaymentAmount;
    
    // Monthly mortgage payment (PMT formula)
    const monthlyRate = mortgageRate / 12;
    const numPayments = mortgageTerm * 12;
    const monthlyPayment = readyLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);
    const totalMortgagePaid = monthlyPayment * numPayments;
    const totalReadyCost = readyDownPaymentAmount + totalMortgagePaid;
    
    // Off-plan property
    const offPlanTotalPrice = latestData.offPlan * unitSize;
    // No financing during construction, but time value of money
    const discountRate = 0.05; // 5% opportunity cost
    
    // Calculate NPV of off-plan payments
    let offPlanNPV = 0;
    offPlanSchedule.forEach((payment) => {
      const amount = offPlanTotalPrice * payment.percentage;
      const years = payment.monthsFromStart / 12;
      offPlanNPV += amount / Math.pow(1 + discountRate, years);
    });
    
    // At handover, remaining 50% needs mortgage
    const handoverLoanAmount = offPlanTotalPrice * 0.50;
    const handoverMonthlyPayment = handoverLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                                   (Math.pow(1 + monthlyRate, numPayments) - 1);
    const handoverTotalMortgage = handoverMonthlyPayment * numPayments;
    
    // NPV of mortgage payments (discounted to handover date, then to today)
    const mortgageNPV = handoverTotalMortgage / Math.pow(1 + discountRate, 3); // 3 years to handover
    
    const totalOffPlanNPV = offPlanNPV + mortgageNPV;
    
    // Effective discount
    const effectiveDiscount = ((totalReadyCost - totalOffPlanNPV) / totalReadyCost) * 100;
    
    // Cash flow analysis
    const cashFlowComparison = {
      ready: {
        upfront: readyDownPaymentAmount,
        monthly: monthlyPayment,
        total: totalReadyCost,
        totalPrice: readyTotalPrice,
      },
      offPlan: {
        upfront: offPlanTotalPrice * 0.10,
        duringConstruction: offPlanTotalPrice * 0.40,
        atHandover: offPlanTotalPrice * 0.50,
        monthlyAfterHandover: handoverMonthlyPayment,
        totalNPV: totalOffPlanNPV,
        totalPrice: offPlanTotalPrice,
      },
      effectiveDiscount,
      savings: totalReadyCost - totalOffPlanNPV,
    };
    
    return cashFlowComparison;
  }, [premiumTrendData]);

  // Market share trend
  const marketShareData = useMemo(() => {
    const years = [...new Set(filteredTxns.map((t) => t.year))].sort();
    
    return years.map((year) => {
      const yearTxns = filteredTxns.filter((t) => t.year === year);
      const readyCount = yearTxns.filter((t) => t.saleType === "جاهزة").length;
      const offPlanCount = yearTxns.filter((t) => t.saleType === "على المخطط").length;
      const total = readyCount + offPlanCount;
      
      return {
        year,
        ready: total > 0 ? (readyCount / total) * 100 : 0,
        offPlan: total > 0 ? (offPlanCount / total) * 100 : 0,
        readyCount,
        offPlanCount,
      };
    });
  }, [filteredTxns]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const readyTxns = filteredTxns.filter((t) => t.saleType === "جاهزة");
    const offPlanTxns = filteredTxns.filter((t) => t.saleType === "على المخطط");
    
    const readyPrices = readyTxns.map((t) => t.pricePerSqm);
    const offPlanPrices = offPlanTxns.map((t) => t.pricePerSqm);
    
    const readyMedian = median(readyPrices);
    const offPlanMedian = median(offPlanPrices);
    
    // Premium calculation: positive = off-plan is more expensive
    const premiumPercent = readyMedian > 0 
      ? ((offPlanMedian - readyMedian) / readyMedian) * 100 
      : 0;
    
    // Calculate YoY for both
    const years = [...new Set(filteredTxns.map((t) => t.year))].sort();
    const latestYear = years[years.length - 1];
    const prevYear = years[years.length - 2];
    
    const readyLatest = median(readyTxns.filter((t) => t.year === latestYear).map((t) => t.pricePerSqm));
    const readyPrev = median(readyTxns.filter((t) => t.year === prevYear).map((t) => t.pricePerSqm));
    const offPlanLatest = median(offPlanTxns.filter((t) => t.year === latestYear).map((t) => t.pricePerSqm));
    const offPlanPrev = median(offPlanTxns.filter((t) => t.year === prevYear).map((t) => t.pricePerSqm));
    
    const readyYoY = readyPrev > 0 ? ((readyLatest - readyPrev) / readyPrev) * 100 : 0;
    const offPlanYoY = offPlanPrev > 0 ? ((offPlanLatest - offPlanPrev) / offPlanPrev) * 100 : 0;
    
    return {
      readyMedian,
      offPlanMedian,
      premiumPercent,
      premiumAbs: offPlanMedian - readyMedian,
      readyCount: readyTxns.length,
      offPlanCount: offPlanTxns.length,
      readyYoY,
      offPlanYoY,
      offPlanGrowingFaster: offPlanYoY > readyYoY,
    };
  }, [filteredTxns]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            Off-Plan Premium Analysis
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Understanding why off-plan trades at a premium and the financing advantage
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200"
          >
            <option value="all">All Regions</option>
            {filterOptions.regions.map((r) => (
              <option key={r} value={r}>{translate(r, "region")}</option>
            ))}
          </select>
          <select
            value={selectedPropertyType}
            onChange={(e) => setSelectedPropertyType(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200"
          >
            <option value="all">All Property Types</option>
            {filterOptions.propertyTypes.map((t) => (
              <option key={t} value={t}>{translate(t, "propertyType")}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Ready Price */}
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-400">Ready</span>
            </div>
            <p className="text-2xl font-bold text-white">
              AED {formatNumber(summaryStats.readyMedian)}
              <span className="text-sm text-slate-400">/sqm</span>
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className={summaryStats.readyYoY >= 0 ? "text-emerald-400" : "text-red-400"}>
                {summaryStats.readyYoY >= 0 ? "+" : ""}{summaryStats.readyYoY.toFixed(1)}% YoY
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">{summaryStats.readyCount.toLocaleString()} txns</span>
            </div>
          </CardContent>
        </Card>

        {/* Off-Plan Price */}
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-400">Off-Plan</span>
            </div>
            <p className="text-2xl font-bold text-white">
              AED {formatNumber(summaryStats.offPlanMedian)}
              <span className="text-sm text-slate-400">/sqm</span>
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className={summaryStats.offPlanYoY >= 0 ? "text-emerald-400" : "text-red-400"}>
                {summaryStats.offPlanYoY >= 0 ? "+" : ""}{summaryStats.offPlanYoY.toFixed(1)}% YoY
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">{summaryStats.offPlanCount.toLocaleString()} txns</span>
            </div>
          </CardContent>
        </Card>

        {/* Off-Plan Premium */}
        <Card className={summaryStats.premiumPercent > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30"}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Off-Plan Premium</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {summaryStats.premiumPercent >= 0 ? "+" : ""}{summaryStats.premiumPercent.toFixed(1)}%
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {summaryStats.premiumPercent > 0 ? "Off-plan costs more" : "Off-plan costs less"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              AED {Math.abs(summaryStats.premiumAbs).toLocaleString(undefined, { maximumFractionDigits: 0 })}/sqm difference
            </p>
          </CardContent>
        </Card>

        {/* Growth Comparison */}
        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Growth Leader</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {summaryStats.offPlanGrowingFaster ? "Off-Plan" : "Ready"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Growing {Math.abs(summaryStats.offPlanYoY - summaryStats.readyYoY).toFixed(1)}% faster YoY
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Premium Trend Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Off-Plan Premium Trend
            </CardTitle>
            <CardDescription>
              % difference: Off-Plan vs Ready (positive = off-plan costs more)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={premiumTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis 
                    yAxisId="price"
                    stroke="#94a3b8" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  />
                  <YAxis 
                    yAxisId="premium"
                    orientation="right"
                    stroke="#94a3b8" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v?.toFixed(0)}%`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    formatter={(value, name) => {
                      if (typeof value !== 'number') return ['-', name || ''];
                      if (name === "premium") return [`${value.toFixed(1)}%`, "Off-Plan Premium"];
                      return [`AED ${value.toLocaleString()}/sqm`, name || ''];
                    }}
                  />
                  <Legend />
                  <Line yAxisId="price" type="monotone" dataKey="ready" name="Ready" stroke={READY_COLOR} strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="price" type="monotone" dataKey="offPlan" name="Off-Plan" stroke={OFFPLAN_COLOR} strokeWidth={2} dot={{ r: 3 }} />
                  <Area yAxisId="premium" type="monotone" dataKey="premium" name="premium" fill="#3b82f6" fillOpacity={0.2} stroke="#3b82f6" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Market Share Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-400" />
              Market Share Trend
            </CardTitle>
            <CardDescription>
              % of transactions by sale type over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketShareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    formatter={(value, name) => [typeof value === 'number' ? `${value.toFixed(1)}%` : '-', name || '']}
                  />
                  <Legend />
                  <Bar dataKey="ready" name="Ready" stackId="a" fill={READY_COLOR} />
                  <Bar dataKey="offPlan" name="Off-Plan" stackId="a" fill={OFFPLAN_COLOR} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vintage Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Vintage Performance Analysis
          </CardTitle>
          <CardDescription>
            How did off-plan purchases from each year perform? Appreciation from purchase price to current market value.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vintageAnalysis.length > 0 ? (
            <div className="space-y-6">
              {/* Vintage Performance Chart */}
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={vintageAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="purchaseYear" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis 
                      yAxisId="price"
                      stroke="#94a3b8" 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    />
                    <YAxis 
                      yAxisId="appreciation"
                      orientation="right"
                      stroke="#94a3b8" 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      formatter={(value, name) => {
                        if (typeof value !== 'number') return ['-', name || ''];
                        if (name === "appreciation" || name === "cagr") return [`${value.toFixed(1)}%`, name === "cagr" ? "CAGR" : "Total Appreciation"];
                        return [`AED ${value.toLocaleString()}/sqm`, name || ''];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="price" dataKey="purchasePrice" name="Purchase Price" fill={OFFPLAN_COLOR} opacity={0.7} />
                    <Bar yAxisId="price" dataKey="currentPrice" name="Current Price" fill={READY_COLOR} opacity={0.7} />
                    <Line yAxisId="appreciation" type="monotone" dataKey="appreciation" name="appreciation" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Vintage Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400">Purchase Year</th>
                      <th className="text-right py-2 px-3 text-slate-400">Purchase Price</th>
                      <th className="text-right py-2 px-3 text-slate-400">Current Price</th>
                      <th className="text-right py-2 px-3 text-slate-400">Appreciation</th>
                      <th className="text-right py-2 px-3 text-slate-400">CAGR</th>
                      <th className="text-right py-2 px-3 text-slate-400">Years Held</th>
                      <th className="text-right py-2 px-3 text-slate-400">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vintageAnalysis.map((v) => (
                      <tr key={v.purchaseYear} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="py-2 px-3 text-white font-medium">{v.purchaseYear}</td>
                        <td className="py-2 px-3 text-right text-amber-400">AED {formatNumber(v.purchasePrice)}</td>
                        <td className="py-2 px-3 text-right text-emerald-400">AED {formatNumber(v.currentPrice)}</td>
                        <td className={`py-2 px-3 text-right font-medium ${v.appreciation >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {v.appreciation >= 0 ? "+" : ""}{v.appreciation.toFixed(1)}%
                        </td>
                        <td className={`py-2 px-3 text-right font-medium ${v.cagr >= 0 ? "text-cyan-400" : "text-red-400"}`}>
                          {v.cagr >= 0 ? "+" : ""}{v.cagr.toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">{v.yearsHeld} yrs</td>
                        <td className="py-2 px-3 text-right text-slate-400">{v.volume.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No vintage data available for the selected filters</p>
          )}
        </CardContent>
      </Card>

      {/* Financing Advantage Section */}
      {financingAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-400" />
              Financing Advantage Analysis
            </CardTitle>
            <CardDescription>
              Why off-plan may be cheaper despite higher sticker price: The time value of money
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ready Property */}
              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                <h4 className="font-medium text-emerald-400 mb-4 flex items-center gap-2">
                  <Banknote className="w-4 h-4" />
                  Ready Property (100 sqm)
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unit Price:</span>
                    <span className="text-white font-medium">AED {formatNumber(financingAnalysis.ready.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Down Payment (20%):</span>
                    <span className="text-emerald-400 font-medium">AED {formatNumber(financingAnalysis.ready.upfront)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Mortgage:</span>
                    <span className="text-white">AED {formatNumber(financingAnalysis.ready.monthly)}</span>
                  </div>
                  <div className="border-t border-emerald-500/30 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-medium">Total Cost (25 yrs):</span>
                      <span className="text-emerald-400 font-bold">AED {formatNumber(financingAnalysis.ready.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Off-Plan Property */}
              <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                <h4 className="font-medium text-amber-400 mb-4 flex items-center gap-2">
                  <PiggyBank className="w-4 h-4" />
                  Off-Plan Property (100 sqm)
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unit Price:</span>
                    <span className="text-white font-medium">AED {formatNumber(financingAnalysis.offPlan.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Booking (10%):</span>
                    <span className="text-amber-400 font-medium">AED {formatNumber(financingAnalysis.offPlan.upfront)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">During Construction (40%):</span>
                    <span className="text-white">AED {formatNumber(financingAnalysis.offPlan.duringConstruction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">At Handover (50%):</span>
                    <span className="text-white">AED {formatNumber(financingAnalysis.offPlan.atHandover)}</span>
                  </div>
                  <div className="border-t border-amber-500/30 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-medium">NPV Total Cost:</span>
                      <span className="text-amber-400 font-bold">AED {formatNumber(financingAnalysis.offPlan.totalNPV)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Summary */}
            <div className="mt-6 bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Effective Savings (Off-Plan)
                  </h4>
                  <p className="text-sm text-slate-400 mt-1">
                    When accounting for time value of money (5% discount rate)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-400">
                    {financingAnalysis.effectiveDiscount.toFixed(1)}%
                  </p>
                  <p className="text-sm text-slate-400">
                    AED {formatNumber(financingAnalysis.savings)} saved
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-300">Why off-plan can be cheaper:</strong> Even if off-plan has a higher sticker price, 
                    the ability to pay in installments over 3 years (vs 20% upfront for ready) means your money can grow elsewhere. 
                    When we calculate the Net Present Value (NPV) of all payments, off-plan often comes out ahead.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investor Insights */}
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Info className="w-5 h-5" />
            Key Insights for Investors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <h4 className="font-medium text-white mb-2">Why Off-Plan Trades at Premium</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">1.</span>
                  <span><strong className="text-slate-300">Financing Flexibility:</strong> Pay 10-50% over construction period vs 20% upfront for ready</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">2.</span>
                  <span><strong className="text-slate-300">Cost Basis Anchoring:</strong> Sellers price based on what they paid 2-4 years ago, not current market</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">3.</span>
                  <span><strong className="text-slate-300">New = Premium:</strong> Brand new finishes and warranties command higher prices</span>
                </li>
              </ul>
            </div>
            
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <h4 className="font-medium text-white mb-2">Investment Considerations</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span><strong className="text-slate-300">Off-Plan Advantage:</strong> Lower upfront cost, potential appreciation during construction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span><strong className="text-slate-300">Ready Advantage:</strong> Immediate rental income, no construction risk</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">→</span>
                  <span><strong className="text-slate-300">Vintage Matters:</strong> Earlier purchases generally show better appreciation (cost basis advantage)</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

