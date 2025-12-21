"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Transaction } from "@/types";
import { formatNumber } from "@/lib/utils";
import { translate } from "@/lib/translations";
import {
  TrendingUp,
  TrendingDown,
  Home,
  MapPin,
  BedDouble,
  Calendar,
  Calculator,
  DollarSign,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Building2,
  Percent,
} from "lucide-react";

interface CustomInsightsProps {
  transactions: Transaction[];
}

interface PaymentMilestone {
  installment: number;
  milestone: string;
  percentage: number;
  date: string;
  amount: number;
}

// Common payment plan templates for Abu Dhabi off-plan
const PAYMENT_PLANS = {
  "50-50": {
    name: "50/50 Payment Plan",
    description: "50% during construction, 50% on handover",
    milestones: [
      { milestone: "Booking/Reservation", percentage: 5 },
      { milestone: "SPA Signing", percentage: 5 },
      { milestone: "Start of Construction", percentage: 10 },
      { milestone: "25% Construction", percentage: 5 },
      { milestone: "50% Construction", percentage: 10 },
      { milestone: "75% Construction", percentage: 10 },
      { milestone: "90% Construction", percentage: 5 },
      { milestone: "Upon Handover", percentage: 50 },
    ],
  },
  "60-40": {
    name: "60/40 Payment Plan",
    description: "60% during construction, 40% on handover",
    milestones: [
      { milestone: "Booking/Reservation", percentage: 10 },
      { milestone: "SPA Signing", percentage: 10 },
      { milestone: "Start of Construction", percentage: 10 },
      { milestone: "30% Construction", percentage: 10 },
      { milestone: "50% Construction", percentage: 10 },
      { milestone: "70% Construction", percentage: 10 },
      { milestone: "Upon Handover", percentage: 40 },
    ],
  },
  "80-20": {
    name: "80/20 Payment Plan",
    description: "80% during construction, 20% on handover",
    milestones: [
      { milestone: "Booking/Reservation", percentage: 10 },
      { milestone: "SPA Signing", percentage: 15 },
      { milestone: "Start of Construction", percentage: 15 },
      { milestone: "30% Construction", percentage: 10 },
      { milestone: "50% Construction", percentage: 15 },
      { milestone: "70% Construction", percentage: 15 },
      { milestone: "Upon Handover", percentage: 20 },
    ],
  },
  "post-handover": {
    name: "Post-Handover Plan",
    description: "Lower upfront, extended payments after handover",
    milestones: [
      { milestone: "Booking/Reservation", percentage: 5 },
      { milestone: "SPA Signing", percentage: 5 },
      { milestone: "During Construction", percentage: 20 },
      { milestone: "Upon Handover", percentage: 30 },
      { milestone: "6 Months Post-Handover", percentage: 10 },
      { milestone: "12 Months Post-Handover", percentage: 10 },
      { milestone: "18 Months Post-Handover", percentage: 10 },
      { milestone: "24 Months Post-Handover", percentage: 10 },
    ],
  },
};

function calculateMortgage(principal: number, annualRate: number, years: number) {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  const monthlyPayment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - principal;
  return { monthlyPayment, totalPayment, totalInterest };
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function CustomInsights({ transactions }: CustomInsightsProps) {
  // Filter states
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("all");
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>("all");
  const [selectedSaleType, setSelectedSaleType] = useState<string>("all");

  // Payment calculator states
  const [propertyPrice, setPropertyPrice] = useState<number>(2000000);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<string>("50-50");
  const [constructionStartDate, setConstructionStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [constructionMonths, setConstructionMonths] = useState<number>(36);

  // Mortgage calculator states
  const [downPayment, setDownPayment] = useState<number>(20);
  const [mortgageRate, setMortgageRate] = useState<number>(4.5);
  const [mortgageYears, setMortgageYears] = useState<number>(25);

  // Get filter options
  const filterOptions = useMemo(() => {
    const regions = new Set<string>();
    const propertyTypes = new Set<string>();
    const bedrooms = new Set<string>();
    const saleTypes = new Set<string>();

    transactions.forEach((t) => {
      if (t.region) regions.add(t.region);
      if (t.propertyType) propertyTypes.add(t.propertyType);
      if (t.propertyDesign) bedrooms.add(t.propertyDesign);
      if (t.saleType) saleTypes.add(t.saleType);
    });

    return {
      regions: Array.from(regions).sort(),
      propertyTypes: Array.from(propertyTypes).sort(),
      bedrooms: Array.from(bedrooms).sort(),
      saleTypes: Array.from(saleTypes).sort(),
    };
  }, [transactions]);

  // Filter transactions based on selection
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.assetCategory !== "سكني") return false;
      if (t.pricePerSqm <= 0) return false;
      if (selectedRegion !== "all" && t.region !== selectedRegion) return false;
      if (selectedPropertyType !== "all" && t.propertyType !== selectedPropertyType) return false;
      if (selectedSaleType !== "all" && t.saleType !== selectedSaleType) return false;
      if (selectedBedrooms !== "all" && t.propertyDesign !== selectedBedrooms) return false;
      return true;
    });
  }, [transactions, selectedRegion, selectedPropertyType, selectedSaleType, selectedBedrooms]);

  // Calculate insights for filtered data
  const insights = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return null;
    }

    const prices = filteredTransactions.map((t) => t.pricePerSqm).sort((a, b) => a - b);
    const totalPrices = filteredTransactions.map((t) => t.totalPrice).sort((a, b) => a - b);
    const areas = filteredTransactions.map((t) => t.soldArea).filter((a) => a > 0);

    // Price statistics
    const avgPricePerSqm = prices.reduce((a, b) => a + b, 0) / prices.length;
    const medianPricePerSqm = prices[Math.floor(prices.length / 2)];
    const minPricePerSqm = prices[0];
    const maxPricePerSqm = prices[prices.length - 1];

    // Total price statistics
    const avgTotalPrice = totalPrices.reduce((a, b) => a + b, 0) / totalPrices.length;
    const medianTotalPrice = totalPrices[Math.floor(totalPrices.length / 2)];
    const minTotalPrice = totalPrices[0];
    const maxTotalPrice = totalPrices[totalPrices.length - 1];

    // Area statistics
    const avgArea = areas.length > 0 ? areas.reduce((a, b) => a + b, 0) / areas.length : 0;

    // Yearly price trends
    const yearlyData: Record<number, { prices: number[]; count: number }> = {};
    filteredTransactions.forEach((t) => {
      if (!yearlyData[t.year]) {
        yearlyData[t.year] = { prices: [], count: 0 };
      }
      yearlyData[t.year].prices.push(t.pricePerSqm);
      yearlyData[t.year].count++;
    });

    const priceByYear = Object.entries(yearlyData)
      .map(([year, data]) => ({
        year: parseInt(year),
        avgPrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
        transactions: data.count,
      }))
      .sort((a, b) => a.year - b.year);

    // Calculate growth
    let totalGrowth = 0;
    let cagr = 0;
    if (priceByYear.length >= 2) {
      const firstYear = priceByYear[0];
      const lastYear = priceByYear[priceByYear.length - 1];
      totalGrowth = ((lastYear.avgPrice - firstYear.avgPrice) / firstYear.avgPrice) * 100;
      const years = lastYear.year - firstYear.year;
      if (years > 0) {
        cagr = (Math.pow(lastYear.avgPrice / firstYear.avgPrice, 1 / years) - 1) * 100;
      }
    }

    // YoY growth
    let yoyGrowth = 0;
    if (priceByYear.length >= 2) {
      const current = priceByYear[priceByYear.length - 1];
      const previous = priceByYear[priceByYear.length - 2];
      yoyGrowth = ((current.avgPrice - previous.avgPrice) / previous.avgPrice) * 100;
    }

    // Market timing signal
    const overallAvg = transactions
      .filter((t) => t.assetCategory === "سكني" && t.pricePerSqm > 0)
      .reduce((sum, t) => sum + t.pricePerSqm, 0) / transactions.filter((t) => t.assetCategory === "سكني" && t.pricePerSqm > 0).length;
    
    const priceVsMarket = ((avgPricePerSqm - overallAvg) / overallAvg) * 100;

    return {
      count: filteredTransactions.length,
      avgPricePerSqm,
      medianPricePerSqm,
      minPricePerSqm,
      maxPricePerSqm,
      avgTotalPrice,
      medianTotalPrice,
      minTotalPrice,
      maxTotalPrice,
      avgArea,
      priceByYear,
      totalGrowth,
      cagr,
      yoyGrowth,
      priceVsMarket,
    };
  }, [filteredTransactions, transactions]);

  // Generate payment schedule
  const paymentSchedule = useMemo(() => {
    const plan = PAYMENT_PLANS[selectedPaymentPlan as keyof typeof PAYMENT_PLANS];
    if (!plan) return [];

    const startDate = new Date(constructionStartDate);
    const monthsPerMilestone = Math.floor(constructionMonths / (plan.milestones.length - 1));

    return plan.milestones.map((m, idx) => {
      let date: Date;
      if (idx === 0) {
        date = startDate;
      } else if (m.milestone.includes("Handover") && !m.milestone.includes("Post")) {
        date = addMonths(startDate, constructionMonths);
      } else if (m.milestone.includes("Post-Handover")) {
        const postMonths = parseInt(m.milestone.match(/\d+/)?.[0] || "0");
        date = addMonths(startDate, constructionMonths + postMonths);
      } else {
        date = addMonths(startDate, idx * monthsPerMilestone);
      }

      return {
        installment: idx + 1,
        milestone: m.milestone,
        percentage: m.percentage,
        date: date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        amount: (propertyPrice * m.percentage) / 100,
      };
    });
  }, [selectedPaymentPlan, propertyPrice, constructionStartDate, constructionMonths]);

  // Calculate mortgage
  const mortgageCalc = useMemo(() => {
    const loanAmount = propertyPrice * (1 - downPayment / 100);
    return {
      loanAmount,
      ...calculateMortgage(loanAmount, mortgageRate, mortgageYears),
    };
  }, [propertyPrice, downPayment, mortgageRate, mortgageYears]);

  const hasSelection = selectedRegion !== "all" || selectedPropertyType !== "all" || selectedBedrooms !== "all" || selectedSaleType !== "all";

  return (
    <div className="space-y-6">
      {/* Criteria Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            Custom Market Insights
          </CardTitle>
          <CardDescription>
            Select your criteria to get tailored insights for specific segments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm"
              >
                <option value="all">All Regions</option>
                {filterOptions.regions.map((r) => (
                  <option key={r} value={r}>
                    {translate(r, "region")}
                  </option>
                ))}
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                <Home className="w-4 h-4 inline mr-1" />
                Property Type
              </label>
              <select
                value={selectedPropertyType}
                onChange={(e) => setSelectedPropertyType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm"
              >
                <option value="all">All Types</option>
                {filterOptions.propertyTypes.map((t) => (
                  <option key={t} value={t}>
                    {translate(t, "propertyType")}
                  </option>
                ))}
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                <BedDouble className="w-4 h-4 inline mr-1" />
                Bedrooms
              </label>
              <select
                value={selectedBedrooms}
                onChange={(e) => setSelectedBedrooms(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm"
              >
                <option value="all">All Sizes</option>
                {filterOptions.bedrooms.map((b) => (
                  <option key={b} value={b}>
                    {translate(b, "bedroom")}
                  </option>
                ))}
              </select>
            </div>

            {/* Sale Type */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Sale Type
              </label>
              <select
                value={selectedSaleType}
                onChange={(e) => setSelectedSaleType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm"
              >
                <option value="all">All (Ready & Off-Plan)</option>
                {filterOptions.saleTypes.map((s) => (
                  <option key={s} value={s}>
                    {translate(s, "saleType")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selection Summary */}
          {hasSelection && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-200">
                <strong>Analyzing:</strong>{" "}
                {selectedBedrooms !== "all" && `${translate(selectedBedrooms, "bedroom")} `}
                {selectedPropertyType !== "all" ? translate(selectedPropertyType, "propertyType") : "All Properties"}
                {selectedRegion !== "all" && ` in ${translate(selectedRegion, "region")}`}
                {selectedSaleType !== "all" && ` (${translate(selectedSaleType, "saleType")})`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Results */}
      {insights ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Avg Price/SQM</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      AED {formatNumber(insights.avgPricePerSqm)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Range: {formatNumber(insights.minPricePerSqm)} - {formatNumber(insights.maxPricePerSqm)}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-500/20 rounded-full">
                    <DollarSign className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800 to-slate-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Avg Total Price</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      AED {formatNumber(insights.avgTotalPrice)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Median: AED {formatNumber(insights.medianTotalPrice)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500/20 rounded-full">
                    <Home className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800 to-slate-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">YoY Growth</p>
                    <p className={`text-2xl font-bold mt-1 ${insights.yoyGrowth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {insights.yoyGrowth >= 0 ? "+" : ""}{insights.yoyGrowth.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      CAGR: {insights.cagr.toFixed(1)}%
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${insights.yoyGrowth >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
                    {insights.yoyGrowth >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-rose-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800 to-slate-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">vs Market Avg</p>
                    <p className={`text-2xl font-bold mt-1 ${insights.priceVsMarket >= 0 ? "text-amber-400" : "text-blue-400"}`}>
                      {insights.priceVsMarket >= 0 ? "+" : ""}{insights.priceVsMarket.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {insights.count.toLocaleString()} transactions
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-full">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Price Trend (Selected Segment)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={insights.priceByYear}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`AED ${formatNumber(value)}/sqm`, "Avg Price"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgPrice"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Investment Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Investment Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Growth Outlook */}
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Growth Outlook</h4>
                  <div className="flex items-center gap-2">
                    {insights.cagr > 5 ? (
                      <>
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        <span className="text-emerald-400 font-medium">Strong</span>
                      </>
                    ) : insights.cagr > 2 ? (
                      <>
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="text-amber-400 font-medium">Moderate</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 rounded-full bg-rose-400" />
                        <span className="text-rose-400 font-medium">Weak</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {insights.cagr.toFixed(1)}% compound annual growth rate
                  </p>
                </div>

                {/* Price Position */}
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Price Position</h4>
                  <div className="flex items-center gap-2">
                    {insights.priceVsMarket > 20 ? (
                      <>
                        <div className="w-3 h-3 rounded-full bg-rose-400" />
                        <span className="text-rose-400 font-medium">Premium</span>
                      </>
                    ) : insights.priceVsMarket > -10 ? (
                      <>
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="text-amber-400 font-medium">Market Rate</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        <span className="text-emerald-400 font-medium">Value</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {Math.abs(insights.priceVsMarket).toFixed(1)}% {insights.priceVsMarket >= 0 ? "above" : "below"} market average
                  </p>
                </div>

                {/* Volume Activity */}
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Market Activity</h4>
                  <div className="flex items-center gap-2">
                    {insights.count > 1000 ? (
                      <>
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        <span className="text-emerald-400 font-medium">High</span>
                      </>
                    ) : insights.count > 100 ? (
                      <>
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="text-amber-400 font-medium">Moderate</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 rounded-full bg-rose-400" />
                        <span className="text-rose-400 font-medium">Low</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {insights.count.toLocaleString()} transactions recorded
                  </p>
                </div>
              </div>

              {/* Recommendation */}
              <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Key Insights
                </h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Average property size: {insights.avgArea > 0 ? `${insights.avgArea.toFixed(0)} sqm` : "N/A"}</li>
                  <li>• Price range: AED {formatNumber(insights.minTotalPrice)} - {formatNumber(insights.maxTotalPrice)}</li>
                  <li>• Total growth since 2019: {insights.totalGrowth >= 0 ? "+" : ""}{insights.totalGrowth.toFixed(1)}%</li>
                  {insights.yoyGrowth > 10 && (
                    <li className="text-amber-400">• ⚠️ High YoY growth ({insights.yoyGrowth.toFixed(1)}%) - prices may be peaking</li>
                  )}
                  {insights.priceVsMarket < -15 && (
                    <li className="text-emerald-400">• ✓ Below market average - potential value opportunity</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No data available for the selected criteria.</p>
            <p className="text-sm mt-2">Try adjusting your filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Off-Plan Payment Calculator */}
      {(selectedSaleType === "على المخطط" || selectedSaleType === "all") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" />
              Off-Plan Payment Schedule Calculator
            </CardTitle>
            <CardDescription>
              Simulate payment schedules for off-plan properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calculator Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Property Price (AED)
                  </label>
                  <input
                    type="number"
                    value={propertyPrice}
                    onChange={(e) => setPropertyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Payment Plan
                  </label>
                  <select
                    value={selectedPaymentPlan}
                    onChange={(e) => setSelectedPaymentPlan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                  >
                    {Object.entries(PAYMENT_PLANS).map(([key, plan]) => (
                      <option key={key} value={key}>
                        {plan.name} - {plan.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Construction Start
                    </label>
                    <input
                      type="date"
                      value={constructionStartDate}
                      onChange={(e) => setConstructionStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Construction Period (months)
                    </label>
                    <input
                      type="number"
                      value={constructionMonths}
                      onChange={(e) => setConstructionMonths(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Schedule Table */}
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-3">
                  Payment Schedule: {PAYMENT_PLANS[selectedPaymentPlan as keyof typeof PAYMENT_PLANS]?.name}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 text-slate-400 font-medium">Inst.</th>
                        <th className="text-left py-2 text-slate-400 font-medium">Milestone</th>
                        <th className="text-right py-2 text-slate-400 font-medium">%</th>
                        <th className="text-right py-2 text-slate-400 font-medium">Date</th>
                        <th className="text-right py-2 text-slate-400 font-medium">Amount (AED)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentSchedule.map((p) => (
                        <tr key={p.installment} className="border-b border-slate-800">
                          <td className="py-2 text-slate-300">{p.installment}</td>
                          <td className="py-2 text-slate-300">{p.milestone}</td>
                          <td className="py-2 text-right text-slate-300">{p.percentage}%</td>
                          <td className="py-2 text-right text-slate-400">{p.date}</td>
                          <td className="py-2 text-right text-white font-medium">
                            {formatNumber(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-600">
                        <td colSpan={2} className="py-2 text-slate-300 font-medium">Total</td>
                        <td className="py-2 text-right text-slate-300 font-medium">100%</td>
                        <td></td>
                        <td className="py-2 text-right text-amber-400 font-bold">
                          {formatNumber(propertyPrice)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mortgage Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-emerald-400" />
            Mortgage Calculator
          </CardTitle>
          <CardDescription>
            Estimate your monthly mortgage payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Property Price (AED)
                </label>
                <input
                  type="number"
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Down Payment: {downPayment}%
                </label>
                <input
                  type="range"
                  min="15"
                  max="50"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>15%</span>
                  <span>AED {formatNumber(propertyPrice * downPayment / 100)}</span>
                  <span>50%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Interest Rate: {mortgageRate}%
                </label>
                <input
                  type="range"
                  min="3"
                  max="8"
                  step="0.1"
                  value={mortgageRate}
                  onChange={(e) => setMortgageRate(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>3%</span>
                  <span>8%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Loan Term: {mortgageYears} years
                </label>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={mortgageYears}
                  onChange={(e) => setMortgageYears(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>5 years</span>
                  <span>25 years</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-xl border border-emerald-500/30">
                <p className="text-sm text-emerald-300 mb-1">Monthly Payment</p>
                <p className="text-4xl font-bold text-white">
                  AED {formatNumber(mortgageCalc.monthlyPayment)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-400">Loan Amount</p>
                  <p className="text-lg font-semibold text-white">
                    AED {formatNumber(mortgageCalc.loanAmount)}
                  </p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-400">Down Payment</p>
                  <p className="text-lg font-semibold text-white">
                    AED {formatNumber(propertyPrice * downPayment / 100)}
                  </p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-400">Total Interest</p>
                  <p className="text-lg font-semibold text-rose-400">
                    AED {formatNumber(mortgageCalc.totalInterest)}
                  </p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-400">Total Payment</p>
                  <p className="text-lg font-semibold text-white">
                    AED {formatNumber(mortgageCalc.totalPayment)}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-500 p-3 bg-slate-800/30 rounded-lg">
                <p>* UAE mortgage rates typically range from 3.5% to 5.5% for residents</p>
                <p>* Maximum LTV is usually 80% for residents, 75% for non-residents</p>
                <p>* Additional costs: 4% DLD fee, 2% broker fee, valuation, insurance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

