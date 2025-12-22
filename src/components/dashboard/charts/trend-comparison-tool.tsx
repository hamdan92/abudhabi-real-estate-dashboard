"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Transaction, UnitTransaction, YearlyData } from "@/types";
import { formatNumber } from "@/lib/utils";
import { translate, translateProject } from "@/lib/translations";
import { identifyResales } from "@/lib/resale-analysis";
import { ensembleForecast, holtLinearSmoothing } from "@/lib/forecasting";
import { Plus, X, TrendingUp, Layers, Download, FileSpreadsheet, BarChart3, Activity, Target, Gauge, Repeat, Clock, DollarSign, Percent, Sparkles, Info, ChevronDown, ChevronUp } from "lucide-react";

// Color palette for comparison lines
const LINE_COLORS = [
  "#f59e0b", // Amber
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#06b6d4", // Cyan
];

interface Segment {
  id: string;
  name: string;
  region: string;
  propertyType: string;
  bedrooms: string;
  saleType: string;
  projects: string[]; // Array of project names (empty = all projects)
  color: string;
}

interface TrendComparisonToolProps {
  transactions: Transaction[];
}

// Get unique values from transactions
function getUniqueValues(transactions: Transaction[], field: keyof Transaction): string[] {
  const values = new Set<string>();
  transactions.forEach((t) => {
    const val = t[field];
    if (val && typeof val === "string") {
      values.add(val);
    }
  });
  return Array.from(values).sort();
}

// Filter transactions based on segment criteria
function filterTransactionsForSegment(
  transactions: Transaction[],
  segment: { region: string; propertyType: string; bedrooms: string; saleType: string; projects?: string[] }
): Transaction[] {
  let filtered = transactions.filter((t) => t.assetCategory === "سكني" && t.pricePerSqm > 0);
  
  if (segment.region !== "all") {
    filtered = filtered.filter((t) => t.region === segment.region);
  }
  if (segment.propertyType !== "all") {
    filtered = filtered.filter((t) => t.propertyType === segment.propertyType);
  }
  if (segment.saleType !== "all") {
    filtered = filtered.filter((t) => t.saleType === segment.saleType);
  }
  // Filter by projects if specified
  if (segment.projects && segment.projects.length > 0) {
    filtered = filtered.filter((t) => t.project && segment.projects!.includes(t.project));
  }
  if (segment.bedrooms !== "all") {
    filtered = filtered.filter((t) => {
      const design = t.propertyDesign || "";
      if (segment.bedrooms === "Studio") return design.includes("استوديو") || design.includes("ستوديو") || design.toLowerCase().includes("studio");
      if (segment.bedrooms === "1 BR") return design.includes("غرفة نوم واحدة") || design.includes("1 غرفة") || design.includes("١");
      if (segment.bedrooms === "2 BR") return design.includes("غرفتين") || design.includes("2 غرف") || design.includes("٢");
      if (segment.bedrooms === "3 BR") return design.includes("3 غرف") || design.includes("٣");
      if (segment.bedrooms === "4 BR") return design.includes("4 غرف") || design.includes("٤");
      if (segment.bedrooms === "5 BR") return design.includes("5 غرف") || design.includes("٥");
      if (segment.bedrooms === "6+ BR") return design.includes("6 غرف") || design.includes("٦") || design.includes("7") || design.includes("٧");
      return true;
    });
  }
  
  return filtered;
}

// Export transactions to CSV
function exportToCSV(transactions: Transaction[], filename: string, segmentName: string) {
  // Define columns to export with English headers
  const headers = [
    "Registration Date",
    "Year",
    "Region",
    "Region (EN)",
    "Property Type",
    "Property Type (EN)",
    "Property Design",
    "Sale Type",
    "Sale Type (EN)",
    "Market Type",
    "Project",
    "Sold Area (sqm)",
    "Land Area (sqm)",
    "Total Price (AED)",
    "Price per SQM (AED)",
  ];
  
  const rows = transactions.map((t) => [
    t.registrationDate || "",
    t.year || "",
    t.region || "",
    translate(t.region, "region"),
    t.propertyType || "",
    translate(t.propertyType, "propertyType"),
    t.propertyDesign || "",
    t.saleType || "",
    translate(t.saleType, "saleType"),
    t.marketType || "",
    t.project || "",
    t.soldArea || "",
    t.landArea || "",
    t.totalPrice || "",
    t.pricePerSqm ? t.pricePerSqm.toFixed(2) : "",
  ]);
  
  // Create CSV content
  const csvContent = [
    `# Segment: ${segmentName}`,
    `# Total Transactions: ${transactions.length}`,
    `# Export Date: ${new Date().toISOString()}`,
    "",
    headers.join(","),
    ...rows.map((row) => 
      row.map((cell) => {
        // Escape quotes and wrap in quotes if contains comma or quote
        const str = String(cell);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(",")
    ),
  ].join("\n");
  
  // Download file
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Export chart summary data to CSV
function exportChartSummary(
  chartData: Record<string, string | number | null>[],
  segments: { id: string; name: string }[],
  filename: string
) {
  const headers = ["Year", ...segments.map((s) => `${s.name} (AED/sqm)`)];
  
  const rows = chartData.map((d) => [
    d.year,
    ...segments.map((s) => {
      const val = d[s.id];
      return val !== null && val !== undefined && typeof val === 'number' ? val.toFixed(2) : "";
    }),
  ]);
  
  const csvContent = [
    "# Trend Comparison Chart Data",
    `# Export Date: ${new Date().toISOString()}`,
    "",
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");
  
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function TrendComparisonTool({ transactions }: TrendComparisonToolProps) {
  const [segments, setSegments] = useState<Segment[]>([
    {
      id: "overall",
      name: "Overall Market",
      region: "all",
      propertyType: "all",
      bedrooms: "all",
      saleType: "all",
      projects: [],
      color: LINE_COLORS[0],
    },
  ]);

  const [isAddingSegment, setIsAddingSegment] = useState(false);
  const [newSegment, setNewSegment] = useState<Partial<Segment>>({
    region: "all",
    propertyType: "all",
    bedrooms: "all",
    saleType: "all",
    projects: [],
  });
  
  // State for project search/filter
  const [projectSearch, setProjectSearch] = useState("");
  
  // Forecasting state
  const [showForecast, setShowForecast] = useState(false);
  const [forecastYears, setForecastYears] = useState(3);
  const [showForecastInfo, setShowForecastInfo] = useState(false);

  // Get filter options
  const filterOptions = useMemo(() => {
    // Count by property type to sort by frequency
    const propertyTypeCounts = new Map<string, number>();
    const regionCounts = new Map<string, number>();
    const projectCounts = new Map<string, number>();
    
    transactions.forEach((t) => {
      if (t.propertyType) {
        propertyTypeCounts.set(t.propertyType, (propertyTypeCounts.get(t.propertyType) || 0) + 1);
      }
      if (t.region) {
        regionCounts.set(t.region, (regionCounts.get(t.region) || 0) + 1);
      }
      if (t.project) {
        projectCounts.set(t.project, (projectCounts.get(t.project) || 0) + 1);
      }
    });

    return {
      regions: [...regionCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([r]) => r),
      propertyTypes: [...propertyTypeCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([t]) => t),
      bedrooms: ["Studio", "1 BR", "2 BR", "3 BR", "4 BR", "5 BR", "6+ BR"],
      saleTypes: getUniqueValues(transactions, "saleType").slice(0, 5),
      projects: [...projectCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([p, count]) => ({ name: p, count })),
    };
  }, [transactions]);

  // Filter projects based on selected region and search term
  const filteredProjects = useMemo(() => {
    let projects = filterOptions.projects;
    
    // Filter by region if one is selected
    if (newSegment.region && newSegment.region !== "all") {
      const regionProjects = new Set<string>();
      transactions.forEach((t) => {
        if (t.region === newSegment.region && t.project) {
          regionProjects.add(t.project);
        }
      });
      projects = projects.filter((p) => regionProjects.has(p.name));
    }
    
    // Filter by search term
    if (projectSearch) {
      const searchLower = projectSearch.toLowerCase();
      projects = projects.filter((p) => 
        p.name.toLowerCase().includes(searchLower)
      );
    }
    
    return projects.slice(0, 50); // Limit to 50 for performance
  }, [filterOptions.projects, newSegment.region, projectSearch, transactions]);

  // Helper function to filter transactions for a segment and year
  const filterSegmentYear = (segment: Segment, year?: number) => {
    let filtered = transactions.filter((t) => t.assetCategory === "سكني");
    
    if (year !== undefined) {
      filtered = filtered.filter((t) => t.year === year);
    }
    if (segment.region !== "all") {
      filtered = filtered.filter((t) => t.region === segment.region);
    }
    if (segment.propertyType !== "all") {
      filtered = filtered.filter((t) => t.propertyType === segment.propertyType);
    }
    // Filter by projects if specified
    if (segment.projects && segment.projects.length > 0) {
      filtered = filtered.filter((t) => t.project && segment.projects.includes(t.project));
    }
    if (segment.bedrooms !== "all") {
      filtered = filtered.filter((t) => {
        const design = t.propertyDesign || "";
        if (segment.bedrooms === "Studio") return design.includes("استوديو") || design.includes("ستوديو") || design.toLowerCase().includes("studio");
        if (segment.bedrooms === "1 BR") return design.includes("غرفة نوم واحدة") || design.includes("1 غرفة") || design.includes("١");
        if (segment.bedrooms === "2 BR") return design.includes("غرفتين") || design.includes("2 غرف") || design.includes("٢");
        if (segment.bedrooms === "3 BR") return design.includes("3 غرف") || design.includes("٣");
        if (segment.bedrooms === "4 BR") return design.includes("4 غرف") || design.includes("٤");
        if (segment.bedrooms === "5 BR") return design.includes("5 غرف") || design.includes("٥");
        if (segment.bedrooms === "6+ BR") return design.includes("6 غرف") || design.includes("٦") || design.includes("7") || design.includes("٧");
        return true;
      });
    }
    if (segment.saleType !== "all") {
      filtered = filtered.filter((t) => t.saleType === segment.saleType);
    }
    return filtered;
  };

  // Calculate median of an array
  const calcMedian = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  // Calculate standard deviation
  const calcStdDev = (arr: number[]): number => {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };

  // Calculate all metrics for each segment by year
  const segmentMetrics = useMemo(() => {
    const years = [...new Set(transactions.map((t) => t.year))].sort();
    
    const metrics: Record<string, {
      yearly: Record<number, { 
        price: number; 
        volume: number; 
        totalValue: number;
        // Resale metrics
        resaleVolume: number;
        resaleRate: number;
        resalePrice: number;
        primaryPrice: number;
        resalePremium: number;
      }>;
      yoyGrowth: Record<number, number>;
      volatility: number;
      cagr: number;
      avgVolume: number;
      totalTransactions: number;
      // Resale aggregates
      totalResales: number;
      avgResaleRate: number;
      avgResalePremium: number;
    }> = {};
    
    segments.forEach((segment) => {
      const yearly: Record<number, { 
        price: number; 
        volume: number; 
        totalValue: number;
        resaleVolume: number;
        resaleRate: number;
        resalePrice: number;
        primaryPrice: number;
        resalePremium: number;
      }> = {};
      const prices: number[] = [];
      let totalResales = 0;
      const resaleRates: number[] = [];
      const resalePremiums: number[] = [];
      
      years.forEach((year) => {
        const filtered = filterSegmentYear(segment, year);
        const yearPrices = filtered.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
        const medianPrice = calcMedian(yearPrices);
        
        // Calculate resale metrics for this year
        // Resale = marketType === "ثانوي"
        const resales = filtered.filter((t) => t.marketType === "ثانوي");
        const primaries = filtered.filter((t) => t.marketType === "أولي");
        
        const resaleVolume = resales.length;
        const resaleRate = filtered.length > 0 ? (resaleVolume / filtered.length) * 100 : 0;
        
        // Calculate avg prices for resales and primaries
        const resalePrices = resales.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
        const primaryPrices = primaries.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
        
        const resalePrice = calcMedian(resalePrices);
        const primaryPrice = calcMedian(primaryPrices);
        
        // Calculate resale premium (positive = resales cost more)
        const resalePremium = primaryPrice > 0 && resalePrice > 0
          ? ((resalePrice - primaryPrice) / primaryPrice) * 100
          : 0;
        
        yearly[year] = {
          price: medianPrice,
          volume: filtered.length,
          totalValue: filtered.reduce((sum, t) => sum + (t.totalPrice || 0), 0),
          resaleVolume,
          resaleRate,
          resalePrice,
          primaryPrice,
          resalePremium,
        };
        
        if (medianPrice > 0) prices.push(medianPrice);
        totalResales += resaleVolume;
        if (resaleRate > 0) resaleRates.push(resaleRate);
        if (resalePremium !== 0 && primaryPrice > 0 && resalePrice > 0) resalePremiums.push(resalePremium);
      });
      
      // Calculate YoY growth
      const yoyGrowth: Record<number, number> = {};
      years.forEach((year, idx) => {
        if (idx > 0 && yearly[year].price > 0 && yearly[years[idx - 1]].price > 0) {
          yoyGrowth[year] = ((yearly[year].price - yearly[years[idx - 1]].price) / yearly[years[idx - 1]].price) * 100;
        }
      });
      
      // Calculate volatility (coefficient of variation of prices)
      const volatility = prices.length > 1 
        ? (calcStdDev(prices) / (prices.reduce((a, b) => a + b, 0) / prices.length)) * 100 
        : 0;
      
      // Calculate CAGR
      const firstYearWithData = years.find((y) => yearly[y].price > 0);
      const lastYearWithData = [...years].reverse().find((y) => yearly[y].price > 0);
      let cagr = 0;
      if (firstYearWithData && lastYearWithData && firstYearWithData !== lastYearWithData) {
        const numYears = lastYearWithData - firstYearWithData;
        const startPrice = yearly[firstYearWithData].price;
        const endPrice = yearly[lastYearWithData].price;
        if (startPrice > 0 && numYears > 0) {
          cagr = (Math.pow(endPrice / startPrice, 1 / numYears) - 1) * 100;
        }
      }
      
      // Calculate average volume
      const volumes = Object.values(yearly).map((y) => y.volume);
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
      
      // Calculate resale aggregates
      const avgResaleRate = resaleRates.length > 0 
        ? resaleRates.reduce((a, b) => a + b, 0) / resaleRates.length 
        : 0;
      const avgResalePremium = resalePremiums.length > 0 
        ? resalePremiums.reduce((a, b) => a + b, 0) / resalePremiums.length 
        : 0;
      
      metrics[segment.id] = {
        yearly,
        yoyGrowth,
        volatility,
        cagr,
        avgVolume,
        totalTransactions: filterSegmentYear(segment).length,
        totalResales,
        avgResaleRate,
        avgResalePremium,
      };
    });
    
    return { metrics, years };
  }, [transactions, segments]);

  // Generate chart data for all time-series charts
  const chartData = useMemo(() => {
    const { metrics, years } = segmentMetrics;
    
    return years.map((year) => {
      const dataPoint: Record<string, number | string | null> = { year };
      
      segments.forEach((segment) => {
        const m = metrics[segment.id];
        if (!m) return;
        
        // Price data
        dataPoint[segment.id] = m.yearly[year]?.price || 0;
        // YoY growth data (with _yoy suffix)
        dataPoint[`${segment.id}_yoy`] = m.yoyGrowth[year] ?? null;
        // Volume data (with _vol suffix)
        dataPoint[`${segment.id}_vol`] = m.yearly[year]?.volume || 0;
        
        // Resale metrics
        dataPoint[`${segment.id}_resaleVol`] = m.yearly[year]?.resaleVolume || 0;
        dataPoint[`${segment.id}_resaleRate`] = m.yearly[year]?.resaleRate || 0;
        dataPoint[`${segment.id}_resalePremium`] = m.yearly[year]?.resalePremium ?? null;
        dataPoint[`${segment.id}_resalePrice`] = m.yearly[year]?.resalePrice || 0;
        dataPoint[`${segment.id}_primaryPrice`] = m.yearly[year]?.primaryPrice || 0;
      });
      
      return dataPoint;
    });
  }, [segmentMetrics, segments]);

  // Generate comparison bar data for CAGR and Volatility
  const comparisonBarData = useMemo(() => {
    const { metrics } = segmentMetrics;
    
    return segments.map((segment) => {
      const m = metrics[segment.id];
      return {
        name: segment.name,
        id: segment.id,
        color: segment.color,
        cagr: m?.cagr || 0,
        volatility: m?.volatility || 0,
        avgVolume: m?.avgVolume || 0,
        totalTransactions: m?.totalTransactions || 0,
        // Resale metrics
        totalResales: m?.totalResales || 0,
        avgResaleRate: m?.avgResaleRate || 0,
        avgResalePremium: m?.avgResalePremium || 0,
      };
    });
  }, [segmentMetrics, segments]);

  // Calculate forecasts for each segment using Ensemble method
  const forecastData = useMemo(() => {
    if (!showForecast) return { chartDataWithForecast: chartData, forecasts: {} };
    
    const { metrics, years } = segmentMetrics;
    const lastYear = years[years.length - 1];
    
    // Calculate forecasts per segment using ensemble of methods
    const forecasts: Record<string, {
      priceForecasts: { year: number; predicted: number; upper: number; lower: number; confidence: string }[];
      volumeForecasts: { year: number; predicted: number; upper: number; lower: number }[];
      yoyForecasts: { year: number; predicted: number; upper: number; lower: number }[];
      mape: number;           // Mean Absolute Percentage Error
      modelInfo: string;      // Which methods contribute and their weights
      qualityRating: string;
      trend: number;          // Detected trend per year
      warnings: string[];
      methodWeights: { holt: number; linear: number; naive: number };
    }> = {};
    
    segments.forEach((segment) => {
      const m = metrics[segment.id];
      if (!m) return;
      
      // Extract price and volume values (chronological order)
      const priceValues = years
        .map(year => m.yearly[year]?.price || 0)
        .filter(p => p > 0);
      
      const volumeValues = years
        .map(year => m.yearly[year]?.volume || 0);
      
      if (priceValues.length < 3) {
        forecasts[segment.id] = {
          priceForecasts: [],
          volumeForecasts: [],
          yoyForecasts: [],
          mape: 0,
          modelInfo: "Insufficient Data",
          qualityRating: "Insufficient Data",
          trend: 0,
          warnings: ["Less than 3 data points - forecasting unavailable"],
          methodWeights: { holt: 0, linear: 0, naive: 0 },
        };
        return;
      }
      // Note: volumeForecasts and yoyForecasts now include upper/lower bounds
      
      // Use Ensemble forecasting (combines Holt's, Linear, and Naive methods)
      const priceEnsemble = ensembleForecast(priceValues, forecastYears);
      const volumeHolt = holtLinearSmoothing(volumeValues, forecastYears);
      
      // Determine quality rating based on MAPE
      const holtResult = holtLinearSmoothing(priceValues, forecastYears);
      const mape = holtResult.mape;
      
      let qualityRating = "Poor";
      if (mape < 5) qualityRating = "Excellent";
      else if (mape < 10) qualityRating = "Good";
      else if (mape < 15) qualityRating = "Fair";
      
      const warnings: string[] = [];
      if (mape > 15) {
        warnings.push("High forecast error - significant uncertainty");
      }
      if (priceValues.length < 5) {
        warnings.push("Limited data points - wider confidence intervals");
      }
      if (Math.abs(holtResult.trend) > priceValues[priceValues.length - 1] * 0.15) {
        warnings.push("Strong trend detected - extrapolation may be unreliable");
      }
      
      // Generate price forecasts
      const priceForecasts: { year: number; predicted: number; upper: number; lower: number; confidence: string }[] = [];
      
      priceEnsemble.forecasts.forEach((f, i) => {
        let confidence = "high";
        if (mape > 15 || i > 2) confidence = "low";
        else if (mape > 10 || i > 1) confidence = "medium";
        
        priceForecasts.push({
          year: lastYear + f.period,
          predicted: f.value,
          upper: f.upper,
          lower: f.lower,
          confidence,
        });
      });
      
      // Generate volume forecasts with confidence intervals
      const volumeForecasts = volumeHolt.forecasts.map(f => ({
        year: lastYear + f.period,
        predicted: Math.round(f.value),
        upper: Math.round(f.upper),
        lower: Math.max(0, Math.round(f.lower)),
      }));
      
      // Generate YoY growth forecasts with confidence intervals (derived from price forecasts)
      // YoY Growth = (currentPrice - previousPrice) / previousPrice * 100
      const yoyForecasts: { year: number; predicted: number; upper: number; lower: number }[] = [];
      const lastHistoricalPrice = priceValues[priceValues.length - 1];
      
      priceForecasts.forEach((pf, i) => {
        const prevPrice = i === 0 ? lastHistoricalPrice : priceForecasts[i - 1].predicted;
        const prevPriceUpper = i === 0 ? lastHistoricalPrice : priceForecasts[i - 1].upper;
        const prevPriceLower = i === 0 ? lastHistoricalPrice : priceForecasts[i - 1].lower;
        
        // Calculate YoY for predicted, upper, and lower bounds
        const yoyGrowth = prevPrice > 0 ? ((pf.predicted - prevPrice) / prevPrice) * 100 : 0;
        // Upper bound: optimistic price vs conservative previous
        const yoyUpper = prevPriceLower > 0 ? ((pf.upper - prevPriceLower) / prevPriceLower) * 100 : 0;
        // Lower bound: conservative price vs optimistic previous
        const yoyLower = prevPriceUpper > 0 ? ((pf.lower - prevPriceUpper) / prevPriceUpper) * 100 : 0;
        
        yoyForecasts.push({
          year: pf.year,
          predicted: yoyGrowth,
          upper: Math.max(yoyGrowth, yoyUpper),  // Ensure upper >= predicted
          lower: Math.min(yoyGrowth, yoyLower),  // Ensure lower <= predicted
        });
      });
      
      forecasts[segment.id] = {
        priceForecasts,
        volumeForecasts,
        yoyForecasts,
        mape,
        modelInfo: priceEnsemble.modelInfo,
        qualityRating,
        trend: holtResult.trend,
        warnings,
        methodWeights: {
          holt: priceEnsemble.methods.holt.weight,
          linear: priceEnsemble.methods.linear.weight,
          naive: priceEnsemble.methods.naive.weight,
        },
      };
    });
    
    // Combine historical data with forecasts for charts
    const forecastYearList = Array.from({ length: forecastYears }, (_, i) => lastYear + i + 1);
    const allYears = [...years, ...forecastYearList];
    
    const chartDataWithForecast = allYears.map((year) => {
      const isForecast = year > lastYear;
      const dataPoint: Record<string, number | string | null | boolean> = { 
        year,
        isForecast,
      };
      
      segments.forEach((segment) => {
        const m = metrics[segment.id];
        const f = forecasts[segment.id];
        
        if (!isForecast) {
          // Historical data
          dataPoint[segment.id] = m?.yearly[year]?.price || 0;
          dataPoint[`${segment.id}_vol`] = m?.yearly[year]?.volume || 0;
          dataPoint[`${segment.id}_yoy`] = m?.yoyGrowth[year] ?? null;
          // Set forecast values to null for historical years
          dataPoint[`${segment.id}_forecast`] = null;
          dataPoint[`${segment.id}_upper`] = null;
          dataPoint[`${segment.id}_lower`] = null;
          dataPoint[`${segment.id}_vol_forecast`] = null;
        } else {
          // Forecast data
          const forecastIdx = year - lastYear - 1;
          const priceForecast = f?.priceForecasts[forecastIdx];
          const volumeForecast = f?.volumeForecasts[forecastIdx];
          const yoyForecast = f?.yoyForecasts?.[forecastIdx];
          
          // Set historical to null, forecast to values
          dataPoint[segment.id] = null;
          dataPoint[`${segment.id}_vol`] = null;
          dataPoint[`${segment.id}_yoy`] = null;
          
          // Price forecast with confidence bands
          dataPoint[`${segment.id}_forecast`] = priceForecast?.predicted || null;
          dataPoint[`${segment.id}_upper`] = priceForecast?.upper || null;
          dataPoint[`${segment.id}_lower`] = priceForecast?.lower || null;
          
          // Volume forecast with confidence bands
          dataPoint[`${segment.id}_vol_forecast`] = volumeForecast?.predicted || null;
          dataPoint[`${segment.id}_vol_upper`] = volumeForecast?.upper || null;
          dataPoint[`${segment.id}_vol_lower`] = volumeForecast?.lower || null;
          
          // YoY forecast with confidence bands
          dataPoint[`${segment.id}_yoy_forecast`] = yoyForecast?.predicted ?? null;
          dataPoint[`${segment.id}_yoy_upper`] = yoyForecast?.upper ?? null;
          dataPoint[`${segment.id}_yoy_lower`] = yoyForecast?.lower ?? null;
        }
      });
      
      return dataPoint;
    });
    
    return { chartDataWithForecast, forecasts };
  }, [showForecast, forecastYears, segmentMetrics, segments, chartData]);

  // Calculate holding period data using fingerprinting (cached)
  const holdingPeriodData = useMemo(() => {
    // Only run fingerprinting on residential transactions
    const residentialTxns = transactions.filter((t) => t.assetCategory === "سكني");
    const unitHistories = identifyResales(residentialTxns);
    
    // Extract all resale transactions with holding period data and fingerprint info
    const allResales: (UnitTransaction & { 
      fingerprint: string;
      region: string;
      propertyType: string;
      propertyDesign: string;
    })[] = [];
    unitHistories.forEach((unit) => {
      unit.transactions.forEach((t) => {
        if (t.isResale && t.holdingPeriodYears && t.holdingPeriodYears > 0) {
          allResales.push({ 
            ...t, 
            fingerprint: unit.fingerprint.fingerprint,
            region: unit.fingerprint.region,
            propertyType: unit.fingerprint.propertyType,
            propertyDesign: unit.fingerprint.propertyDesign,
          });
        }
      });
    });
    
    return allResales;
  }, [transactions]);

  // Calculate holding period metrics per segment
  const holdingPeriodBySegment = useMemo(() => {
    return segments.map((segment) => {
      // Filter resales for this segment
      const segmentResales = holdingPeriodData.filter((resale) => {
        // Match segment criteria
        if (segment.region !== "all" && resale.region !== segment.region) return false;
        if (segment.propertyType !== "all" && resale.propertyType !== segment.propertyType) return false;
        if (segment.saleType !== "all") {
          // Note: For resales, we want to match based on original purchase type which is tricky
          // For now, we'll skip saleType filter for holding period
        }
        if (segment.bedrooms !== "all") {
          const design = resale.propertyDesign || "";
          if (segment.bedrooms === "Studio" && !design.includes("استوديو") && !design.includes("ستوديو") && !design.toLowerCase().includes("studio")) return false;
          if (segment.bedrooms === "1 BR" && !design.includes("غرفة نوم واحدة") && !design.includes("1 غرفة") && !design.includes("١")) return false;
          if (segment.bedrooms === "2 BR" && !design.includes("غرفتين") && !design.includes("2 غرف") && !design.includes("٢")) return false;
          if (segment.bedrooms === "3 BR" && !design.includes("3 غرف") && !design.includes("٣")) return false;
          if (segment.bedrooms === "4 BR" && !design.includes("4 غرف") && !design.includes("٤")) return false;
          if (segment.bedrooms === "5 BR" && !design.includes("5 غرف") && !design.includes("٥")) return false;
          if (segment.bedrooms === "6+ BR" && !design.includes("6 غرف") && !design.includes("٦") && !design.includes("7") && !design.includes("٧")) return false;
        }
        return true;
      });
      
      if (segmentResales.length === 0) {
        return {
          id: segment.id,
          name: segment.name,
          color: segment.color,
          avgHoldingPeriod: 0,
          medianHoldingPeriod: 0,
          avgAppreciation: 0,
          avgAnnualizedReturn: 0,
          resaleCount: 0,
          positiveResaleRate: 0,
        };
      }
      
      const holdingPeriods = segmentResales.map((r) => r.holdingPeriodYears || 0);
      const appreciations = segmentResales
        .filter((r) => r.priceChangePercent !== undefined)
        .map((r) => r.priceChangePercent!);
      const annualizedReturns = segmentResales
        .map((r) => r.annualizedReturn || 0)
        .filter((r) => isFinite(r) && r !== 0);
      const positiveCount = appreciations.filter((a) => a > 0).length;
      
      // Calculate median
      const sortedPeriods = [...holdingPeriods].sort((a, b) => a - b);
      const mid = Math.floor(sortedPeriods.length / 2);
      const medianHoldingPeriod = sortedPeriods.length % 2 !== 0 
        ? sortedPeriods[mid] 
        : (sortedPeriods[mid - 1] + sortedPeriods[mid]) / 2;
      
      return {
        id: segment.id,
        name: segment.name,
        color: segment.color,
        avgHoldingPeriod: holdingPeriods.reduce((a, b) => a + b, 0) / holdingPeriods.length,
        medianHoldingPeriod,
        avgAppreciation: appreciations.length > 0 
          ? appreciations.reduce((a, b) => a + b, 0) / appreciations.length 
          : 0,
        avgAnnualizedReturn: annualizedReturns.length > 0 
          ? annualizedReturns.reduce((a, b) => a + b, 0) / annualizedReturns.length 
          : 0,
        resaleCount: segmentResales.length,
        positiveResaleRate: appreciations.length > 0 
          ? (positiveCount / appreciations.length) * 100 
          : 0,
      };
    });
  }, [holdingPeriodData, segments]);

  // Calculate Vintage Performance Analysis per segment
  // Shows how off-plan purchases from each year performed
  const vintagePerformanceData = useMemo(() => {
    const years = [...new Set(transactions.map((t) => t.year))].sort();
    const latestYear = Math.max(...years);
    
    // For each segment, calculate vintage performance
    return segments.map((segment) => {
      // Get segment-filtered transactions
      let segmentTxns = transactions.filter((t) => t.assetCategory === "سكني" && t.pricePerSqm > 0 && t.pricePerSqm < 100000);
      
      if (segment.region !== "all") {
        segmentTxns = segmentTxns.filter((t) => t.region === segment.region);
      }
      if (segment.propertyType !== "all") {
        segmentTxns = segmentTxns.filter((t) => t.propertyType === segment.propertyType);
      }
      // Filter by projects if specified
      if (segment.projects && segment.projects.length > 0) {
        segmentTxns = segmentTxns.filter((t) => t.project && segment.projects.includes(t.project));
      }
      if (segment.bedrooms !== "all") {
        segmentTxns = segmentTxns.filter((t) => {
          const design = t.propertyDesign || "";
          if (segment.bedrooms === "Studio") return design.includes("استوديو") || design.includes("ستوديو") || design.toLowerCase().includes("studio");
          if (segment.bedrooms === "1 BR") return design.includes("غرفة نوم واحدة") || design.includes("1 غرفة") || design.includes("١");
          if (segment.bedrooms === "2 BR") return design.includes("غرفتين") || design.includes("2 غرف") || design.includes("٢");
          if (segment.bedrooms === "3 BR") return design.includes("3 غرف") || design.includes("٣");
          if (segment.bedrooms === "4 BR") return design.includes("4 غرف") || design.includes("٤");
          if (segment.bedrooms === "5 BR") return design.includes("5 غرف") || design.includes("٥");
          if (segment.bedrooms === "6+ BR") return design.includes("6 غرف") || design.includes("٦") || design.includes("7") || design.includes("٧");
          return true;
        });
      }
      
      // Get current ready price (latest year)
      const currentReadyTxns = segmentTxns.filter((t) => t.year === latestYear && t.saleType === "جاهزة");
      const currentReadyPrice = currentReadyTxns.length > 0 
        ? calcMedian(currentReadyTxns.map((t) => t.pricePerSqm))
        : 0;
      
      // Calculate vintage performance for each purchase year
      const vintages = years.slice(0, -1).map((purchaseYear) => { // Exclude latest year
        const offPlanPurchases = segmentTxns.filter(
          (t) => t.year === purchaseYear && t.saleType === "على المخطط"
        );
        
        if (offPlanPurchases.length === 0) return null;
        
        const purchasePrice = calcMedian(offPlanPurchases.map((t) => t.pricePerSqm));
        const yearsHeld = latestYear - purchaseYear;
        
        const appreciation = purchasePrice > 0 && currentReadyPrice > 0
          ? ((currentReadyPrice - purchasePrice) / purchasePrice) * 100
          : 0;
        
        const cagr = yearsHeld > 0 && purchasePrice > 0 && currentReadyPrice > 0
          ? (Math.pow(currentReadyPrice / purchasePrice, 1 / yearsHeld) - 1) * 100
          : 0;
        
        return {
          purchaseYear,
          purchasePrice,
          currentPrice: currentReadyPrice,
          appreciation,
          cagr,
          yearsHeld,
          volume: offPlanPurchases.length,
        };
      }).filter((v): v is NonNullable<typeof v> => v !== null && v.yearsHeld > 0);
      
      return {
        id: segment.id,
        name: segment.name,
        color: segment.color,
        vintages,
        currentReadyPrice,
      };
    });
  }, [transactions, segments]);

  // Prepare vintage chart data (for line chart comparison)
  const vintageChartData = useMemo(() => {
    const allYears = [...new Set(
      vintagePerformanceData.flatMap((s) => s.vintages.map((v) => v.purchaseYear))
    )].sort();
    
    return allYears.map((year) => {
      const dataPoint: Record<string, number | string | null> = { year };
      
      segments.forEach((segment) => {
        const segmentData = vintagePerformanceData.find((s) => s.id === segment.id);
        const vintage = segmentData?.vintages.find((v) => v.purchaseYear === year);
        
        dataPoint[`${segment.id}_appreciation`] = vintage?.appreciation ?? null;
        dataPoint[`${segment.id}_cagr`] = vintage?.cagr ?? null;
        dataPoint[`${segment.id}_purchasePrice`] = vintage?.purchasePrice ?? null;
      });
      
      return dataPoint;
    });
  }, [vintagePerformanceData, segments]);

  // Generate radar chart data
  const radarData = useMemo(() => {
    const { metrics } = segmentMetrics;
    const maxValues = {
      cagr: Math.max(...segments.map((s) => Math.abs(metrics[s.id]?.cagr || 0))),
      stability: Math.max(...segments.map((s) => 100 - (metrics[s.id]?.volatility || 0))),
      volume: Math.max(...segments.map((s) => metrics[s.id]?.totalTransactions || 0)),
      latestPrice: Math.max(...segments.map((s) => {
        const years = Object.keys(metrics[s.id]?.yearly || {}).map(Number).sort();
        return metrics[s.id]?.yearly[years[years.length - 1]]?.price || 0;
      })),
    };
    
    const radarMetrics = ["Growth (CAGR)", "Stability", "Volume", "Price Level"];
    
    return radarMetrics.map((metric) => {
      const point: Record<string, string | number> = { metric };
      
      segments.forEach((segment) => {
        const m = metrics[segment.id];
        if (!m) return;
        
        const years = Object.keys(m.yearly).map(Number).sort();
        const latestPrice = m.yearly[years[years.length - 1]]?.price || 0;
        
        switch (metric) {
          case "Growth (CAGR)":
            point[segment.id] = maxValues.cagr > 0 ? (Math.abs(m.cagr) / maxValues.cagr) * 100 : 0;
            break;
          case "Stability":
            point[segment.id] = maxValues.stability > 0 ? ((100 - m.volatility) / maxValues.stability) * 100 : 0;
            break;
          case "Volume":
            point[segment.id] = maxValues.volume > 0 ? (m.totalTransactions / maxValues.volume) * 100 : 0;
            break;
          case "Price Level":
            point[segment.id] = maxValues.latestPrice > 0 ? (latestPrice / maxValues.latestPrice) * 100 : 0;
            break;
        }
      });
      
      return point;
    });
  }, [segmentMetrics, segments]);

  // Generate segment name
  const generateSegmentName = (seg: Partial<Segment>): string => {
    const parts: string[] = [];
    
    if (seg.bedrooms && seg.bedrooms !== "all") {
      parts.push(seg.bedrooms);
    }
    if (seg.propertyType && seg.propertyType !== "all") {
      parts.push(translate(seg.propertyType, 'propertyType'));
    }
    // Show projects if specified, otherwise show region
    if (seg.projects && seg.projects.length > 0) {
      // Translate all project names first
      const translatedProjects = seg.projects.map(p => translateProject(p));
      
      if (seg.projects.length === 1) {
        parts.push(translatedProjects[0]);
      } else {
        // Find common prefix for translated project names
        const commonPrefix = findCommonPrefix(translatedProjects);
        if (commonPrefix && commonPrefix.length >= 3) {
          parts.push(`${commonPrefix}* (${seg.projects.length})`);
        } else {
          parts.push(`${seg.projects.length} Projects`);
        }
      }
    } else if (seg.region && seg.region !== "all") {
      parts.push(translate(seg.region, 'region'));
    }
    if (seg.saleType && seg.saleType !== "all") {
      parts.push(translate(seg.saleType, 'saleType'));
    }
    
    return parts.length > 0 ? parts.join(" - ") : "All Properties";
  };

  // Helper to find common prefix in project names
  const findCommonPrefix = (strings: string[]): string => {
    if (strings.length === 0) return "";
    if (strings.length === 1) return strings[0];
    
    // Split first string into words
    const firstWords = strings[0].split(/\s+/);
    let commonWords: string[] = [];
    
    for (const word of firstWords) {
      if (strings.every(s => s.toLowerCase().includes(word.toLowerCase()))) {
        commonWords.push(word);
        break; // Just use first common word
      }
    }
    
    return commonWords.join(" ");
  };

  // Add new segment
  const addSegment = () => {
    if (segments.length >= 8) return;
    
    const id = `segment-${Date.now()}`;
    const name = generateSegmentName(newSegment);
    const color = LINE_COLORS[segments.length % LINE_COLORS.length];
    
    setSegments([
      ...segments,
      {
        id,
        name,
        region: newSegment.region || "all",
        propertyType: newSegment.propertyType || "all",
        bedrooms: newSegment.bedrooms || "all",
        saleType: newSegment.saleType || "all",
        projects: newSegment.projects || [],
        color,
      },
    ]);
    
    setNewSegment({
      region: "all",
      propertyType: "all",
      bedrooms: "all",
      saleType: "all",
      projects: [],
    });
    setProjectSearch("");
    setIsAddingSegment(false);
  };

  // Remove segment
  const removeSegment = (id: string) => {
    if (segments.length <= 1) return;
    setSegments(segments.filter((s) => s.id !== id));
  };

  // Calculate comparison stats
  const comparisonStats = useMemo(() => {
    const { metrics, years } = segmentMetrics;
    
    return segments.map((segment) => {
      const m = metrics[segment.id];
      if (!m) return null;
      
      const sortedYears = years.filter((y) => m.yearly[y]?.price > 0).sort();
      if (sortedYears.length < 2) return null;
      
      const latestYear = sortedYears[sortedYears.length - 1];
      const firstYear = sortedYears[0];
      const latestPrice = m.yearly[latestYear]?.price || 0;
      const firstPrice = m.yearly[firstYear]?.price || 0;
      const totalGrowth = firstPrice > 0 ? ((latestPrice - firstPrice) / firstPrice) * 100 : 0;
      
      // Get latest YoY growth
      const latestYoY = m.yoyGrowth[latestYear] ?? 0;
      
      return {
        id: segment.id,
        name: segment.name,
        color: segment.color,
        latestPrice,
        totalGrowth,
        cagr: m.cagr,
        volatility: m.volatility,
        latestYoY,
        totalTransactions: m.totalTransactions,
        avgVolume: m.avgVolume,
        // Resale stats
        totalResales: m.totalResales,
        avgResaleRate: m.avgResaleRate,
        avgResalePremium: m.avgResalePremium,
      };
    }).filter(Boolean);
  }, [segmentMetrics, segments]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Trend Comparison Tool
            </CardTitle>
            <CardDescription>
              Compare price/sqm trends across different segments (regions, property types, bedrooms)
            </CardDescription>
          </div>
          {segments.length < 8 && (
            <button
              onClick={() => setIsAddingSegment(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Segment
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Comparison Presets */}
        <div className="mb-6 pb-6 border-b border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Quick Comparisons</h4>
          
          {/* Unit Types */}
          <div className="mb-4">
            <span className="text-xs text-slate-500 uppercase tracking-wider">By Property Type</span>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => setSegments([
                  { id: "apt", name: "Apartments", region: "all", propertyType: "شقة", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[0] },
                  { id: "villa", name: "Villas", region: "all", propertyType: "ڨيلا", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[1] },
                  { id: "townhouse", name: "Townhouses", region: "all", propertyType: "تاونهاوس / ڨيلا شبه منفصلة", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[2] },
                ])}
                className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition-colors"
              >
                Apt vs Villa vs Townhouse
              </button>
              <button
                onClick={() => setSegments([
                  { id: "apt-ready", name: "Apartment - Ready", region: "all", propertyType: "شقة", bedrooms: "all", saleType: "جاهزة", projects: [], color: LINE_COLORS[0] },
                  { id: "apt-offplan", name: "Apartment - Off-Plan", region: "all", propertyType: "شقة", bedrooms: "all", saleType: "على المخطط", projects: [], color: LINE_COLORS[1] },
                ])}
                className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition-colors"
              >
                Apt: Ready vs Off-Plan
              </button>
              <button
                onClick={() => setSegments([
                  { id: "villa-ready", name: "Villa - Ready", region: "all", propertyType: "ڨيلا", bedrooms: "all", saleType: "جاهزة", projects: [], color: LINE_COLORS[0] },
                  { id: "villa-offplan", name: "Villa - Off-Plan", region: "all", propertyType: "ڨيلا", bedrooms: "all", saleType: "على المخطط", projects: [], color: LINE_COLORS[1] },
                ])}
                className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition-colors"
              >
                Villa: Ready vs Off-Plan
              </button>
            </div>
          </div>

          {/* Regions */}
          <div className="mb-4">
            <span className="text-xs text-slate-500 uppercase tracking-wider">By Region</span>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => setSegments([
                  { id: "overall", name: "Overall Market", region: "all", propertyType: "all", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[0] },
                  { id: "yas", name: "Yas Island", region: "جزيرة ياس", propertyType: "all", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[1] },
                  { id: "saadiyat", name: "Saadiyat", region: "جزيرة السعديات", propertyType: "all", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[2] },
                  { id: "reem", name: "Reem Island", region: "جزيرة الريم", propertyType: "all", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[3] },
                ])}
                className="px-3 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors"
              >
                Premium Islands vs Market
              </button>
              <button
                onClick={() => setSegments([
                  { id: "yas-villa", name: "Villa - Yas", region: "جزيرة ياس", propertyType: "ڨيلا", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[0] },
                  { id: "saadiyat-villa", name: "Villa - Saadiyat", region: "جزيرة السعديات", propertyType: "ڨيلا", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[1] },
                  { id: "reem-villa", name: "Villa - Reem", region: "جزيرة الريم", propertyType: "ڨيلا", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[2] },
                ])}
                className="px-3 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors"
              >
                Villas: Yas vs Saadiyat vs Reem
              </button>
              <button
                onClick={() => setSegments([
                  { id: "yas-apt", name: "Apt - Yas", region: "جزيرة ياس", propertyType: "شقة", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[0] },
                  { id: "saadiyat-apt", name: "Apt - Saadiyat", region: "جزيرة السعديات", propertyType: "شقة", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[1] },
                  { id: "reem-apt", name: "Apt - Reem", region: "جزيرة الريم", propertyType: "شقة", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[2] },
                ])}
                className="px-3 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors"
              >
                Apartments: Yas vs Saadiyat vs Reem
              </button>
              <button
                onClick={() => setSegments([
                  { id: "khalifa", name: "Khalifa City", region: "مدينة خليفة", propertyType: "all", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[0] },
                  { id: "shamkha", name: "Al Shamkha", region: "الشامخة", propertyType: "all", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[1] },
                  { id: "reef", name: "Al Reef", region: "الريف", propertyType: "all", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[2] },
                  { id: "raha", name: "Al Raha", region: "الراحة", propertyType: "all", bedrooms: "all", saleType: "all", projects: [], color: LINE_COLORS[3] },
                ])}
                className="px-3 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors"
              >
                Mainland Areas
              </button>
            </div>
          </div>

          {/* Bedrooms & Sale Type */}
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider">By Bedrooms & Sale Type</span>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => setSegments([
                  { id: "studio", name: "Studio", region: "all", propertyType: "all", bedrooms: "Studio", saleType: "all", projects: [], color: LINE_COLORS[0] },
                  { id: "1br", name: "1 BR", region: "all", propertyType: "all", bedrooms: "1 BR", saleType: "all", projects: [], color: LINE_COLORS[1] },
                  { id: "2br", name: "2 BR", region: "all", propertyType: "all", bedrooms: "2 BR", saleType: "all", projects: [], color: LINE_COLORS[2] },
                  { id: "3br", name: "3 BR", region: "all", propertyType: "all", bedrooms: "3 BR", saleType: "all", projects: [], color: LINE_COLORS[3] },
                ])}
                className="px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors"
              >
                Studio vs 1BR vs 2BR vs 3BR
              </button>
              <button
                onClick={() => setSegments([
                  { id: "3br", name: "3 BR", region: "all", propertyType: "all", bedrooms: "3 BR", saleType: "all", projects: [], color: LINE_COLORS[0] },
                  { id: "4br", name: "4 BR", region: "all", propertyType: "all", bedrooms: "4 BR", saleType: "all", projects: [], color: LINE_COLORS[1] },
                  { id: "5br", name: "5 BR", region: "all", propertyType: "all", bedrooms: "5 BR", saleType: "all", projects: [], color: LINE_COLORS[2] },
                ])}
                className="px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors"
              >
                3BR vs 4BR vs 5BR
              </button>
              <button
                onClick={() => setSegments([
                  { id: "ready", name: "Ready Properties", region: "all", propertyType: "all", bedrooms: "all", saleType: "جاهزة", projects: [], color: LINE_COLORS[0] },
                  { id: "offplan", name: "Off-Plan Properties", region: "all", propertyType: "all", bedrooms: "all", saleType: "على المخطط", projects: [], color: LINE_COLORS[1] },
                ])}
                className="px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors"
              >
                Ready vs Off-Plan
              </button>
            </div>
          </div>
        </div>

        {/* Active Segments */}
        <div className="flex flex-wrap gap-2 mb-6">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
              style={{ backgroundColor: `${segment.color}20`, borderColor: segment.color, borderWidth: 1 }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-slate-200">{segment.name}</span>
              {segments.length > 1 && (
                <button
                  onClick={() => removeSegment(segment.id)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Segment Modal */}
        {isAddingSegment && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="text-sm font-medium text-slate-200 mb-4">Add New Comparison Segment</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {/* Region Select */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Region</label>
                <select
                  value={newSegment.region}
                  onChange={(e) => setNewSegment({ ...newSegment, region: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200"
                >
                  <option value="all">All Regions</option>
                  {filterOptions.regions.map((r) => (
                    <option key={r} value={r}>
                      {translate(r, 'region')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Property Type Select */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Property Type</label>
                <select
                  value={newSegment.propertyType}
                  onChange={(e) => setNewSegment({ ...newSegment, propertyType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200"
                >
                  <option value="all">All Types</option>
                  {filterOptions.propertyTypes.map((t) => (
                    <option key={t} value={t}>
                      {translate(t, 'propertyType')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bedrooms Select */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Bedrooms</label>
                <select
                  value={newSegment.bedrooms}
                  onChange={(e) => setNewSegment({ ...newSegment, bedrooms: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200"
                >
                  <option value="all">All Bedrooms</option>
                  {filterOptions.bedrooms.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Sale Type Select */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Sale Type</label>
                <select
                  value={newSegment.saleType}
                  onChange={(e) => setNewSegment({ ...newSegment, saleType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200"
                >
                  <option value="all">All Types</option>
                  <option value="جاهزة">Ready</option>
                  <option value="على المخطط">Off-Plan</option>
                </select>
              </div>
            </div>

            {/* Project Selection */}
            <div className="mt-4">
              <label className="block text-xs text-slate-400 mb-2">
                Projects (Optional - group multiple projects together)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search projects... (e.g., Bloom, Gate Tower)"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500"
                />
                {newSegment.projects && newSegment.projects.length > 0 && (
                  <button
                    onClick={() => setNewSegment({ ...newSegment, projects: [] })}
                    className="px-3 py-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg transition-colors"
                  >
                    Clear ({newSegment.projects.length})
                  </button>
                )}
              </div>
              
              {/* Selected Projects */}
              {newSegment.projects && newSegment.projects.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700">
                  {newSegment.projects.map((project) => {
                    const displayName = translateProject(project);
                    return (
                      <span
                        key={project}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded"
                      >
                        {displayName.length > 30 ? displayName.substring(0, 30) + "..." : displayName}
                        <button
                          onClick={() => setNewSegment({
                            ...newSegment,
                            projects: newSegment.projects?.filter((p) => p !== project) || []
                          })}
                          className="ml-1 text-amber-400 hover:text-amber-200"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              
              {/* Available Projects */}
              {(projectSearch || (newSegment.region && newSegment.region !== "all")) && (
                <div className="max-h-40 overflow-y-auto border border-slate-700 rounded-lg bg-slate-900/50">
                  {filteredProjects.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-500">No projects found</p>
                  ) : (
                    filteredProjects.map((project) => {
                      const isSelected = newSegment.projects?.includes(project.name);
                      const displayName = translateProject(project.name);
                      return (
                        <button
                          key={project.name}
                          onClick={() => {
                            if (isSelected) {
                              setNewSegment({
                                ...newSegment,
                                projects: newSegment.projects?.filter((p) => p !== project.name) || []
                              });
                            } else {
                              setNewSegment({
                                ...newSegment,
                                projects: [...(newSegment.projects || []), project.name]
                              });
                            }
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-800 transition-colors flex items-center justify-between ${
                            isSelected ? 'bg-amber-500/10 text-amber-300' : 'text-slate-300'
                          }`}
                        >
                          <span className="truncate">{displayName}</span>
                          <span className="text-slate-500 ml-2 shrink-0">
                            {isSelected ? '✓' : ''} ({project.count})
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
              
              {!projectSearch && (!newSegment.region || newSegment.region === "all") && (
                <p className="text-xs text-slate-500 italic">
                  Select a region or type to search for projects
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-400">
                Preview: <span className="text-amber-400">{generateSegmentName(newSegment)}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddingSegment(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addSegment}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                  Add to Chart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Forecasting Settings */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/20 to-slate-900/20 rounded-lg border border-purple-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-slate-200">Price Forecasting</span>
              </div>
              <button
                onClick={() => setShowForecast(!showForecast)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  showForecast ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-transform ${
                    showForecast ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            
            {showForecast && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Forecast Years:</span>
                  <select
                    value={forecastYears}
                    onChange={(e) => setForecastYears(Number(e.target.value))}
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200"
                  >
                    <option value={1}>1 Year</option>
                    <option value={2}>2 Years</option>
                    <option value={3}>3 Years</option>
                    <option value={5}>5 Years</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowForecastInfo(!showForecastInfo)}
                  className="text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-1"
                >
                  <Info className="w-4 h-4" />
                  {showForecastInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>
          
          {/* Forecast Info Panel */}
          {showForecast && showForecastInfo && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h5 className="text-sm font-medium text-purple-300 mb-2">Ensemble Forecasting Method</h5>
              <p className="text-xs text-slate-400 mb-3">
                Predictions use an <span className="text-purple-300 font-medium">Ensemble of 3 methods</span>, 
                weighted by recent accuracy. Better for small datasets than single-model approaches.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
                <div className="p-2 bg-slate-900/50 rounded">
                  <span className="text-cyan-400 font-medium">1. Holt&apos;s Exponential Smoothing</span>
                  <p className="text-slate-500 mt-1">
                    Gives more weight to recent data. Captures level + trend separately.
                  </p>
                </div>
                <div className="p-2 bg-slate-900/50 rounded">
                  <span className="text-blue-400 font-medium">2. Linear Regression</span>
                  <p className="text-slate-500 mt-1">
                    Fits best-fit line. Good when trend is consistent.
                  </p>
                </div>
                <div className="p-2 bg-slate-900/50 rounded">
                  <span className="text-green-400 font-medium">3. Naive Trend</span>
                  <p className="text-slate-500 mt-1">
                    Last value + average trend. Robust baseline.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Quality Indicators (MAPE):</span>
                  <ul className="mt-1 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-300">MAPE &lt; 5%: Excellent</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-slate-300">MAPE &lt; 10%: Good</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="text-slate-300">MAPE &lt; 15%: Fair</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="text-slate-300">MAPE ≥ 15%: Poor</span>
                    </li>
                  </ul>
                  <p className="mt-2 text-slate-600 italic text-[10px]">
                    MAPE = Mean Absolute Percentage Error
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Why Ensemble?</span>
                  <ul className="mt-1 space-y-1 text-slate-400">
                    <li>• Combines strengths of multiple methods</li>
                    <li>• Reduces risk of overfitting</li>
                    <li>• Weights adapt to which method fits best</li>
                    <li>• More robust with limited data (6-7 years)</li>
                  </ul>
                  <p className="mt-2 text-amber-400/80 italic">
                    ⚠️ Forecasts are projections, not guarantees.
                  </p>
                </div>
              </div>
              
              {/* Model Quality per Segment */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <span className="text-xs text-slate-500">Model Quality by Segment:</span>
                <div className="flex flex-wrap gap-3 mt-2">
                  {segments.map((segment) => {
                    const f = forecastData.forecasts[segment.id];
                    const mapeColor = !f ? "text-slate-500"
                      : f.mape < 5 ? "text-emerald-400" 
                      : f.mape < 10 ? "text-green-400" 
                      : f.mape < 15 ? "text-amber-400" 
                      : "text-red-400";
                    return (
                      <div key={segment.id} className="flex flex-col gap-1 px-3 py-2 bg-slate-900/50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: segment.color }}></span>
                          <span className="text-xs text-slate-300 font-medium">{segment.name}</span>
                        </div>
                        {f && f.mape > 0 ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${mapeColor}`}>
                                MAPE: {f.mape.toFixed(1)}%
                              </span>
                              <span className="text-xs text-slate-500">({f.qualityRating})</span>
                            </div>
                            <div className="text-[10px] text-slate-600">
                              {f.modelInfo}
                            </div>
                            {f.trend !== 0 && (
                              <div className="text-[10px] text-slate-500">
                                Trend: {f.trend > 0 ? '+' : ''}{f.trend.toFixed(0)} AED/yr
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">No data</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* All Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Price Trend Chart with Forecasting */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Price/SQM Trend
              {showForecast && <span className="text-xs text-purple-400 font-normal ml-1">(+ {forecastYears}yr forecast)</span>}
            </h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={showForecast ? forecastData.chartDataWithForecast : chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#f1f5f9" }}
                    formatter={(value, name) => {
                      if (typeof value !== 'number') return ['-', name];
                      const nameStr = String(name);
                      const isForecast = nameStr.includes('_forecast');
                      const isUpper = nameStr.includes('_upper');
                      const isLower = nameStr.includes('_lower');
                      if (isUpper || isLower) return null; // Hide upper/lower in tooltip
                      const segmentId = nameStr.replace('_forecast', '');
                      const segment = segments.find((s) => s.id === segmentId);
                      const label = isForecast ? `${segment?.name} (Forecast)` : segment?.name;
                      return [`AED ${formatNumber(value)}/sqm`, label || name];
                    }}
                  />
                  <Legend 
                    formatter={(value) => {
                      const v = String(value);
                      if (v.includes('_upper') || v.includes('_lower')) return null;
                      const isForecast = v.includes('_forecast');
                      const segmentId = v.replace('_forecast', '');
                      const segment = segments.find((s) => s.id === segmentId);
                      return isForecast ? `${segment?.name} (Forecast)` : segment?.name || v;
                    }} 
                    wrapperStyle={{ fontSize: 11 }} 
                  />
                  {/* Historical data lines */}
                  {segments.map((segment) => (
                    <Line key={segment.id} type="monotone" dataKey={segment.id} stroke={segment.color} strokeWidth={2} dot={{ fill: segment.color, r: 3 }} connectNulls />
                  ))}
                  {/* Forecast confidence bands */}
                  {showForecast && segments.map((segment) => (
                    <Area
                      key={`${segment.id}_band`}
                      type="monotone"
                      dataKey={`${segment.id}_upper`}
                      stroke="none"
                      fill={segment.color}
                      fillOpacity={0.15}
                      legendType="none"
                      connectNulls
                    />
                  ))}
                  {/* Forecast lines (dashed) */}
                  {showForecast && segments.map((segment) => (
                    <Line
                      key={`${segment.id}_forecast`}
                      type="monotone"
                      dataKey={`${segment.id}_forecast`}
                      stroke={segment.color}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: segment.color, r: 3, strokeWidth: 2, stroke: "#1e293b" }}
                      connectNulls
                    />
                  ))}
                  {/* Forecast boundary line */}
                  {showForecast && (
                    <ReferenceLine
                      x={segmentMetrics.years[segmentMetrics.years.length - 1]}
                      stroke="#8b5cf6"
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                      label={{ value: 'Forecast →', position: 'top', fill: '#8b5cf6', fontSize: 10 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* YoY Growth Chart with Forecasting and Confidence Bands */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Year-over-Year Growth
              {showForecast && <span className="text-xs text-purple-400 font-normal ml-1">(+ {forecastYears}yr forecast)</span>}
            </h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={showForecast ? forecastData.chartDataWithForecast : chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} tickFormatter={(value) => `${value?.toFixed(0)}%`} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#f1f5f9" }}
                    formatter={(value, name) => {
                      if (value === null || value === undefined) return ['-', name];
                      const nameStr = String(name);
                      // Skip upper/lower in tooltip
                      if (nameStr.includes('_upper') || nameStr.includes('_lower')) return null;
                      const isForecast = nameStr.includes('_yoy_forecast');
                      const segmentId = nameStr.replace('_yoy', '').replace('_forecast', '');
                      const segment = segments.find((s) => s.id === segmentId);
                      const label = isForecast ? `${segment?.name} (Forecast)` : segment?.name;
                      return [`${Number(value).toFixed(1)}%`, label || name];
                    }}
                  />
                  <Legend 
                    formatter={(value) => { 
                      const nameStr = String(value);
                      // Hide upper/lower from legend
                      if (nameStr.includes('_upper') || nameStr.includes('_lower')) return '';
                      const isForecast = nameStr.includes('_yoy_forecast');
                      const segmentId = nameStr.replace('_yoy', '').replace('_forecast', ''); 
                      const segment = segments.find((s) => s.id === segmentId);
                      return isForecast ? `${segment?.name} (Forecast)` : segment?.name || value; 
                    }} 
                    wrapperStyle={{ fontSize: 11 }} 
                  />
                  {/* Zero reference line */}
                  <Line type="monotone" dataKey={() => 0} stroke="#475569" strokeDasharray="5 5" dot={false} legendType="none" />
                  {/* YoY Forecast confidence bands */}
                  {showForecast && segments.map((segment) => (
                    <Area
                      key={`${segment.id}_yoy_band`}
                      type="monotone"
                      dataKey={`${segment.id}_yoy_upper`}
                      stroke="none"
                      fill={segment.color}
                      fillOpacity={0.15}
                      legendType="none"
                      connectNulls
                    />
                  ))}
                  {showForecast && segments.map((segment) => (
                    <Area
                      key={`${segment.id}_yoy_band_lower`}
                      type="monotone"
                      dataKey={`${segment.id}_yoy_lower`}
                      stroke="none"
                      fill="#0f172a"
                      fillOpacity={1}
                      legendType="none"
                      connectNulls
                    />
                  ))}
                  {/* Historical YoY lines */}
                  {segments.map((segment) => (
                    <Line key={segment.id} type="monotone" dataKey={`${segment.id}_yoy`} stroke={segment.color} strokeWidth={2} dot={{ fill: segment.color, r: 3 }} connectNulls />
                  ))}
                  {/* Forecast YoY lines (dashed) */}
                  {showForecast && segments.map((segment) => (
                    <Line 
                      key={`${segment.id}_yoy_forecast`} 
                      type="monotone" 
                      dataKey={`${segment.id}_yoy_forecast`} 
                      stroke={segment.color} 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      dot={{ fill: segment.color, r: 3, strokeDasharray: "0" }} 
                      connectNulls 
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume Chart with Forecasting and Confidence Bands */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Transaction Volume
              {showForecast && <span className="text-xs text-purple-400 font-normal ml-1">(+ {forecastYears}yr forecast)</span>}
            </h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={showForecast ? forecastData.chartDataWithForecast : chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#f1f5f9" }}
                    formatter={(value, name) => {
                      if (typeof value !== 'number') return ['-', name];
                      const nameStr = String(name);
                      // Skip upper/lower in tooltip
                      if (nameStr.includes('_upper') || nameStr.includes('_lower')) return null;
                      const isForecast = nameStr.includes('_vol_forecast');
                      const segmentId = nameStr.replace('_vol', '').replace('_forecast', '');
                      const segment = segments.find((s) => s.id === segmentId);
                      const label = isForecast ? `${segment?.name} (Forecast)` : segment?.name;
                      return [`${formatNumber(Math.round(value))} transactions`, label || name];
                    }}
                  />
                  <Legend 
                    formatter={(value) => { 
                      const v = String(value);
                      // Hide upper/lower from legend
                      if (v.includes('_upper') || v.includes('_lower')) return '';
                      const isForecast = v.includes('_vol_forecast');
                      const segmentId = v.replace('_vol', '').replace('_forecast', '');
                      const segment = segments.find((s) => s.id === segmentId);
                      return isForecast ? `${segment?.name} (Forecast)` : segment?.name || v; 
                    }} 
                    wrapperStyle={{ fontSize: 11 }} 
                  />
                  {/* Volume forecast confidence bands */}
                  {showForecast && segments.map((segment) => (
                    <Area
                      key={`${segment.id}_vol_band`}
                      type="monotone"
                      dataKey={`${segment.id}_vol_upper`}
                      stroke="none"
                      fill={segment.color}
                      fillOpacity={0.15}
                      legendType="none"
                      connectNulls
                    />
                  ))}
                  {showForecast && segments.map((segment) => (
                    <Area
                      key={`${segment.id}_vol_band_lower`}
                      type="monotone"
                      dataKey={`${segment.id}_vol_lower`}
                      stroke="none"
                      fill="#0f172a"
                      fillOpacity={1}
                      legendType="none"
                      connectNulls
                    />
                  ))}
                  {/* Historical volume lines */}
                  {segments.map((segment) => (
                    <Line key={segment.id} type="monotone" dataKey={`${segment.id}_vol`} stroke={segment.color} strokeWidth={2} dot={{ fill: segment.color, r: 3 }} connectNulls />
                  ))}
                  {/* Forecast volume lines (dashed) */}
                  {showForecast && segments.map((segment) => (
                    <Line
                      key={`${segment.id}_vol_forecast`}
                      type="monotone"
                      dataKey={`${segment.id}_vol_forecast`}
                      stroke={segment.color}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: segment.color, r: 3, strokeWidth: 2, stroke: "#1e293b" }}
                      connectNulls
                    />
                  ))}
                  {/* Forecast boundary line */}
                  {showForecast && (
                    <ReferenceLine
                      x={segmentMetrics.years[segmentMetrics.years.length - 1]}
                      stroke="#8b5cf6"
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Multi-Factor Radar */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Multi-Factor Comparison
            </h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                  {segments.map((segment) => (
                    <Radar
                      key={segment.id}
                      name={segment.name}
                      dataKey={segment.id}
                      stroke={segment.color}
                      fill={segment.color}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend formatter={(value) => segments.find((s) => s.id === value)?.name || value} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    formatter={(value, name) => {
                      if (typeof value !== 'number') return ['-', String(name)];
                      const segment = segments.find((s) => s.id === name);
                      return [`${value.toFixed(0)}%`, segment?.name || String(name)];
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CAGR Comparison Bar Chart */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-400" />
              CAGR Comparison
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonBarData} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={75} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    formatter={(value) => {
                      if (typeof value !== 'number') return ['-', 'CAGR'];
                      return [`${value.toFixed(2)}%`, "CAGR"];
                    }}
                  />
                  <Bar dataKey="cagr" name="CAGR %" radius={[0, 4, 4, 0]}>
                    {comparisonBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cagr >= 0 ? "#22c55e" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volatility/Stability Chart */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-rose-400" />
              Stability Analysis
              <span className="text-xs text-slate-500 font-normal">(lower = more stable)</span>
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonBarData} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(1)}%`} domain={[0, 'auto']} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={75} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    formatter={(value, name) => {
                      if (typeof value !== 'number') return ['-', String(name)];
                      return [
                        `${value.toFixed(2)}%`,
                        name === "volatility" ? "Price Volatility" : String(name)
                      ];
                    }}
                  />
                  <Bar dataKey="volatility" name="Price Volatility" radius={[0, 4, 4, 0]}>
                    {comparisonBarData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.volatility < 10 ? "#22c55e" : entry.volatility < 20 ? "#f59e0b" : "#ef4444"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Resale Charts Section */}
        <div className="mt-8 mb-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-cyan-400" />
            Resale Analysis (Secondary Market)
            <span className="text-xs font-normal text-slate-500 ml-2">Transactions where السوق = ثانوي</span>
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resale Volume Trend */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-cyan-900/30">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Resale Volume Trend
                <span className="text-xs text-slate-500 font-normal">(# of resales per year)</span>
              </h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelStyle={{ color: "#f1f5f9" }}
                      formatter={(value, name) => {
                        if (typeof value !== 'number') return ['-', name];
                        const segmentId = String(name).replace('_resaleVol', '');
                        const segment = segments.find((s) => s.id === segmentId);
                        return [`${formatNumber(value)} resales`, segment?.name || name];
                      }}
                    />
                    <Legend formatter={(value) => { const segmentId = String(value).replace('_resaleVol', ''); return segments.find((s) => s.id === segmentId)?.name || value; }} wrapperStyle={{ fontSize: 11 }} />
                    {segments.map((segment) => (
                      <Line key={segment.id} type="monotone" dataKey={`${segment.id}_resaleVol`} stroke={segment.color} strokeWidth={2} dot={{ fill: segment.color, r: 3 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resale Rate (Liquidity) Trend */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-cyan-900/30">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Percent className="w-4 h-4 text-cyan-400" />
                Resale Rate (Liquidity)
                <span className="text-xs text-slate-500 font-normal">(% of transactions that are resales)</span>
              </h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} tickFormatter={(value) => `${value?.toFixed(0)}%`} domain={[0, 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelStyle={{ color: "#f1f5f9" }}
                      formatter={(value, name) => {
                        if (typeof value !== 'number') return ['-', name];
                        const segmentId = String(name).replace('_resaleRate', '');
                        const segment = segments.find((s) => s.id === segmentId);
                        return [`${value.toFixed(1)}%`, segment?.name || name];
                      }}
                    />
                    <Legend formatter={(value) => { const segmentId = String(value).replace('_resaleRate', ''); return segments.find((s) => s.id === segmentId)?.name || value; }} wrapperStyle={{ fontSize: 11 }} />
                    {segments.map((segment) => (
                      <Line key={segment.id} type="monotone" dataKey={`${segment.id}_resaleRate`} stroke={segment.color} strokeWidth={2} dot={{ fill: segment.color, r: 3 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resale vs Primary Price Comparison */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-cyan-900/30">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                Resale vs Primary Price/SQM
                <span className="text-xs text-slate-500 font-normal">(solid = resale, dashed = primary)</span>
              </h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelStyle={{ color: "#f1f5f9" }}
                      formatter={(value, name) => {
                        if (typeof value !== 'number' || value === 0) return ['-', name];
                        const nameStr = String(name);
                        const isResale = nameStr.includes('_resalePrice');
                        const isPrimary = nameStr.includes('_primaryPrice');
                        const segmentId = nameStr.replace('_resalePrice', '').replace('_primaryPrice', '');
                        const segment = segments.find((s) => s.id === segmentId);
                        const label = isResale ? 'Resale' : isPrimary ? 'Primary' : '';
                        return [`AED ${formatNumber(value)}/sqm`, `${segment?.name || name} (${label})`];
                      }}
                    />
                    <Legend 
                      formatter={(value) => { 
                        const nameStr = String(value);
                        const isResale = nameStr.includes('_resalePrice');
                        const segmentId = nameStr.replace('_resalePrice', '').replace('_primaryPrice', '');
                        const segment = segments.find((s) => s.id === segmentId);
                        return `${segment?.name || value} ${isResale ? '(Resale)' : '(Primary)'}`; 
                      }} 
                      wrapperStyle={{ fontSize: 10 }} 
                    />
                    {segments.map((segment) => (
                      <Line 
                        key={`${segment.id}_resale`} 
                        type="monotone" 
                        dataKey={`${segment.id}_resalePrice`} 
                        stroke={segment.color} 
                        strokeWidth={2} 
                        dot={{ fill: segment.color, r: 3 }} 
                        connectNulls 
                      />
                    ))}
                    {segments.map((segment) => (
                      <Line 
                        key={`${segment.id}_primary`} 
                        type="monotone" 
                        dataKey={`${segment.id}_primaryPrice`} 
                        stroke={segment.color} 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        dot={{ fill: segment.color, r: 2 }} 
                        connectNulls 
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resale Premium/Discount */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-cyan-900/30">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Resale Premium/Discount
                <span className="text-xs text-slate-500 font-normal">(+ve = resale trades higher)</span>
              </h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#475569" }} tickFormatter={(value) => `${value?.toFixed(0)}%`} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelStyle={{ color: "#f1f5f9" }}
                      formatter={(value, name) => {
                        if (value === null || value === undefined || typeof value !== 'number') return ['-', name];
                        const segmentId = String(name).replace('_resalePremium', '');
                        const segment = segments.find((s) => s.id === segmentId);
                        const label = value >= 0 ? 'Premium' : 'Discount';
                        return [`${value >= 0 ? '+' : ''}${value.toFixed(1)}% ${label}`, segment?.name || name];
                      }}
                    />
                    <Legend formatter={(value) => { const segmentId = String(value).replace('_resalePremium', ''); return segments.find((s) => s.id === segmentId)?.name || value; }} wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey={() => 0} stroke="#475569" strokeDasharray="5 5" dot={false} legendType="none" />
                    {segments.map((segment) => (
                      <Line key={segment.id} type="monotone" dataKey={`${segment.id}_resalePremium`} stroke={segment.color} strokeWidth={2} dot={{ fill: segment.color, r: 3 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resale Summary Bar Chart */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-cyan-900/30">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                Avg Resale Rate by Segment
                <span className="text-xs text-slate-500 font-normal">(higher = more liquid)</span>
              </h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonBarData} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(0)}%`} domain={[0, 'auto']} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={75} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      formatter={(value) => {
                        if (typeof value !== 'number') return ['-', 'Resale Rate'];
                        return [`${value.toFixed(1)}%`, "Avg Resale Rate"];
                      }}
                    />
                    <Bar dataKey="avgResaleRate" name="Avg Resale Rate" radius={[0, 4, 4, 0]}>
                      {comparisonBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Avg Resale Premium Bar Chart */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-cyan-900/30">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                Avg Resale Premium by Segment
                <span className="text-xs text-slate-500 font-normal">(+ve = secondary costs more)</span>
              </h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonBarData} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={75} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      formatter={(value) => {
                        if (typeof value !== 'number') return ['-', 'Premium'];
                        const label = value >= 0 ? 'Premium' : 'Discount';
                        return [`${value >= 0 ? '+' : ''}${value.toFixed(1)}%`, `Avg Resale ${label}`];
                      }}
                    />
                    <Bar dataKey="avgResalePremium" name="Avg Resale Premium" radius={[0, 4, 4, 0]}>
                      {comparisonBarData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.avgResalePremium >= 0 ? "#22c55e" : "#ef4444"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Holding Period Bar Chart */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-cyan-900/30">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Avg Holding Period (Years)
                <span className="text-xs text-slate-500 font-normal">(time between purchase & resale)</span>
              </h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={holdingPeriodBySegment} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(1)} yrs`} domain={[0, 'auto']} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={75} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      formatter={(value, name, props) => {
                        if (typeof value !== 'number') return ['-', 'Holding Period'];
                        const item = props.payload;
                        return [
                          `${value.toFixed(1)} years (median: ${item.medianHoldingPeriod?.toFixed(1) || '-'} yrs)`,
                          `Avg Holding Period (${item.resaleCount?.toLocaleString() || 0} resales)`
                        ];
                      }}
                    />
                    <Bar dataKey="avgHoldingPeriod" name="Avg Holding Period" radius={[0, 4, 4, 0]}>
                      {holdingPeriodBySegment.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resale Appreciation Bar Chart */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-cyan-900/30">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Avg Resale Appreciation
                <span className="text-xs text-slate-500 font-normal">(price gain on resale)</span>
              </h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={holdingPeriodBySegment} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={75} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      formatter={(value, name, props) => {
                        if (typeof value !== 'number') return ['-', 'Appreciation'];
                        const item = props.payload;
                        return [
                          `${value >= 0 ? '+' : ''}${value.toFixed(1)}% (${item.positiveResaleRate?.toFixed(0) || 0}% profitable)`,
                          `Avg Appreciation`
                        ];
                      }}
                    />
                    <Bar dataKey="avgAppreciation" name="Avg Appreciation" radius={[0, 4, 4, 0]}>
                      {holdingPeriodBySegment.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.avgAppreciation >= 0 ? "#22c55e" : "#ef4444"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Annualized Return Bar Chart */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-cyan-900/30">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Avg Annualized Return (CAGR)
                <span className="text-xs text-slate-500 font-normal">(holding-period adjusted)</span>
              </h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={holdingPeriodBySegment} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={75} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      formatter={(value) => {
                        if (typeof value !== 'number') return ['-', 'Annualized Return'];
                        return [
                          `${value >= 0 ? '+' : ''}${value.toFixed(1)}% per year`,
                          `Avg Annualized Return`
                        ];
                      }}
                    />
                    <Bar dataKey="avgAnnualizedReturn" name="Avg Annualized Return" radius={[0, 4, 4, 0]}>
                      {holdingPeriodBySegment.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.avgAnnualizedReturn >= 0 ? "#22c55e" : "#ef4444"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Vintage Performance Analysis Section */}
        <div className="space-y-4 border-t border-slate-700 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-slate-200">Vintage Performance Analysis</h3>
            <span className="text-xs text-slate-400">(Off-plan purchases: How did different purchase years perform?)</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Vintage Appreciation by Purchase Year */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                Vintage Appreciation
                <span className="text-xs text-slate-500 font-normal">(Total gain from purchase year to today)</span>
              </h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vintageChartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: "#94a3b8", fontSize: 11 }} 
                    />
                    <YAxis 
                      tick={{ fill: "#94a3b8", fontSize: 11 }} 
                      tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelFormatter={(label) => `Purchased in ${label}`}
                      formatter={(value, name) => {
                        if (typeof value !== 'number' || value === null) return ['-', 'Appreciation'];
                        const segmentId = String(name).replace('_appreciation', '');
                        const segment = segments.find((s) => s.id === segmentId);
                        return [
                          `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`,
                          segment?.name || 'Unknown'
                        ];
                      }}
                    />
                    <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                    {segments.map((segment) => (
                      <Line
                        key={segment.id}
                        type="monotone"
                        dataKey={`${segment.id}_appreciation`}
                        name={`${segment.id}_appreciation`}
                        stroke={segment.color}
                        strokeWidth={2}
                        dot={{ fill: segment.color, strokeWidth: 2, r: 4 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Shows total appreciation from off-plan purchase price to current ready market price
              </p>
            </div>

            {/* Vintage CAGR by Purchase Year */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                Vintage CAGR
                <span className="text-xs text-slate-500 font-normal">(Annualized return per purchase year)</span>
              </h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vintageChartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: "#94a3b8", fontSize: 11 }} 
                    />
                    <YAxis 
                      tick={{ fill: "#94a3b8", fontSize: 11 }} 
                      tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelFormatter={(label) => `Purchased in ${label}`}
                      formatter={(value, name) => {
                        if (typeof value !== 'number' || value === null) return ['-', 'CAGR'];
                        const segmentId = String(name).replace('_cagr', '');
                        const segment = segments.find((s) => s.id === segmentId);
                        return [
                          `${value >= 0 ? '+' : ''}${value.toFixed(1)}%/yr`,
                          segment?.name || 'Unknown'
                        ];
                      }}
                    />
                    <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                    {segments.map((segment) => (
                      <Line
                        key={segment.id}
                        type="monotone"
                        dataKey={`${segment.id}_cagr`}
                        name={`${segment.id}_cagr`}
                        stroke={segment.color}
                        strokeWidth={2}
                        dot={{ fill: segment.color, strokeWidth: 2, r: 4 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Annualized returns - adjusts for time held (earlier vintages had more time to appreciate)
              </p>
            </div>

            {/* Vintage Purchase Price Comparison */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                Off-Plan Purchase Prices by Vintage
                <span className="text-xs text-slate-500 font-normal">(What each vintage paid)</span>
              </h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vintageChartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: "#94a3b8", fontSize: 11 }} 
                    />
                    <YAxis 
                      tick={{ fill: "#94a3b8", fontSize: 11 }} 
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelFormatter={(label) => `Purchased in ${label}`}
                      formatter={(value, name) => {
                        if (typeof value !== 'number' || value === null) return ['-', 'Price'];
                        const segmentId = String(name).replace('_purchasePrice', '');
                        const segment = segments.find((s) => s.id === segmentId);
                        return [
                          `AED ${value.toLocaleString()}/sqm`,
                          segment?.name || 'Unknown'
                        ];
                      }}
                    />
                    {segments.map((segment, index) => (
                      <Bar
                        key={segment.id}
                        dataKey={`${segment.id}_purchasePrice`}
                        name={`${segment.id}_purchasePrice`}
                        fill={segment.color}
                        radius={[4, 4, 0, 0]}
                        opacity={0.8}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Shows what off-plan buyers paid in each year - helps understand cost basis anchoring
              </p>
            </div>

            {/* Vintage Summary Table */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                Vintage Performance Summary
              </h4>
              <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-800">
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2 px-2">Segment</th>
                      <th className="text-center py-2 px-2">Best Vintage</th>
                      <th className="text-right py-2 px-2">Best CAGR</th>
                      <th className="text-center py-2 px-2">Worst Vintage</th>
                      <th className="text-right py-2 px-2">Current Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vintagePerformanceData.map((segment) => {
                      const sortedVintages = [...segment.vintages].sort((a, b) => b.cagr - a.cagr);
                      const best = sortedVintages[0];
                      const worst = sortedVintages[sortedVintages.length - 1];
                      
                      return (
                        <tr key={segment.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                              <span className="text-slate-300 truncate max-w-[100px]">{segment.name}</span>
                            </div>
                          </td>
                          <td className="text-center py-2 px-2 text-slate-300">
                            {best ? best.purchaseYear : '-'}
                          </td>
                          <td className="text-right py-2 px-2">
                            {best ? (
                              <span className={best.cagr >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {best.cagr >= 0 ? '+' : ''}{best.cagr.toFixed(1)}%/yr
                              </span>
                            ) : '-'}
                          </td>
                          <td className="text-center py-2 px-2 text-slate-300">
                            {worst && sortedVintages.length > 1 ? worst.purchaseYear : '-'}
                          </td>
                          <td className="text-right py-2 px-2 text-slate-300">
                            {segment.currentReadyPrice > 0 
                              ? `AED ${(segment.currentReadyPrice / 1000).toFixed(1)}K` 
                              : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Compare which purchase years performed best across different segments
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Stats */}
        {comparisonStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {comparisonStats.filter((stat) => stat !== null).map((stat) => {
              if (!stat) return null;
              const segment = segments.find((s) => s.id === stat.id);
              
              return (
                <div
                  key={stat.id}
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: `${stat.color}10`, 
                    borderColor: `${stat.color}40` 
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stat.color }}
                      />
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {stat.name}
                      </span>
                    </div>
                    {segment && (
                      <button
                        onClick={() => {
                          const filtered = filterTransactionsForSegment(transactions, segment);
                          const safeName = stat.name.replace(/[^a-zA-Z0-9]/g, "_");
                          exportToCSV(filtered, `${safeName}_transactions`, stat.name);
                        }}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                        title={`Export ${stat.totalTransactions} transactions`}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-xl font-bold text-white mb-1">
                    AED {formatNumber(stat.latestPrice)}/sqm
                  </div>
                  
                  {/* Key metrics grid */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="bg-slate-800/50 rounded p-2">
                      <span className="text-slate-400 block">YoY Growth</span>
                      <span className={`font-semibold ${stat.latestYoY >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {stat.latestYoY >= 0 ? "+" : ""}{stat.latestYoY.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <span className="text-slate-400 block">CAGR</span>
                      <span className={`font-semibold ${stat.cagr >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {stat.cagr >= 0 ? "+" : ""}{stat.cagr.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <span className="text-slate-400 block">Volatility</span>
                      <span className={`font-semibold ${stat.volatility < 10 ? "text-emerald-400" : stat.volatility < 20 ? "text-amber-400" : "text-rose-400"}`}>
                        {stat.volatility.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <span className="text-slate-400 block">Resale Rate</span>
                      <span className={`font-semibold ${stat.avgResaleRate > 20 ? "text-emerald-400" : stat.avgResaleRate > 10 ? "text-amber-400" : "text-slate-300"}`}>
                        {stat.avgResaleRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Resale stats row */}
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div className="bg-cyan-900/20 rounded p-2 border border-cyan-900/30">
                      <span className="text-slate-400 block">Resale Premium</span>
                      <span className={`font-semibold ${stat.avgResalePremium >= 0 ? "text-cyan-400" : "text-rose-400"}`}>
                        {stat.avgResalePremium >= 0 ? "+" : ""}{stat.avgResalePremium.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-cyan-900/20 rounded p-2 border border-cyan-900/30">
                      <span className="text-slate-400 block">Total Resales</span>
                      <span className="font-semibold text-cyan-400">
                        {stat.totalResales.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-700">
                    {stat.totalTransactions.toLocaleString()} transactions
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Export Buttons */}
        {segments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700">
            <button
              onClick={() => {
                exportChartSummary(chartData, segments, "trend_comparison_chart");
              }}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Chart Data
            </button>
            <button
              onClick={() => {
                // Export all segments' transactions in one file
                let allData: string[] = [];
                allData.push("# All Segments Transaction Data");
                allData.push(`# Export Date: ${new Date().toISOString()}`);
                allData.push("");
                
                segments.forEach((segment, idx) => {
                  const filtered = filterTransactionsForSegment(transactions, segment);
                  if (idx > 0) allData.push("");
                  allData.push(`## Segment: ${segment.name}`);
                  allData.push(`## Transactions: ${filtered.length}`);
                  allData.push("");
                  
                  const headers = [
                    "Registration Date", "Year", "Region", "Region (EN)", 
                    "Property Type", "Property Type (EN)", "Property Design",
                    "Sale Type", "Sale Type (EN)", "Market Type", "Project",
                    "Sold Area (sqm)", "Land Area (sqm)", "Total Price (AED)", "Price per SQM (AED)"
                  ];
                  allData.push(headers.join(","));
                  
                  filtered.forEach((t) => {
                    const row = [
                      t.registrationDate || "",
                      t.year || "",
                      t.region || "",
                      translate(t.region, "region"),
                      t.propertyType || "",
                      translate(t.propertyType, "propertyType"),
                      t.propertyDesign || "",
                      t.saleType || "",
                      translate(t.saleType, "saleType"),
                      t.marketType || "",
                      t.project || "",
                      t.soldArea || "",
                      t.landArea || "",
                      t.totalPrice || "",
                      t.pricePerSqm ? t.pricePerSqm.toFixed(2) : "",
                    ].map((cell) => {
                      const str = String(cell);
                      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                        return `"${str.replace(/"/g, '""')}"`;
                      }
                      return str;
                    }).join(",");
                    allData.push(row);
                  });
                });
                
                const blob = new Blob(["\ufeff" + allData.join("\n")], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "all_segments_transactions.csv";
                link.click();
                URL.revokeObjectURL(link.href);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Export All Transactions ({segments.reduce((sum, s) => sum + filterTransactionsForSegment(transactions, s).length, 0).toLocaleString()} rows)
            </button>
          </div>
        )}

      </CardContent>
    </Card>
  );
}



