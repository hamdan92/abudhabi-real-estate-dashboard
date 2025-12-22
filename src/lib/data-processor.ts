import * as XLSX from "xlsx";
import {
  Transaction,
  KPIData,
  YearlyData,
  TimeSeriesData,
  RegionData,
  PropertyTypeData,
  BedroomData,
  MarketSegmentData,
  DashboardData,
  SegmentedDashboardData,
  PropertyTypeAnalysis,
  SaleTypeAnalysis,
  ReadyVsOffPlanComparison,
  SegmentYearlyData,
  RegionComparisonData,
} from "@/types";
import { translate } from "./translations";
import {
  average,
  median,
  calculateChange,
  getYearFromDate,
  getMonthFromDate,
  getQuarterFromDate,
  groupBy,
} from "./utils";
import { calculateCAGR, coefficientOfVariation } from "./forecasting";

// Column name mappings
const COLUMN_MAP: Record<string, keyof Transaction> = {
  "فئة الأصل": "assetCategory",
  "نوع العقار": "propertyType",
  "تاريخ التسجيل": "registrationDate",
  "المساحة المباعة \\ الطابقية (متر مربّع)": "soldArea",
  "مساحة الأرض (متر مربّع)": "landArea",
  "سعر المتر (درهم إماراتي)": "pricePerSqm",
  "تصميم العقار": "propertyDesign",
  "المنطقة": "region",
  "الحوض": "subArea",
  "المشروع": "project",
  "السعر (درهم إماراتي)": "totalPrice",
  "النسبة المباعة": "percentageSold",
  "نوع البيع": "saleType",
  "السوق": "marketType",
};

// Parse Excel date
function parseExcelDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    // Excel serial date
    return new Date((value - 25569) * 86400 * 1000);
  }
  if (typeof value === "string") {
    return new Date(value);
  }
  return new Date();
}

// Load and parse Excel file
export async function loadExcelData(buffer: ArrayBuffer): Promise<Transaction[]> {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet);

  return (rawData as Record<string, unknown>[])
    .map((row, index) => {
      const transaction: Partial<Transaction> = { id: index };

      for (const [arabicKey, englishKey] of Object.entries(COLUMN_MAP)) {
        const value = row[arabicKey];
        
        if (englishKey === "registrationDate") {
          (transaction as Record<string, unknown>)[englishKey] = parseExcelDate(value);
        } else if (
          ["soldArea", "landArea", "pricePerSqm", "totalPrice", "percentageSold"].includes(englishKey)
        ) {
          (transaction as Record<string, unknown>)[englishKey] = typeof value === "number" ? value : 0;
        } else {
          (transaction as Record<string, unknown>)[englishKey] = String(value || "");
        }
      }

      // Add computed fields
      if (transaction.registrationDate) {
        transaction.year = getYearFromDate(transaction.registrationDate);
        transaction.month = getMonthFromDate(transaction.registrationDate);
        transaction.quarter = getQuarterFromDate(transaction.registrationDate);
      }

      return transaction as Transaction;
    })
    .filter((t) => t.registrationDate && !isNaN(t.registrationDate.getTime()));
}

// Filter transactions with comprehensive options
export interface FilterOptions {
  startYear?: number;
  endYear?: number;
  years?: number[];
  regions?: string[];
  propertyTypes?: string[];
  projects?: string[];
  saleTypes?: string[];
  marketTypes?: string[];
  bedrooms?: string[];
  assetCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
}

export function filterTransactions(
  transactions: Transaction[],
  filters: FilterOptions
): Transaction[] {
  return transactions.filter((t) => {
    if (filters.startYear && t.year < filters.startYear) return false;
    if (filters.endYear && t.year > filters.endYear) return false;
    if (filters.years?.length && !filters.years.includes(t.year)) return false;
    if (filters.regions?.length && !filters.regions.includes(t.region)) return false;
    if (filters.propertyTypes?.length && !filters.propertyTypes.includes(t.propertyType)) return false;
    if (filters.projects?.length && !filters.projects.includes(t.project)) return false;
    if (filters.saleTypes?.length && !filters.saleTypes.includes(t.saleType)) return false;
    if (filters.marketTypes?.length && !filters.marketTypes.includes(t.marketType)) return false;
    if (filters.bedrooms?.length && !filters.bedrooms.includes(t.propertyDesign)) return false;
    if (filters.assetCategory && t.assetCategory !== filters.assetCategory) return false;
    if (filters.minPrice && t.totalPrice < filters.minPrice) return false;
    if (filters.maxPrice && t.totalPrice > filters.maxPrice) return false;
    if (filters.minArea && t.soldArea < filters.minArea) return false;
    if (filters.maxArea && t.soldArea > filters.maxArea) return false;
    return true;
  });
}

// Calculate KPIs
export function calculateKPIs(
  transactions: Transaction[],
  previousTransactions?: Transaction[]
): KPIData {
  const totalTransactions = transactions.length;
  const totalValue = transactions.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
  const pricesPerSqm = transactions.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
  const avgPricePerSqm = average(pricesPerSqm);
  const avgPropertyPrice = totalTransactions > 0 ? totalValue / totalTransactions : 0;

  // Find most active region
  const regionCounts = transactions.reduce((acc, t) => {
    acc[t.region] = (acc[t.region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostActiveRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

  // Calculate YoY changes
  let yoyTransactionGrowth = 0;
  let yoyPriceGrowth = 0;

  if (previousTransactions?.length) {
    const prevTotal = previousTransactions.length;
    const prevPrices = previousTransactions.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
    const prevAvgPrice = average(prevPrices);

    yoyTransactionGrowth = calculateChange(totalTransactions, prevTotal);
    yoyPriceGrowth = calculateChange(avgPricePerSqm, prevAvgPrice);
  }

  return {
    totalTransactions,
    totalValue,
    avgPricePerSqm,
    avgPropertyPrice,
    mostActiveRegion,
    mostActiveRegionEn: translate(mostActiveRegion, 'region'),
    yoyTransactionGrowth,
    yoyPriceGrowth,
  };
}

// Calculate yearly data
export function calculateYearlyData(transactions: Transaction[]): YearlyData[] {
  const grouped = groupBy(transactions, "year");

  return Object.entries(grouped)
    .map(([year, txns]) => {
      const pricesPerSqm = txns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
      const totalValue = txns.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

      return {
        year: parseInt(year),
        transactions: txns.length,
        totalValue,
        avgPrice: txns.length > 0 ? totalValue / txns.length : 0,
        avgPricePerSqm: average(pricesPerSqm),
        medianPricePerSqm: median(pricesPerSqm),
      };
    })
    .sort((a, b) => a.year - b.year);
}

// Calculate monthly data
export function calculateMonthlyData(transactions: Transaction[]): TimeSeriesData[] {
  const monthlyMap = new Map<string, Transaction[]>();

  transactions.forEach((t) => {
    const key = `${t.year}-${String(t.month).padStart(2, "0")}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, []);
    }
    monthlyMap.get(key)!.push(t);
  });

  return Array.from(monthlyMap.entries())
    .map(([date, txns]) => {
      const [year, month] = date.split("-").map(Number);
      const pricesPerSqm = txns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
      const totalValue = txns.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

      return {
        date,
        year,
        month,
        transactions: txns.length,
        totalValue,
        avgPricePerSqm: average(pricesPerSqm),
        medianPricePerSqm: median(pricesPerSqm),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Calculate region data
export function calculateRegionData(
  transactions: Transaction[],
  previousYearTransactions?: Transaction[]
): RegionData[] {
  const grouped = groupBy(transactions, "region");
  const previousGrouped = previousYearTransactions ? groupBy(previousYearTransactions, "region") : {};

  return Object.entries(grouped)
    .map(([region, txns]) => {
      const pricesPerSqm = txns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
      const totalValue = txns.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

      let yoyGrowth = 0;
      const prevTxns = previousGrouped[region];
      if (prevTxns?.length) {
        const prevPrices = prevTxns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
        yoyGrowth = calculateChange(average(pricesPerSqm), average(prevPrices));
      }

      return {
        region,
        regionEn: translate(region, 'region'),
        transactions: txns.length,
        totalValue,
        avgPrice: txns.length > 0 ? totalValue / txns.length : 0,
        avgPricePerSqm: average(pricesPerSqm),
        medianPricePerSqm: median(pricesPerSqm),
        yoyGrowth,
      };
    })
    .sort((a, b) => b.transactions - a.transactions);
}

// Calculate property type data with percentages
export function calculatePropertyTypeData(transactions: Transaction[]): PropertyTypeData[] {
  const grouped = groupBy(transactions, "propertyType");
  const total = transactions.length;

  return Object.entries(grouped)
    .map(([type, txns]) => {
      const pricesPerSqm = txns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
      const areas = txns.map((t) => t.soldArea).filter((a) => a > 0);
      const totalValue = txns.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

      return {
        type,
        typeEn: translate(type, 'propertyType'),
        count: txns.length,
        avgPrice: txns.length > 0 ? totalValue / txns.length : 0,
        avgPricePerSqm: average(pricesPerSqm),
        avgArea: average(areas),
        percentage: total > 0 ? (txns.length / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.count - a.count);
}

// Calculate bedroom data
export function calculateBedroomData(transactions: Transaction[]): BedroomData[] {
  const grouped = groupBy(transactions, "propertyDesign");

  return Object.entries(grouped)
    .map(([bedrooms, txns]) => {
      const pricesPerSqm = txns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
      const areas = txns.map((t) => t.soldArea).filter((a) => a > 0);
      const totalValue = txns.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

      return {
        bedrooms,
        bedroomsEn: translate(bedrooms, 'bedroom'),
        count: txns.length,
        avgPrice: txns.length > 0 ? totalValue / txns.length : 0,
        avgPricePerSqm: average(pricesPerSqm),
        avgArea: average(areas),
      };
    })
    .sort((a, b) => b.count - a.count);
}

// Calculate market segments
export function calculateMarketSegments(
  transactions: Transaction[]
): { saleType: MarketSegmentData[]; marketType: MarketSegmentData[] } {
  const total = transactions.length;

  const saleTypeGrouped = groupBy(transactions, "saleType");
  const saleType = Object.entries(saleTypeGrouped).map(([segment, txns]) => {
    const totalValue = txns.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
    return {
      segment,
      segmentEn: translate(segment, 'saleType'),
      transactions: txns.length,
      totalValue,
      avgPrice: txns.length > 0 ? totalValue / txns.length : 0,
      percentage: total > 0 ? (txns.length / total) * 100 : 0,
    };
  });

  const marketTypeGrouped = groupBy(transactions, "marketType");
  const marketType = Object.entries(marketTypeGrouped).map(([segment, txns]) => {
    const totalValue = txns.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
    return {
      segment,
      segmentEn: translate(segment, 'marketType'),
      transactions: txns.length,
      totalValue,
      avgPrice: txns.length > 0 ? totalValue / txns.length : 0,
      percentage: total > 0 ? (txns.length / total) * 100 : 0,
    };
  });

  return { saleType, marketType };
}

// ============================================================================
// SEGMENTED ANALYSIS FUNCTIONS (NEW)
// ============================================================================

// Calculate segment yearly data with YoY growth
function calculateSegmentYearlyData(
  transactions: Transaction[],
  allTransactions: Transaction[]
): SegmentYearlyData[] {
  const grouped = groupBy(transactions, "year");
  const allYearGrouped = groupBy(allTransactions, "year");
  const years = [...new Set(allTransactions.map((t) => t.year))].sort();

  const result: SegmentYearlyData[] = [];

  for (const year of years) {
    const txns = grouped[year] || [];
    const allTxns = allYearGrouped[year] || [];
    const pricesPerSqm = txns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
    const totalValue = txns.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

    // Find previous year for YoY
    const prevYearData = result[result.length - 1];
    const yoyGrowth = prevYearData && prevYearData.avgPricePerSqm > 0
      ? calculateChange(average(pricesPerSqm), prevYearData.avgPricePerSqm)
      : 0;

    result.push({
      year,
      transactions: txns.length,
      totalValue,
      avgPricePerSqm: average(pricesPerSqm),
      medianPricePerSqm: median(pricesPerSqm),
      yoyGrowth,
      marketShare: allTxns.length > 0 ? (txns.length / allTxns.length) * 100 : 0,
    });
  }

  return result;
}

// Calculate property type analysis (full segmented analysis)
export function calculatePropertyTypeAnalysis(
  transactions: Transaction[]
): PropertyTypeAnalysis[] {
  const residentialTxns = transactions.filter((t) => t.assetCategory === "سكني");
  const grouped = groupBy(residentialTxns, "propertyType");
  const total = residentialTxns.length;

  return Object.entries(grouped)
    .filter(([, txns]) => txns.length >= 50) // Only types with sufficient data
    .map(([type, txns]) => {
      const pricesPerSqm = txns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
      const areas = txns.map((t) => t.soldArea).filter((a) => a > 0);
      const totalValue = txns.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

      // Calculate yearly data for this type
      const yearlyData = calculateSegmentYearlyData(txns, residentialTxns);

      // Calculate CAGR
      let cagr = 0;
      if (yearlyData.length >= 2) {
        const firstYear = yearlyData[0];
        const lastYear = yearlyData[yearlyData.length - 1];
        if (firstYear.avgPricePerSqm > 0) {
          cagr = calculateCAGR(
            firstYear.avgPricePerSqm,
            lastYear.avgPricePerSqm,
            yearlyData.length - 1
          );
        }
      }

      // Get YoY growth from latest year
      const yoyGrowth = yearlyData.length > 0 ? yearlyData[yearlyData.length - 1].yoyGrowth : 0;

      // Top regions for this property type
      const regionGrouped = groupBy(txns, "region");
      const topRegions = Object.entries(regionGrouped)
        .map(([region, rTxns]) => ({
          region,
          count: rTxns.length,
          avgPricePerSqm: average(rTxns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000)),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        type,
        typeEn: translate(type, 'propertyType'),
        totalTransactions: txns.length,
        totalValue,
        avgPricePerSqm: average(pricesPerSqm),
        medianPricePerSqm: median(pricesPerSqm),
        avgArea: average(areas),
        marketShare: total > 0 ? (txns.length / total) * 100 : 0,
        yearlyData,
        cagr,
        yoyGrowth,
        topRegions,
      };
    })
    .sort((a, b) => b.totalTransactions - a.totalTransactions);
}

// Calculate sale type analysis (Ready vs Off-Plan)
export function calculateSaleTypeAnalysis(
  transactions: Transaction[]
): SaleTypeAnalysis[] {
  const residentialTxns = transactions.filter((t) => t.assetCategory === "سكني");
  const grouped = groupBy(residentialTxns, "saleType");
  const total = residentialTxns.length;

  return Object.entries(grouped)
    .filter(([saleType]) => saleType === "جاهزة" || saleType === "على المخطط")
    .map(([saleType, txns]) => {
      const pricesPerSqm = txns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
      const totalValue = txns.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

      // Calculate yearly data
      const yearlyData = calculateSegmentYearlyData(txns, residentialTxns);

      // Calculate CAGR
      let cagr = 0;
      if (yearlyData.length >= 2) {
        const firstYear = yearlyData[0];
        const lastYear = yearlyData[yearlyData.length - 1];
        if (firstYear.avgPricePerSqm > 0) {
          cagr = calculateCAGR(
            firstYear.avgPricePerSqm,
            lastYear.avgPricePerSqm,
            yearlyData.length - 1
          );
        }
      }

      const yoyGrowth = yearlyData.length > 0 ? yearlyData[yearlyData.length - 1].yoyGrowth : 0;

      // Price comparison by region
      const regionGrouped = groupBy(txns, "region");
      const priceComparisonByRegion = Object.entries(regionGrouped)
        .map(([region, rTxns]) => ({
          region,
          avgPricePerSqm: average(rTxns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000)),
          transactions: rTxns.length,
        }))
        .filter((r) => r.transactions >= 20)
        .sort((a, b) => b.transactions - a.transactions)
        .slice(0, 15);

      return {
        saleType,
        saleTypeEn: translate(saleType, 'saleType'),
        totalTransactions: txns.length,
        totalValue,
        avgPricePerSqm: average(pricesPerSqm),
        medianPricePerSqm: median(pricesPerSqm),
        marketShare: total > 0 ? (txns.length / total) * 100 : 0,
        yearlyData,
        cagr,
        yoyGrowth,
        priceComparisonByRegion,
      };
    })
    .sort((a, b) => b.totalTransactions - a.totalTransactions);
}

// Calculate Ready vs Off-Plan comparison within same property type and region
export function calculateReadyVsOffPlan(
  transactions: Transaction[]
): ReadyVsOffPlanComparison[] {
  const residentialTxns = transactions.filter((t) => t.assetCategory === "سكني");
  const currentYear = Math.max(...residentialTxns.map((t) => t.year));
  const previousYear = currentYear - 1;

  // Get current and previous year transactions
  const currentTxns = residentialTxns.filter((t) => t.year === currentYear);
  const previousTxns = residentialTxns.filter((t) => t.year === previousYear);

  // Group by region + property type
  const results: ReadyVsOffPlanComparison[] = [];
  const seen = new Set<string>();

  currentTxns.forEach((t) => {
    const key = `${t.region}|${t.propertyType}`;
    if (seen.has(key)) return;
    seen.add(key);

    // Get all transactions for this region + type
    const regionTypeTxns = currentTxns.filter(
      (tx) => tx.region === t.region && tx.propertyType === t.propertyType
    );
    const prevRegionTypeTxns = previousTxns.filter(
      (tx) => tx.region === t.region && tx.propertyType === t.propertyType
    );

    // Split by sale type
    const readyTxns = regionTypeTxns.filter((tx) => tx.saleType === "جاهزة");
    const offPlanTxns = regionTypeTxns.filter((tx) => tx.saleType === "على المخطط");
    const prevReadyTxns = prevRegionTypeTxns.filter((tx) => tx.saleType === "جاهزة");
    const prevOffPlanTxns = prevRegionTypeTxns.filter((tx) => tx.saleType === "على المخطط");

    // Need data for at least one type
    if (readyTxns.length < 5 && offPlanTxns.length < 5) return;

    const readyPrices = readyTxns.map((tx) => tx.pricePerSqm).filter((p) => p > 0 && p < 100000);
    const offPlanPrices = offPlanTxns.map((tx) => tx.pricePerSqm).filter((p) => p > 0 && p < 100000);
    const prevReadyPrices = prevReadyTxns.map((tx) => tx.pricePerSqm).filter((p) => p > 0 && p < 100000);
    const prevOffPlanPrices = prevOffPlanTxns.map((tx) => tx.pricePerSqm).filter((p) => p > 0 && p < 100000);

    const readyAvg = average(readyPrices);
    const offPlanAvg = average(offPlanPrices);
    const prevReadyAvg = average(prevReadyPrices);
    const prevOffPlanAvg = average(prevOffPlanPrices);

    const ready = readyTxns.length >= 5 ? {
      count: readyTxns.length,
      avgPricePerSqm: readyAvg,
      medianPricePerSqm: median(readyPrices),
      yoyGrowth: prevReadyAvg > 0 ? calculateChange(readyAvg, prevReadyAvg) : 0,
    } : null;

    const offPlan = offPlanTxns.length >= 5 ? {
      count: offPlanTxns.length,
      avgPricePerSqm: offPlanAvg,
      medianPricePerSqm: median(offPlanPrices),
      yoyGrowth: prevOffPlanAvg > 0 ? calculateChange(offPlanAvg, prevOffPlanAvg) : 0,
    } : null;

    // Calculate price premium (ready over off-plan)
    let pricePremium = 0;
    if (ready && offPlan && offPlan.avgPricePerSqm > 0) {
      pricePremium = ((ready.avgPricePerSqm - offPlan.avgPricePerSqm) / offPlan.avgPricePerSqm) * 100;
    }

    // Calculate volume ratio
    let volumeRatio = 0;
    if (ready && offPlan && offPlan.count > 0) {
      volumeRatio = ready.count / offPlan.count;
    }

    results.push({
      region: t.region,
      regionEn: translate(t.region, 'region'),
      propertyType: t.propertyType,
      propertyTypeEn: translate(t.propertyType, 'propertyType'),
      ready,
      offPlan,
      pricePremium,
      volumeRatio,
    });
  });

  return results
    .filter((r) => r.ready || r.offPlan)
    .sort((a, b) => {
      const aTotal = (a.ready?.count || 0) + (a.offPlan?.count || 0);
      const bTotal = (b.ready?.count || 0) + (b.offPlan?.count || 0);
      return bTotal - aTotal;
    })
    .slice(0, 50);
}

// Calculate region comparison with filters
export function calculateRegionComparison(
  transactions: Transaction[],
  filters?: {
    propertyType?: string;
    saleType?: string;
    bedrooms?: string;
  }
): RegionComparisonData[] {
  let filtered = transactions.filter((t) => t.assetCategory === "سكني");

  if (filters?.propertyType) {
    filtered = filtered.filter((t) => t.propertyType === filters.propertyType);
  }
  if (filters?.saleType) {
    filtered = filtered.filter((t) => t.saleType === filters.saleType);
  }
  if (filters?.bedrooms) {
    filtered = filtered.filter((t) => t.propertyDesign === filters.bedrooms);
  }

  if (filtered.length === 0) return [];

  const grouped = groupBy(filtered, "region");
  const currentYear = Math.max(...filtered.map((t) => t.year));

  return Object.entries(grouped)
    .filter(([, txns]) => txns.length >= 10)
    .map(([region, txns]) => {
      const pricesPerSqm = txns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
      const totalValue = txns.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

      // Calculate yearly prices for CAGR and volatility
      const yearlyPrices: number[] = [];
      const yearGrouped = groupBy(txns, "year");
      const years = Object.keys(yearGrouped).map(Number).sort();

      years.forEach((year) => {
        const yearTxns = yearGrouped[year];
        const yearPrices = yearTxns.map((t) => t.pricePerSqm).filter((p) => p > 0 && p < 100000);
        if (yearPrices.length > 0) {
          yearlyPrices.push(average(yearPrices));
        }
      });

      // CAGR (3-year if possible)
      let cagr3y = 0;
      if (yearlyPrices.length >= 3) {
        const startIdx = Math.max(0, yearlyPrices.length - 4);
        cagr3y = calculateCAGR(yearlyPrices[startIdx], yearlyPrices[yearlyPrices.length - 1], 3);
      }

      // Volatility
      const volatility = coefficientOfVariation(yearlyPrices);

      // YoY Growth
      let yoyGrowth = 0;
      if (yearlyPrices.length >= 2) {
        yoyGrowth = calculateChange(
          yearlyPrices[yearlyPrices.length - 1],
          yearlyPrices[yearlyPrices.length - 2]
        );
      }

      return {
        region,
        regionEn: translate(region, 'region'),
        transactions: txns.length,
        avgPricePerSqm: average(pricesPerSqm),
        medianPricePerSqm: median(pricesPerSqm),
        totalValue,
        yoyGrowth,
        cagr3y,
        volatility,
        propertyType: filters?.propertyType,
        saleType: filters?.saleType,
        bedrooms: filters?.bedrooms,
      };
    })
    .sort((a, b) => b.transactions - a.transactions);
}

// ============================================================================
// MAIN PROCESSING FUNCTIONS
// ============================================================================

// Process basic dashboard data
export function processDashboardData(transactions: Transaction[]): DashboardData {
  // Filter to residential for most analyses
  const residentialTxns = transactions.filter((t) => t.assetCategory === "سكني");

  // Get current year and previous year data
  const currentYear = Math.max(...transactions.map((t) => t.year));
  const currentYearTxns = residentialTxns.filter((t) => t.year === currentYear);
  const previousYearTxns = residentialTxns.filter((t) => t.year === currentYear - 1);

  return {
    transactions,
    kpis: calculateKPIs(currentYearTxns, previousYearTxns),
    yearlyData: calculateYearlyData(residentialTxns),
    monthlyData: calculateMonthlyData(residentialTxns),
    regionData: calculateRegionData(residentialTxns, previousYearTxns),
    propertyTypeData: calculatePropertyTypeData(transactions),
    bedroomData: calculateBedroomData(residentialTxns),
    marketSegments: calculateMarketSegments(transactions),
  };
}

// Process segmented dashboard data (enhanced)
export function processSegmentedDashboardData(
  transactions: Transaction[]
): SegmentedDashboardData {
  const basicData = processDashboardData(transactions);

  return {
    ...basicData,
    propertyTypeAnalysis: calculatePropertyTypeAnalysis(transactions),
    saleTypeAnalysis: calculateSaleTypeAnalysis(transactions),
    readyVsOffPlan: calculateReadyVsOffPlan(transactions),
  };
}

// Get unique values for filters - sorted by transaction count (most common first)
export function getFilterOptions(transactions: Transaction[]) {
  // Count occurrences for each property type
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

  // Sort property types by count (descending)
  const propertyTypes = [...propertyTypeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);

  // Sort regions by count (descending)
  const regions = [...regionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([region]) => region);

  // Sort projects by count (descending)
  const projects = [...projectCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([project]) => project);

  return {
    regions,
    propertyTypes,
    projects,
    bedrooms: [...new Set(transactions.map((t) => t.propertyDesign))].filter(Boolean).sort(),
    years: [...new Set(transactions.map((t) => t.year))].filter(Boolean).sort(),
    assetCategories: [...new Set(transactions.map((t) => t.assetCategory))].filter(Boolean).sort(),
    saleTypes: [...new Set(transactions.map((t) => t.saleType))].filter(Boolean).sort(),
    marketTypes: [...new Set(transactions.map((t) => t.marketType))].filter(Boolean).sort(),
  };
}
