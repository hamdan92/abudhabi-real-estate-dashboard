/**
 * Resale Analysis Module
 * 
 * Identifies resales by fingerprinting units and tracks:
 * - Holding periods
 * - Price appreciation
 * - Annualized returns (CAGR)
 * - Flip vs long-term performance
 */

import {
  Transaction,
  UnitFingerprint,
  UnitTransaction,
  UnitHistory,
  ResaleMetrics,
  ResaleSegmentData,
  HoldingPeriodBucket,
  ResaleAnalysisResult,
} from "@/types";
import { translate } from "./translations";
import { average, median, groupBy } from "./utils";

// ============================================================================
// UNIT FINGERPRINTING
// ============================================================================

/**
 * Normalize area to reduce false negatives from minor measurement differences
 * We round to nearest 5 sqm for smaller units, 10 sqm for larger
 */
function normalizeArea(area: number): number {
  if (area <= 0) return 0;
  if (area < 100) return Math.round(area / 3) * 3;  // Round to nearest 3 sqm
  if (area < 200) return Math.round(area / 5) * 5;  // Round to nearest 5 sqm
  return Math.round(area / 10) * 10;                // Round to nearest 10 sqm
}

/**
 * Generate a unique fingerprint for a unit
 * Format: region|project|propertyType|propertyDesign|normalizedArea
 */
export function generateFingerprint(t: Transaction): UnitFingerprint {
  const normalizedArea = normalizeArea(t.soldArea);
  
  // Clean and normalize strings
  const region = (t.region || "").trim();
  const project = (t.project || "").trim();
  const propertyType = (t.propertyType || "").trim();
  const propertyDesign = (t.propertyDesign || "").trim();
  
  // Create fingerprint string
  const fingerprint = `${region}|${project}|${propertyType}|${propertyDesign}|${normalizedArea}`;
  
  return {
    fingerprint,
    region,
    project,
    propertyType,
    propertyDesign,
    soldArea: t.soldArea,
    normalizedArea,
  };
}

// ============================================================================
// RESALE IDENTIFICATION
// ============================================================================

/**
 * Calculate holding period between two dates
 */
function calculateHoldingPeriod(buyDate: Date, sellDate: Date): { days: number; years: number } {
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.floor((sellDate.getTime() - buyDate.getTime()) / msPerDay);
  const years = days / 365.25;
  return { days, years };
}

/**
 * Calculate annualized return (CAGR)
 */
function calculateAnnualizedReturn(startPrice: number, endPrice: number, years: number): number {
  if (startPrice <= 0 || years <= 0) return 0;
  return (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;
}

// Configuration for outlier filtering
const RESALE_CONFIG = {
  MIN_HOLDING_DAYS: 90, // Minimum 3 months to be considered a resale
  MAX_APPRECIATION_PERCENT: 300, // Cap at 300% appreciation
  MIN_APPRECIATION_PERCENT: -80, // Floor at -80% loss
  MAX_ANNUALIZED_RETURN: 100, // Cap annual return at 100%
  MIN_ANNUALIZED_RETURN: -50, // Floor annual return at -50%
  MIN_PRICE: 100000, // Minimum price to filter out data errors
  MAX_PRICE_RATIO: 10, // Max price can be 10x previous price (filter extreme outliers)
};

/**
 * Check if a resale transaction is valid (not an outlier)
 */
function isValidResale(
  currentPrice: number,
  previousPrice: number,
  holdingDays: number,
  priceChangePercent: number
): boolean {
  // Check holding period
  if (holdingDays < RESALE_CONFIG.MIN_HOLDING_DAYS) return false;
  
  // Check price ratio (to filter extreme outliers)
  const priceRatio = currentPrice / previousPrice;
  if (priceRatio > RESALE_CONFIG.MAX_PRICE_RATIO || priceRatio < (1 / RESALE_CONFIG.MAX_PRICE_RATIO)) {
    return false;
  }
  
  // Check appreciation bounds
  if (priceChangePercent > RESALE_CONFIG.MAX_APPRECIATION_PERCENT || 
      priceChangePercent < RESALE_CONFIG.MIN_APPRECIATION_PERCENT) {
    return false;
  }
  
  // Check minimum prices
  if (currentPrice < RESALE_CONFIG.MIN_PRICE || previousPrice < RESALE_CONFIG.MIN_PRICE) {
    return false;
  }
  
  return true;
}

/**
 * Group transactions by fingerprint and identify resales
 */
export function identifyResales(transactions: Transaction[]): UnitHistory[] {
  // Filter to residential only for cleaner analysis
  const residentialTxns = transactions.filter(
    (t) => t.assetCategory === "سكني" && t.soldArea > 0 && t.totalPrice > 0
  );
  
  // Group by fingerprint
  const fingerprintMap = new Map<string, { fingerprint: UnitFingerprint; transactions: Transaction[] }>();
  
  residentialTxns.forEach((t) => {
    const fp = generateFingerprint(t);
    
    // Only include if fingerprint has meaningful project info (reduces false positives)
    if (fp.project && fp.project.length > 2) {
      if (!fingerprintMap.has(fp.fingerprint)) {
        fingerprintMap.set(fp.fingerprint, { fingerprint: fp, transactions: [] });
      }
      fingerprintMap.get(fp.fingerprint)!.transactions.push(t);
    }
  });
  
  // Process each unit's history
  const unitHistories: UnitHistory[] = [];
  
  fingerprintMap.forEach(({ fingerprint, transactions: unitTxns }) => {
    // Sort transactions by date (oldest first)
    const sorted = [...unitTxns].sort(
      (a, b) => a.registrationDate.getTime() - b.registrationDate.getTime()
    );
    
    const processedTransactions: UnitTransaction[] = [];
    let previousTxn: Transaction | null = null;
    
    sorted.forEach((t, index) => {
      const isResale = index > 0;
      const unitTxn: UnitTransaction = {
        transactionId: t.id,
        date: t.registrationDate,
        price: t.totalPrice,
        pricePerSqm: t.pricePerSqm,
        saleType: t.saleType,
        marketType: t.marketType,
        year: t.year,
        isResale,
      };
      
      if (isResale && previousTxn) {
        const { days, years } = calculateHoldingPeriod(previousTxn.registrationDate, t.registrationDate);
        const priceChangePercent = previousTxn.totalPrice > 0
          ? ((t.totalPrice - previousTxn.totalPrice) / previousTxn.totalPrice) * 100
          : 0;
        
        // Validate this is a legitimate resale (not an outlier)
        if (!isValidResale(t.totalPrice, previousTxn.totalPrice, days, priceChangePercent)) {
          // Skip this transaction but update previousTxn for next iteration
          previousTxn = t;
          return;
        }
        
        unitTxn.previousPrice = previousTxn.totalPrice;
        unitTxn.previousDate = previousTxn.registrationDate;
        unitTxn.holdingPeriodDays = days;
        unitTxn.holdingPeriodYears = years;
        unitTxn.priceChange = t.totalPrice - previousTxn.totalPrice;
        unitTxn.priceChangePercent = priceChangePercent;
        
        // Cap annualized return to prevent extreme values
        const rawAnnualizedReturn = calculateAnnualizedReturn(
          previousTxn.totalPrice,
          t.totalPrice,
          years
        );
        unitTxn.annualizedReturn = Math.max(
          RESALE_CONFIG.MIN_ANNUALIZED_RETURN,
          Math.min(RESALE_CONFIG.MAX_ANNUALIZED_RETURN, rawAnnualizedReturn)
        );
      }
      
      processedTransactions.push(unitTxn);
      previousTxn = t;
    });
    
    const resaleCount = processedTransactions.filter((t) => t.isResale).length;
    
    unitHistories.push({
      fingerprint,
      transactions: processedTransactions,
      totalSales: processedTransactions.length,
      hasResale: resaleCount > 0,
      resaleCount,
    });
  });
  
  return unitHistories;
}

// ============================================================================
// METRICS CALCULATION
// ============================================================================

/**
 * Calculate aggregate resale metrics
 */
export function calculateResaleMetrics(unitHistories: UnitHistory[]): ResaleMetrics {
  const unitsWithResale = unitHistories.filter((u) => u.hasResale);
  const resaleTransactions = unitHistories
    .flatMap((u) => u.transactions)
    .filter((t) => t.isResale);
  
  // Holding periods
  const holdingPeriods = resaleTransactions
    .map((t) => t.holdingPeriodYears || 0)
    .filter((hp) => hp > 0);
  
  // Appreciations
  const appreciations = resaleTransactions
    .map((t) => t.priceChangePercent || 0);
  
  const positiveResales = appreciations.filter((a) => a > 0).length;
  
  // Annualized returns
  const annualizedReturns = resaleTransactions
    .map((t) => t.annualizedReturn || 0)
    .filter((r) => isFinite(r) && Math.abs(r) < 500); // Filter outliers
  
  // Flip analysis (resale within 2 years)
  const flips = resaleTransactions.filter(
    (t) => (t.holdingPeriodYears || 0) <= 2
  );
  const flipReturns = flips.map((t) => t.priceChangePercent || 0);
  
  // Long-term analysis (5+ years)
  const longTerm = resaleTransactions.filter(
    (t) => (t.holdingPeriodYears || 0) >= 5
  );
  const longTermReturns = longTerm.map((t) => t.priceChangePercent || 0);
  
  return {
    totalUnitsAnalyzed: unitHistories.length,
    unitsWithResale: unitsWithResale.length,
    resaleRate: unitHistories.length > 0
      ? (unitsWithResale.length / unitHistories.length) * 100
      : 0,
    totalResaleTransactions: resaleTransactions.length,
    
    avgHoldingPeriodYears: average(holdingPeriods),
    medianHoldingPeriodYears: median(holdingPeriods),
    minHoldingPeriodYears: holdingPeriods.length > 0 ? Math.min(...holdingPeriods) : 0,
    maxHoldingPeriodYears: holdingPeriods.length > 0 ? Math.max(...holdingPeriods) : 0,
    
    avgAppreciation: average(appreciations),
    medianAppreciation: median(appreciations),
    positiveResaleRate: resaleTransactions.length > 0
      ? (positiveResales / resaleTransactions.length) * 100
      : 0,
    
    avgAnnualizedReturn: average(annualizedReturns),
    medianAnnualizedReturn: median(annualizedReturns),
    
    flipCount: flips.length,
    flipRate: resaleTransactions.length > 0
      ? (flips.length / resaleTransactions.length) * 100
      : 0,
    avgFlipReturn: average(flipReturns),
    
    longTermCount: longTerm.length,
    longTermRate: resaleTransactions.length > 0
      ? (longTerm.length / resaleTransactions.length) * 100
      : 0,
    avgLongTermReturn: average(longTermReturns),
  };
}

/**
 * Calculate resale metrics segmented by a dimension
 */
function calculateSegmentedResaleMetrics(
  unitHistories: UnitHistory[],
  getSegment: (fp: UnitFingerprint) => string,
  translateCategory: "region" | "propertyType" | "saleType" | "bedroom"
): ResaleSegmentData[] {
  const segmentMap = new Map<string, UnitHistory[]>();
  
  unitHistories.forEach((unit) => {
    const segment = getSegment(unit.fingerprint);
    if (!segmentMap.has(segment)) {
      segmentMap.set(segment, []);
    }
    segmentMap.get(segment)!.push(unit);
  });
  
  return Array.from(segmentMap.entries())
    .filter(([, units]) => units.some((u) => u.hasResale)) // Only segments with resales
    .map(([segment, units]) => {
      const resaleUnits = units.filter((u) => u.hasResale);
      const resaleTxns = units
        .flatMap((u) => u.transactions)
        .filter((t) => t.isResale);
      
      const appreciations = resaleTxns.map((t) => t.priceChangePercent || 0);
      const holdingPeriods = resaleTxns.map((t) => t.holdingPeriodYears || 0).filter((h) => h > 0);
      const annualizedReturns = resaleTxns
        .map((t) => t.annualizedReturn || 0)
        .filter((r) => isFinite(r) && Math.abs(r) < 500);
      const positiveCount = appreciations.filter((a) => a > 0).length;
      
      return {
        segment,
        segmentEn: translate(segment, translateCategory),
        unitsWithResale: resaleUnits.length,
        resaleCount: resaleTxns.length,
        resaleRate: units.length > 0 ? (resaleUnits.length / units.length) * 100 : 0,
        avgAppreciation: average(appreciations),
        avgHoldingPeriodYears: average(holdingPeriods),
        avgAnnualizedReturn: average(annualizedReturns),
        positiveResaleRate: resaleTxns.length > 0 ? (positiveCount / resaleTxns.length) * 100 : 0,
      };
    })
    .sort((a, b) => b.resaleCount - a.resaleCount);
}

/**
 * Calculate holding period distribution
 */
function calculateHoldingPeriodDistribution(unitHistories: UnitHistory[]): HoldingPeriodBucket[] {
  const buckets: HoldingPeriodBucket[] = [
    { range: "< 1 year", minYears: 0, maxYears: 1, count: 0, avgAppreciation: 0, avgAnnualizedReturn: 0, positiveRate: 0 },
    { range: "1-2 years", minYears: 1, maxYears: 2, count: 0, avgAppreciation: 0, avgAnnualizedReturn: 0, positiveRate: 0 },
    { range: "2-3 years", minYears: 2, maxYears: 3, count: 0, avgAppreciation: 0, avgAnnualizedReturn: 0, positiveRate: 0 },
    { range: "3-4 years", minYears: 3, maxYears: 4, count: 0, avgAppreciation: 0, avgAnnualizedReturn: 0, positiveRate: 0 },
    { range: "4-5 years", minYears: 4, maxYears: 5, count: 0, avgAppreciation: 0, avgAnnualizedReturn: 0, positiveRate: 0 },
    { range: "5+ years", minYears: 5, maxYears: Infinity, count: 0, avgAppreciation: 0, avgAnnualizedReturn: 0, positiveRate: 0 },
  ];
  
  const resaleTxns = unitHistories
    .flatMap((u) => u.transactions)
    .filter((t) => t.isResale);
  
  const bucketData: Map<string, { appreciations: number[]; returns: number[] }> = new Map();
  buckets.forEach((b) => bucketData.set(b.range, { appreciations: [], returns: [] }));
  
  resaleTxns.forEach((t) => {
    const years = t.holdingPeriodYears || 0;
    const bucket = buckets.find((b) => years >= b.minYears && years < b.maxYears);
    if (bucket) {
      const data = bucketData.get(bucket.range)!;
      data.appreciations.push(t.priceChangePercent || 0);
      if (t.annualizedReturn && isFinite(t.annualizedReturn) && Math.abs(t.annualizedReturn) < 500) {
        data.returns.push(t.annualizedReturn);
      }
    }
  });
  
  return buckets.map((bucket) => {
    const data = bucketData.get(bucket.range)!;
    const positiveCount = data.appreciations.filter((a) => a > 0).length;
    
    return {
      ...bucket,
      count: data.appreciations.length,
      avgAppreciation: average(data.appreciations),
      avgAnnualizedReturn: average(data.returns),
      positiveRate: data.appreciations.length > 0
        ? (positiveCount / data.appreciations.length) * 100
        : 0,
    };
  });
}

/**
 * Calculate appreciation distribution
 */
function calculateAppreciationDistribution(
  unitHistories: UnitHistory[]
): { range: string; count: number; percentage: number }[] {
  const ranges = [
    { range: "< -20%", min: -Infinity, max: -20 },
    { range: "-20% to -10%", min: -20, max: -10 },
    { range: "-10% to 0%", min: -10, max: 0 },
    { range: "0% to 10%", min: 0, max: 10 },
    { range: "10% to 20%", min: 10, max: 20 },
    { range: "20% to 30%", min: 20, max: 30 },
    { range: "30% to 50%", min: 30, max: 50 },
    { range: "50% to 100%", min: 50, max: 100 },
    { range: "> 100%", min: 100, max: Infinity },
  ];
  
  const resaleTxns = unitHistories
    .flatMap((u) => u.transactions)
    .filter((t) => t.isResale);
  
  const total = resaleTxns.length;
  
  return ranges.map(({ range, min, max }) => {
    const count = resaleTxns.filter((t) => {
      const appreciation = t.priceChangePercent || 0;
      return appreciation >= min && appreciation < max;
    }).length;
    
    return {
      range,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    };
  });
}

/**
 * Get resale metrics by purchase year
 */
function calculateResaleByPurchaseYear(unitHistories: UnitHistory[]): ResaleSegmentData[] {
  // Group resales by the year of original purchase
  const yearMap = new Map<number, { units: UnitHistory[]; resales: UnitTransaction[] }>();
  
  unitHistories.forEach((unit) => {
    if (unit.transactions.length === 0) return;
    
    // First transaction is the original purchase
    const purchaseYear = unit.transactions[0].year;
    
    if (!yearMap.has(purchaseYear)) {
      yearMap.set(purchaseYear, { units: [], resales: [] });
    }
    
    yearMap.get(purchaseYear)!.units.push(unit);
    
    // Add resale transactions
    unit.transactions.forEach((t) => {
      if (t.isResale) {
        yearMap.get(purchaseYear)!.resales.push(t);
      }
    });
  });
  
  return Array.from(yearMap.entries())
    .filter(([, data]) => data.resales.length > 0)
    .map(([year, data]) => {
      const resaleUnits = data.units.filter((u) => u.hasResale);
      const appreciations = data.resales.map((t) => t.priceChangePercent || 0);
      const holdingPeriods = data.resales.map((t) => t.holdingPeriodYears || 0).filter((h) => h > 0);
      const annualizedReturns = data.resales
        .map((t) => t.annualizedReturn || 0)
        .filter((r) => isFinite(r) && Math.abs(r) < 500);
      const positiveCount = appreciations.filter((a) => a > 0).length;
      
      return {
        segment: year.toString(),
        segmentEn: year.toString(),
        unitsWithResale: resaleUnits.length,
        resaleCount: data.resales.length,
        resaleRate: data.units.length > 0 ? (resaleUnits.length / data.units.length) * 100 : 0,
        avgAppreciation: average(appreciations),
        avgHoldingPeriodYears: average(holdingPeriods),
        avgAnnualizedReturn: average(annualizedReturns),
        positiveResaleRate: data.resales.length > 0 ? (positiveCount / data.resales.length) * 100 : 0,
      };
    })
    .sort((a, b) => parseInt(a.segment) - parseInt(b.segment));
}

/**
 * Get original sale type for resale analysis
 * (What type was the unit when first purchased - off-plan or ready?)
 */
function calculateResaleByOriginalSaleType(unitHistories: UnitHistory[]): ResaleSegmentData[] {
  const typeMap = new Map<string, { units: UnitHistory[]; resales: UnitTransaction[] }>();
  
  unitHistories.forEach((unit) => {
    if (unit.transactions.length === 0) return;
    
    // First transaction's sale type
    const originalSaleType = unit.transactions[0].saleType || "Unknown";
    
    if (!typeMap.has(originalSaleType)) {
      typeMap.set(originalSaleType, { units: [], resales: [] });
    }
    
    typeMap.get(originalSaleType)!.units.push(unit);
    
    unit.transactions.forEach((t) => {
      if (t.isResale) {
        typeMap.get(originalSaleType)!.resales.push(t);
      }
    });
  });
  
  return Array.from(typeMap.entries())
    .filter(([, data]) => data.resales.length > 0)
    .map(([saleType, data]) => {
      const resaleUnits = data.units.filter((u) => u.hasResale);
      const appreciations = data.resales.map((t) => t.priceChangePercent || 0);
      const holdingPeriods = data.resales.map((t) => t.holdingPeriodYears || 0).filter((h) => h > 0);
      const annualizedReturns = data.resales
        .map((t) => t.annualizedReturn || 0)
        .filter((r) => isFinite(r) && Math.abs(r) < 500);
      const positiveCount = appreciations.filter((a) => a > 0).length;
      
      return {
        segment: saleType,
        segmentEn: translate(saleType, "saleType"),
        unitsWithResale: resaleUnits.length,
        resaleCount: data.resales.length,
        resaleRate: data.units.length > 0 ? (resaleUnits.length / data.units.length) * 100 : 0,
        avgAppreciation: average(appreciations),
        avgHoldingPeriodYears: average(holdingPeriods),
        avgAnnualizedReturn: average(annualizedReturns),
        positiveResaleRate: data.resales.length > 0 ? (positiveCount / data.resales.length) * 100 : 0,
      };
    })
    .sort((a, b) => b.resaleCount - a.resaleCount);
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Perform full resale analysis
 */
export function performResaleAnalysis(transactions: Transaction[]): ResaleAnalysisResult {
  // Step 1: Identify resales through fingerprinting
  const unitHistories = identifyResales(transactions);
  
  // Step 2: Calculate overall metrics
  const metrics = calculateResaleMetrics(unitHistories);
  
  // Step 3: Segment by region
  const byRegion = calculateSegmentedResaleMetrics(
    unitHistories,
    (fp) => fp.region,
    "region"
  );
  
  // Step 4: Segment by property type
  const byPropertyType = calculateSegmentedResaleMetrics(
    unitHistories,
    (fp) => fp.propertyType,
    "propertyType"
  );
  
  // Step 5: Segment by original sale type
  const bySaleType = calculateResaleByOriginalSaleType(unitHistories);
  
  // Step 6: Segment by purchase year
  const byPurchaseYear = calculateResaleByPurchaseYear(unitHistories);
  
  // Step 7: Holding period distribution
  const holdingPeriodDistribution = calculateHoldingPeriodDistribution(unitHistories);
  
  // Step 8: Appreciation distribution
  const appreciationDistribution = calculateAppreciationDistribution(unitHistories);
  
  // Step 9: Top and worst performing units
  const unitsWithResale = unitHistories.filter((u) => u.hasResale);
  
  const topPerformingUnits = [...unitsWithResale]
    .sort((a, b) => {
      const aReturn = a.transactions.find((t) => t.isResale)?.annualizedReturn || 0;
      const bReturn = b.transactions.find((t) => t.isResale)?.annualizedReturn || 0;
      return bReturn - aReturn;
    })
    .slice(0, 20);
  
  const worstPerformingUnits = [...unitsWithResale]
    .sort((a, b) => {
      const aReturn = a.transactions.find((t) => t.isResale)?.annualizedReturn || 0;
      const bReturn = b.transactions.find((t) => t.isResale)?.annualizedReturn || 0;
      return aReturn - bReturn;
    })
    .slice(0, 20);
  
  return {
    metrics,
    byRegion,
    byPropertyType,
    bySaleType,
    byPurchaseYear,
    holdingPeriodDistribution,
    appreciationDistribution,
    topPerformingUnits,
    worstPerformingUnits,
  };
}

/**
 * Get confidence level for resale identification
 * Based on how unique the fingerprint is
 */
export function getResaleConfidence(unitHistories: UnitHistory[]): {
  high: number;    // Unique project + design + area
  medium: number;  // May have some overlap
  low: number;     // High risk of false positives
} {
  let high = 0;
  let medium = 0;
  let low = 0;
  
  const unitsWithResale = unitHistories.filter((u) => u.hasResale);
  
  unitsWithResale.forEach((unit) => {
    const fp = unit.fingerprint;
    
    // High confidence: specific project, specific design, and area variation is small
    if (fp.project && fp.project.length > 3 && fp.propertyDesign) {
      high++;
    }
    // Medium confidence: has project but generic design
    else if (fp.project && fp.project.length > 3) {
      medium++;
    }
    // Low confidence: generic or missing project info
    else {
      low++;
    }
  });
  
  return { high, medium, low };
}

