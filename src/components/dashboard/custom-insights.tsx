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
  Calculator,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Building2,
  Percent,
  Plus,
  Trash2,
  Calendar,
  Banknote,
  PiggyBank,
  ArrowUpRight,
} from "lucide-react";

interface CustomInsightsProps {
  transactions: Transaction[];
}

interface CustomMilestone {
  id: string;
  name: string;
  percentage: number;
  date: string;
}

function calculateMortgage(principal: number, annualRate: number, years: number) {
  if (principal <= 0 || annualRate <= 0 || years <= 0) {
    return { monthlyPayment: 0, totalPayment: 0, totalInterest: 0 };
  }
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  const monthlyPayment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - principal;
  return { monthlyPayment, totalPayment, totalInterest };
}

export function CustomInsights({ transactions }: CustomInsightsProps) {
  // Filter states
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("all");
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>("all");
  const [selectedSaleType, setSelectedSaleType] = useState<string>("all");

  // Off-plan calculator states
  const [propertyPrice, setPropertyPrice] = useState<number>(2000000);
  const [propertyArea, setPropertyArea] = useState<number>(150); // sqm
  const [handoverDate, setHandoverDate] = useState<string>("2028-12-31");
  const [milestones, setMilestones] = useState<CustomMilestone[]>([
    { id: "1", name: "Booking", percentage: 10, date: new Date().toISOString().split("T")[0] },
    { id: "2", name: "SPA Signing", percentage: 10, date: "" },
    { id: "3", name: "During Construction", percentage: 30, date: "" },
    { id: "4", name: "Upon Handover", percentage: 50, date: "" },
  ]);

  // Service charge & rent states
  const [serviceChargePerSqm, setServiceChargePerSqm] = useState<number>(15); // AED per sqm per year
  const [expectedRentPerYear, setExpectedRentPerYear] = useState<number>(100000); // AED

  // Mortgage calculator states (only for handover amount)
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
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

  // Calculate forecasted value at handover
  const forecastedValue = useMemo(() => {
    if (!insights || insights.priceByYear.length < 2) return null;

    const handoverYear = new Date(handoverDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const yearsToHandover = handoverYear - currentYear;

    if (yearsToHandover <= 0) return propertyPrice;

    // Use CAGR to forecast
    const currentPricePerSqm = insights.avgPricePerSqm;
    const annualGrowthRate = insights.cagr / 100;
    const forecastedPricePerSqm = currentPricePerSqm * Math.pow(1 + annualGrowthRate, yearsToHandover);
    
    return forecastedPricePerSqm * propertyArea;
  }, [insights, handoverDate, propertyPrice, propertyArea]);

  // Calculate total percentage from milestones
  const totalPercentage = useMemo(() => {
    return milestones.reduce((sum, m) => sum + m.percentage, 0);
  }, [milestones]);

  // Find handover milestone (last one or the one named "Handover")
  const handoverMilestone = useMemo(() => {
    const handover = milestones.find(m => m.name.toLowerCase().includes("handover"));
    return handover || milestones[milestones.length - 1];
  }, [milestones]);

  const handoverAmount = handoverMilestone ? (propertyPrice * handoverMilestone.percentage) / 100 : 0;

  // Mortgage calculation (only on handover amount)
  const mortgageCalc = useMemo(() => {
    const downPaymentAmount = handoverAmount * (downPaymentPercent / 100);
    const loanAmount = handoverAmount - downPaymentAmount;
    const mortgage = calculateMortgage(loanAmount, mortgageRate, mortgageYears);
    return {
      handoverAmount,
      downPaymentAmount,
      loanAmount,
      ...mortgage,
    };
  }, [handoverAmount, downPaymentPercent, mortgageRate, mortgageYears]);

  // Service charge calculation
  const annualServiceCharge = serviceChargePerSqm * propertyArea;

  // Net rental yield calculation
  const grossRentalYield = (expectedRentPerYear / propertyPrice) * 100;
  const netRentalYield = ((expectedRentPerYear - annualServiceCharge) / propertyPrice) * 100;

  // Add milestone
  const addMilestone = () => {
    const newId = Date.now().toString();
    setMilestones([...milestones, { id: newId, name: "", percentage: 0, date: "" }]);
  };

  // Remove milestone
  const removeMilestone = (id: string) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((m) => m.id !== id));
    }
  };

  // Update milestone
  const updateMilestone = (id: string, field: keyof CustomMilestone, value: string | number) => {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

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

              {/* Key Insights */}
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            Off-Plan Investment Calculator
          </CardTitle>
          <CardDescription>
            Customize your payment schedule and calculate investment returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Property Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Home className="w-4 h-4 text-amber-400" />
                Property Details
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Property Price (AED)</label>
                  <input
                    type="number"
                    value={propertyPrice}
                    onChange={(e) => setPropertyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Property Area (sqm)</label>
                  <input
                    type="number"
                    value={propertyArea}
                    onChange={(e) => setPropertyArea(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Expected Handover Date</label>
                <input
                  type="date"
                  value={handoverDate}
                  onChange={(e) => setHandoverDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>

              {/* Custom Payment Schedule */}
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    Payment Schedule
                  </h4>
                  <button
                    onClick={addMilestone}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                  >
                    <Plus className="w-3 h-3" />
                    Add Milestone
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {milestones.map((milestone, idx) => (
                    <div
                      key={milestone.id}
                      className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-800/50 rounded-lg"
                    >
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={milestone.name}
                          onChange={(e) => updateMilestone(milestone.id, "name", e.target.value)}
                          placeholder="Milestone name"
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <input
                            type="number"
                            value={milestone.percentage}
                            onChange={(e) => updateMilestone(milestone.id, "percentage", Number(e.target.value))}
                            min="0"
                            max="100"
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-xs pr-6"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="date"
                          value={milestone.date}
                          onChange={(e) => updateMilestone(milestone.id, "date", e.target.value)}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-xs text-slate-300">
                          {formatNumber((propertyPrice * milestone.percentage) / 100)}
                        </span>
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => removeMilestone(milestone.id)}
                          disabled={milestones.length <= 1}
                          className="text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                  <span className="text-sm font-medium text-slate-300">Total</span>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-bold ${totalPercentage === 100 ? "text-emerald-400" : "text-rose-400"}`}>
                      {totalPercentage}%
                    </span>
                    <span className="text-sm font-bold text-amber-400">
                      AED {formatNumber(propertyPrice)}
                    </span>
                  </div>
                </div>
                {totalPercentage !== 100 && (
                  <p className="text-xs text-rose-400 mt-1">
                    ⚠️ Total should equal 100% (currently {totalPercentage}%)
                  </p>
                )}
              </div>
            </div>

            {/* Calculations & Results */}
            <div className="space-y-4">
              {/* Service Charge & Rent */}
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-400" />
                Running Costs & Income
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Service Charge (AED/sqm/year)</label>
                  <input
                    type="number"
                    value={serviceChargePerSqm}
                    onChange={(e) => setServiceChargePerSqm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Expected Annual Rent (AED)</label>
                  <input
                    type="number"
                    value={expectedRentPerYear}
                    onChange={(e) => setExpectedRentPerYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              {/* Annual Calculations */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-400">Annual Service Charge</p>
                  <p className="text-lg font-bold text-white">AED {formatNumber(annualServiceCharge)}</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-400">Gross Rental Yield</p>
                  <p className="text-lg font-bold text-emerald-400">{grossRentalYield.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-400">Net Rental Yield</p>
                  <p className="text-lg font-bold text-emerald-400">{netRentalYield.toFixed(1)}%</p>
                </div>
              </div>

              {/* Forecasted Value at Handover */}
              {forecastedValue && insights && (
                <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight className="w-4 h-4 text-purple-400" />
                    <h4 className="text-sm font-semibold text-white">Forecasted Value at Handover</h4>
                  </div>
                  <p className="text-2xl font-bold text-white">AED {formatNumber(forecastedValue)}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Based on {insights.cagr.toFixed(1)}% CAGR to {new Date(handoverDate).getFullYear()}
                  </p>
                  {forecastedValue > propertyPrice && (
                    <p className="text-sm text-emerald-400 mt-2">
                      Potential appreciation: +AED {formatNumber(forecastedValue - propertyPrice)} ({((forecastedValue - propertyPrice) / propertyPrice * 100).toFixed(1)}%)
                    </p>
                  )}
                </div>
              )}

              {/* Mortgage Section */}
              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                  <PiggyBank className="w-4 h-4 text-blue-400" />
                  Mortgage Calculator (Handover Amount Only)
                </h4>
                
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                  <p className="text-xs text-blue-300">
                    💡 Off-plan properties cannot be financed until handover. The mortgage below calculates financing for the <strong>handover payment only</strong> (AED {formatNumber(handoverAmount)} = {handoverMilestone?.percentage || 0}%).
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Down Payment on Handover Amount: {downPaymentPercent}%
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="50"
                      value={downPaymentPercent}
                      onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>15%</span>
                      <span>AED {formatNumber(mortgageCalc.downPaymentAmount)}</span>
                      <span>50%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
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
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
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
                  </div>
                </div>

                {/* Mortgage Results */}
                <div className="mt-4 p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-xl border border-emerald-500/30">
                  <p className="text-xs text-emerald-300 mb-1">Monthly Mortgage Payment</p>
                  <p className="text-3xl font-bold text-white">
                    AED {formatNumber(mortgageCalc.monthlyPayment)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400">Loan Amount</p>
                    <p className="text-sm font-semibold text-white">
                      AED {formatNumber(mortgageCalc.loanAmount)}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400">Total Interest</p>
                    <p className="text-sm font-semibold text-rose-400">
                      AED {formatNumber(mortgageCalc.totalInterest)}
                    </p>
                  </div>
                </div>

                {/* Total Investment Summary */}
                <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                  <h4 className="text-sm font-medium text-white mb-3">Total Investment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pre-Handover Payments (Cash Required)</span>
                      <span className="text-white font-medium">AED {formatNumber(propertyPrice - handoverAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Handover Down Payment</span>
                      <span className="text-white font-medium">AED {formatNumber(mortgageCalc.downPaymentAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                      <span className="text-slate-300 font-medium">Total Cash Required</span>
                      <span className="text-amber-400 font-bold">
                        AED {formatNumber(propertyPrice - handoverAmount + mortgageCalc.downPaymentAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Financed Amount</span>
                      <span className="text-white font-medium">AED {formatNumber(mortgageCalc.loanAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
