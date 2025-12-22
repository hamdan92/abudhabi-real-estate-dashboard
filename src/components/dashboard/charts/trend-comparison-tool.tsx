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
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Transaction, UnitTransaction } from "@/types";
import { formatNumber } from "@/lib/utils";
import { translate } from "@/lib/translations";
import { identifyResales } from "@/lib/resale-analysis";
import { Plus, X, TrendingUp, Layers, Download, FileSpreadsheet, BarChart3, Activity, Target, Gauge, Repeat, Clock, DollarSign, Percent } from "lucide-react";

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
  segment: { region: string; propertyType: string; bedrooms: string; saleType: string }
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
      color: LINE_COLORS[0],
    },
  ]);

  const [isAddingSegment, setIsAddingSegment] = useState(false);
  const [newSegment, setNewSegment] = useState<Partial<Segment>>({
    region: "all",
    propertyType: "all",
    bedrooms: "all",
    saleType: "all",
  });

  // Get filter options
  const filterOptions = useMemo(() => {
    // Count by property type to sort by frequency
    const propertyTypeCounts = new Map<string, number>();
    const regionCounts = new Map<string, number>();
    
    transactions.forEach((t) => {
      if (t.propertyType) {
        propertyTypeCounts.set(t.propertyType, (propertyTypeCounts.get(t.propertyType) || 0) + 1);
      }
      if (t.region) {
        regionCounts.set(t.region, (regionCounts.get(t.region) || 0) + 1);
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
    };
  }, [transactions]);

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
    if (seg.region && seg.region !== "all") {
      parts.push(translate(seg.region, 'region'));
    }
    if (seg.saleType && seg.saleType !== "all") {
      parts.push(translate(seg.saleType, 'saleType'));
    }
    
    return parts.length > 0 ? parts.join(" - ") : "All Properties";
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
        color,
      },
    ]);
    
    setNewSegment({
      region: "all",
      propertyType: "all",
      bedrooms: "all",
      saleType: "all",
    });
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
                  { id: "apt", name: "Apartments", region: "all", propertyType: "شقة", bedrooms: "all", saleType: "all", color: LINE_COLORS[0] },
                  { id: "villa", name: "Villas", region: "all", propertyType: "ڨيلا", bedrooms: "all", saleType: "all", color: LINE_COLORS[1] },
                  { id: "townhouse", name: "Townhouses", region: "all", propertyType: "تاونهاوس / ڨيلا شبه منفصلة", bedrooms: "all", saleType: "all", color: LINE_COLORS[2] },
                ])}
                className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition-colors"
              >
                Apt vs Villa vs Townhouse
              </button>
              <button
                onClick={() => setSegments([
                  { id: "apt-ready", name: "Apartment - Ready", region: "all", propertyType: "شقة", bedrooms: "all", saleType: "جاهزة", color: LINE_COLORS[0] },
                  { id: "apt-offplan", name: "Apartment - Off-Plan", region: "all", propertyType: "شقة", bedrooms: "all", saleType: "على المخطط", color: LINE_COLORS[1] },
                ])}
                className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition-colors"
              >
                Apt: Ready vs Off-Plan
              </button>
              <button
                onClick={() => setSegments([
                  { id: "villa-ready", name: "Villa - Ready", region: "all", propertyType: "ڨيلا", bedrooms: "all", saleType: "جاهزة", color: LINE_COLORS[0] },
                  { id: "villa-offplan", name: "Villa - Off-Plan", region: "all", propertyType: "ڨيلا", bedrooms: "all", saleType: "على المخطط", color: LINE_COLORS[1] },
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
                  { id: "overall", name: "Overall Market", region: "all", propertyType: "all", bedrooms: "all", saleType: "all", color: LINE_COLORS[0] },
                  { id: "yas", name: "Yas Island", region: "جزيرة ياس", propertyType: "all", bedrooms: "all", saleType: "all", color: LINE_COLORS[1] },
                  { id: "saadiyat", name: "Saadiyat", region: "جزيرة السعديات", propertyType: "all", bedrooms: "all", saleType: "all", color: LINE_COLORS[2] },
                  { id: "reem", name: "Reem Island", region: "جزيرة الريم", propertyType: "all", bedrooms: "all", saleType: "all", color: LINE_COLORS[3] },
                ])}
                className="px-3 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors"
              >
                Premium Islands vs Market
              </button>
              <button
                onClick={() => setSegments([
                  { id: "yas-villa", name: "Villa - Yas", region: "جزيرة ياس", propertyType: "ڨيلا", bedrooms: "all", saleType: "all", color: LINE_COLORS[0] },
                  { id: "saadiyat-villa", name: "Villa - Saadiyat", region: "جزيرة السعديات", propertyType: "ڨيلا", bedrooms: "all", saleType: "all", color: LINE_COLORS[1] },
                  { id: "reem-villa", name: "Villa - Reem", region: "جزيرة الريم", propertyType: "ڨيلا", bedrooms: "all", saleType: "all", color: LINE_COLORS[2] },
                ])}
                className="px-3 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors"
              >
                Villas: Yas vs Saadiyat vs Reem
              </button>
              <button
                onClick={() => setSegments([
                  { id: "yas-apt", name: "Apt - Yas", region: "جزيرة ياس", propertyType: "شقة", bedrooms: "all", saleType: "all", color: LINE_COLORS[0] },
                  { id: "saadiyat-apt", name: "Apt - Saadiyat", region: "جزيرة السعديات", propertyType: "شقة", bedrooms: "all", saleType: "all", color: LINE_COLORS[1] },
                  { id: "reem-apt", name: "Apt - Reem", region: "جزيرة الريم", propertyType: "شقة", bedrooms: "all", saleType: "all", color: LINE_COLORS[2] },
                ])}
                className="px-3 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors"
              >
                Apartments: Yas vs Saadiyat vs Reem
              </button>
              <button
                onClick={() => setSegments([
                  { id: "khalifa", name: "Khalifa City", region: "مدينة خليفة", propertyType: "all", bedrooms: "all", saleType: "all", color: LINE_COLORS[0] },
                  { id: "shamkha", name: "Al Shamkha", region: "الشامخة", propertyType: "all", bedrooms: "all", saleType: "all", color: LINE_COLORS[1] },
                  { id: "reef", name: "Al Reef", region: "الريف", propertyType: "all", bedrooms: "all", saleType: "all", color: LINE_COLORS[2] },
                  { id: "raha", name: "Al Raha", region: "الراحة", propertyType: "all", bedrooms: "all", saleType: "all", color: LINE_COLORS[3] },
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
                  { id: "studio", name: "Studio", region: "all", propertyType: "all", bedrooms: "Studio", saleType: "all", color: LINE_COLORS[0] },
                  { id: "1br", name: "1 BR", region: "all", propertyType: "all", bedrooms: "1 BR", saleType: "all", color: LINE_COLORS[1] },
                  { id: "2br", name: "2 BR", region: "all", propertyType: "all", bedrooms: "2 BR", saleType: "all", color: LINE_COLORS[2] },
                  { id: "3br", name: "3 BR", region: "all", propertyType: "all", bedrooms: "3 BR", saleType: "all", color: LINE_COLORS[3] },
                ])}
                className="px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors"
              >
                Studio vs 1BR vs 2BR vs 3BR
              </button>
              <button
                onClick={() => setSegments([
                  { id: "3br", name: "3 BR", region: "all", propertyType: "all", bedrooms: "3 BR", saleType: "all", color: LINE_COLORS[0] },
                  { id: "4br", name: "4 BR", region: "all", propertyType: "all", bedrooms: "4 BR", saleType: "all", color: LINE_COLORS[1] },
                  { id: "5br", name: "5 BR", region: "all", propertyType: "all", bedrooms: "5 BR", saleType: "all", color: LINE_COLORS[2] },
                ])}
                className="px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors"
              >
                3BR vs 4BR vs 5BR
              </button>
              <button
                onClick={() => setSegments([
                  { id: "ready", name: "Ready Properties", region: "all", propertyType: "all", bedrooms: "all", saleType: "جاهزة", color: LINE_COLORS[0] },
                  { id: "offplan", name: "Off-Plan Properties", region: "all", propertyType: "all", bedrooms: "all", saleType: "على المخطط", color: LINE_COLORS[1] },
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

            <div className="flex items-center justify-between">
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

        {/* All Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Price Trend Chart */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Price/SQM Trend
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
                      if (typeof value !== 'number') return ['-', name];
                      const segment = segments.find((s) => s.id === name);
                      return [`AED ${formatNumber(value)}/sqm`, segment?.name || name];
                    }}
                  />
                  <Legend formatter={(value) => segments.find((s) => s.id === value)?.name || value} wrapperStyle={{ fontSize: 11 }} />
                  {segments.map((segment) => (
                    <Line key={segment.id} type="monotone" dataKey={segment.id} stroke={segment.color} strokeWidth={2} dot={{ fill: segment.color, r: 3 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* YoY Growth Chart */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Year-over-Year Growth
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
                      if (value === null || value === undefined) return ['-', name];
                      const segmentId = String(name).replace('_yoy', '');
                      const segment = segments.find((s) => s.id === segmentId);
                      return [`${Number(value).toFixed(1)}%`, segment?.name || name];
                    }}
                  />
                  <Legend formatter={(value) => { const segmentId = String(value).replace('_yoy', ''); return segments.find((s) => s.id === segmentId)?.name || value; }} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey={() => 0} stroke="#475569" strokeDasharray="5 5" dot={false} legendType="none" />
                  {segments.map((segment) => (
                    <Line key={segment.id} type="monotone" dataKey={`${segment.id}_yoy`} stroke={segment.color} strokeWidth={2} dot={{ fill: segment.color, r: 3 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume Chart */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Transaction Volume
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
                      const segmentId = String(name).replace('_vol', '');
                      const segment = segments.find((s) => s.id === segmentId);
                      return [`${formatNumber(value)} transactions`, segment?.name || name];
                    }}
                  />
                  <Legend formatter={(value) => { const segmentId = String(value).replace('_vol', ''); return segments.find((s) => s.id === segmentId)?.name || value; }} wrapperStyle={{ fontSize: 11 }} />
                  {segments.map((segment) => (
                    <Line key={segment.id} type="monotone" dataKey={`${segment.id}_vol`} stroke={segment.color} strokeWidth={2} dot={{ fill: segment.color, r: 3 }} connectNulls />
                  ))}
                </LineChart>
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

