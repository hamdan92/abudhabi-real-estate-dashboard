"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { YearlyData, RegionData } from "@/types";
import { forecastValues } from "@/lib/forecasting";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Home,
  Calendar,
  DollarSign,
  Percent,
  ArrowRight,
  Sparkles,
  Building,
  MapPin,
} from "lucide-react";

interface WhatIfCalculatorProps {
  yearlyData: YearlyData[];
  regionData: RegionData[];
}

interface ScenarioResult {
  purchasePrice: number;
  futureValue: number;
  appreciation: number;
  appreciationPercent: number;
  annualReturn: number;
  rentalYield: number;
  totalRentalIncome: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export function WhatIfCalculator({ yearlyData, regionData }: WhatIfCalculatorProps) {
  // Input states
  const [propertySize, setPropertySize] = useState<number>(100);
  const [selectedRegion, setSelectedRegion] = useState<string>(regionData[0]?.region || "");
  const [holdingPeriod, setHoldingPeriod] = useState<number>(5);
  const [downPayment, setDownPayment] = useState<number>(20);
  const [expectedRentalYield, setExpectedRentalYield] = useState<number>(6);

  // Get region price data
  const regionPrice = useMemo(() => {
    const region = regionData.find((r) => r.region === selectedRegion);
    return region?.avgPricePerSqm || 15000;
  }, [regionData, selectedRegion]);

  // Calculate forecast growth rate
  const forecasts = useMemo(() => forecastValues(yearlyData, 5), [yearlyData]);
  const avgAnnualGrowth = useMemo(() => {
    const lastPrice = yearlyData[yearlyData.length - 1]?.medianPricePerSqm || 15000;
    const forecastPrice = forecasts[forecasts.length - 1]?.predictedPrice || lastPrice;
    return ((forecastPrice / lastPrice) ** (1 / 5) - 1) * 100;
  }, [yearlyData, forecasts]);

  // Calculate scenario
  const scenario = useMemo((): ScenarioResult => {
    const purchasePrice = propertySize * regionPrice;
    const annualGrowthRate = avgAnnualGrowth / 100;
    const futureValue = purchasePrice * Math.pow(1 + annualGrowthRate, holdingPeriod);
    const appreciation = futureValue - purchasePrice;
    const appreciationPercent = (appreciation / purchasePrice) * 100;
    const annualReturn = appreciationPercent / holdingPeriod;

    const rentalYield = expectedRentalYield;
    const annualRental = purchasePrice * (rentalYield / 100);
    const totalRentalIncome = annualRental * holdingPeriod;

    const totalReturn = appreciation + totalRentalIncome;
    const totalReturnPercent = (totalReturn / purchasePrice) * 100;

    return {
      purchasePrice,
      futureValue,
      appreciation,
      appreciationPercent,
      annualReturn,
      rentalYield,
      totalRentalIncome,
      totalReturn,
      totalReturnPercent,
    };
  }, [propertySize, regionPrice, holdingPeriod, avgAnnualGrowth, expectedRentalYield]);

  // Mortgage calculation
  const mortgageDetails = useMemo(() => {
    const loanAmount = scenario.purchasePrice * (1 - downPayment / 100);
    const interestRate = 4.5 / 100 / 12; // Monthly rate
    const numPayments = holdingPeriod * 12;
    const monthlyPayment =
      (loanAmount * interestRate * Math.pow(1 + interestRate, numPayments)) /
      (Math.pow(1 + interestRate, numPayments) - 1);
    const totalPayments = monthlyPayment * numPayments;
    const totalInterest = totalPayments - loanAmount;

    return {
      downPaymentAmount: scenario.purchasePrice * (downPayment / 100),
      loanAmount,
      monthlyPayment,
      totalPayments,
      totalInterest,
    };
  }, [scenario.purchasePrice, downPayment, holdingPeriod]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-400" />
          Investment Scenario Calculator
        </CardTitle>
        <CardDescription>
          Simulate different purchase scenarios and see projected returns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Configure Your Scenario
            </h3>

            {/* Region Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {regionData.slice(0, 15).map((region) => (
                  <option key={region.region} value={region.region}>
                    {region.region} (AED {formatNumber(region.avgPricePerSqm)}/sqm)
                  </option>
                ))}
              </select>
            </div>

            {/* Property Size */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Building className="w-4 h-4 inline mr-1" />
                Property Size (sqm)
              </label>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={propertySize}
                onChange={(e) => setPropertySize(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-sm text-slate-400 mt-1">
                <span>50 sqm</span>
                <span className="font-bold text-amber-400">{propertySize} sqm</span>
                <span>500 sqm</span>
              </div>
            </div>

            {/* Holding Period */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Holding Period (years)
              </label>
              <div className="flex gap-2">
                {[1, 3, 5, 7, 10].map((year) => (
                  <button
                    key={year}
                    onClick={() => setHoldingPeriod(year)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      holdingPeriod === year
                        ? "bg-amber-500 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {year}Y
                  </button>
                ))}
              </div>
            </div>

            {/* Down Payment */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Down Payment (%)
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-sm text-slate-400 mt-1">
                <span>10%</span>
                <span className="font-bold text-amber-400">{downPayment}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Expected Rental Yield */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Percent className="w-4 h-4 inline mr-1" />
                Expected Rental Yield (%)
              </label>
              <input
                type="range"
                min="3"
                max="10"
                step="0.5"
                value={expectedRentalYield}
                onChange={(e) => setExpectedRentalYield(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-sm text-slate-400 mt-1">
                <span>3%</span>
                <span className="font-bold text-amber-400">{expectedRentalYield}%</span>
                <span>10%</span>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Projected Returns
            </h3>

            {/* Purchase Summary */}
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-3">Purchase Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Property Value</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(scenario.purchasePrice, true)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Price/SQM</p>
                  <p className="text-xl font-bold text-amber-400">
                    AED {formatNumber(regionPrice)}
                  </p>
                </div>
              </div>
            </div>

            {/* Appreciation Projection */}
            <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Capital Appreciation ({holdingPeriod} years)
              </h4>
              <div className="flex items-center justify-between mb-2">
                <div className="text-center">
                  <p className="text-xs text-slate-400">Today</p>
                  <p className="text-lg font-bold text-white">
                    {formatCurrency(scenario.purchasePrice, true)}
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-emerald-400" />
                <div className="text-center">
                  <p className="text-xs text-slate-400">Year {holdingPeriod}</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {formatCurrency(scenario.futureValue, true)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-emerald-500/20">
                <div>
                  <p className="text-xs text-slate-400">Appreciation</p>
                  <p className="text-lg font-bold text-emerald-400">
                    +{formatCurrency(scenario.appreciation, true)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Annual Return</p>
                  <p className="text-lg font-bold text-emerald-400">
                    +{scenario.annualReturn.toFixed(1)}%/year
                  </p>
                </div>
              </div>
            </div>

            {/* Rental Income */}
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                <Home className="w-4 h-4" />
                Rental Income ({holdingPeriod} years)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Annual Rental</p>
                  <p className="text-lg font-bold text-white">
                    {formatCurrency(scenario.purchasePrice * (expectedRentalYield / 100), true)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total ({holdingPeriod}Y)</p>
                  <p className="text-lg font-bold text-blue-400">
                    +{formatCurrency(scenario.totalRentalIncome, true)}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Returns */}
            <div className="p-4 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-lg border border-amber-500/30">
              <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Total Projected Return
              </h4>
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-400">
                  +{formatCurrency(scenario.totalReturn, true)}
                </p>
                <p className="text-lg text-amber-300">
                  +{scenario.totalReturnPercent.toFixed(1)}% total return
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  ({(scenario.totalReturnPercent / holdingPeriod).toFixed(1)}% annually)
                </p>
              </div>
            </div>

            {/* Mortgage Details (if not 100% down) */}
            {downPayment < 100 && (
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Mortgage Breakdown</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Down Payment</p>
                    <p className="font-medium text-white">
                      {formatCurrency(mortgageDetails.downPaymentAmount, true)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Loan Amount</p>
                    <p className="font-medium text-white">
                      {formatCurrency(mortgageDetails.loanAmount, true)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Monthly Payment</p>
                    <p className="font-medium text-white">
                      AED {formatNumber(mortgageDetails.monthlyPayment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Interest</p>
                    <p className="font-medium text-rose-400">
                      {formatCurrency(mortgageDetails.totalInterest, true)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  * Based on 4.5% interest rate
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 mt-6 text-center">
          * Projections are based on historical market trends and assumed growth rate of {avgAnnualGrowth.toFixed(1)}%/year.
          Actual returns may vary significantly. This is not financial advice.
        </p>
      </CardContent>
    </Card>
  );
}

