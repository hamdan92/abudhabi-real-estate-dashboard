import { Transaction, YearlyData, RegionData } from "@/types";

// ============================================================================
// STATISTICAL UTILITIES
// ============================================================================

// Calculate standard deviation
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

// Calculate coefficient of variation (volatility metric)
export function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  return (standardDeviation(values) / mean) * 100;
}

// Calculate CAGR (Compound Annual Growth Rate)
export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

// Calculate maximum drawdown
export function calculateMaxDrawdown(values: number[]): number {
  if (values.length < 2) return 0;
  let maxDrawdown = 0;
  let peak = values[0];

  for (const value of values) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = ((peak - value) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  return maxDrawdown;
}

// Simple linear regression for trend forecasting
export function linearRegression(data: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  r2: number;
  standardError: number;
} {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0, standardError: 0 };

  const sumX = data.reduce((sum, d) => sum + d.x, 0);
  const sumY = data.reduce((sum, d) => sum + d.y, 0);
  const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
  const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const meanY = sumY / n;
  const ssTotal = data.reduce((sum, d) => sum + Math.pow(d.y - meanY, 2), 0);
  const ssResidual = data.reduce(
    (sum, d) => sum + Math.pow(d.y - (slope * d.x + intercept), 2),
    0
  );
  const r2 = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

  // Calculate standard error of regression
  const standardError = n > 2 ? Math.sqrt(ssResidual / (n - 2)) : 0;

  return { slope, intercept, r2, standardError };
}

// ============================================================================
// HOLT'S LINEAR EXPONENTIAL SMOOTHING (Double Exponential Smoothing)
// Better for small samples - gives more weight to recent observations
// ============================================================================

export interface HoltForecastResult {
  forecasts: { period: number; value: number; lower: number; upper: number }[];
  level: number;        // Final smoothed level
  trend: number;        // Final smoothed trend
  alpha: number;        // Level smoothing parameter used
  beta: number;         // Trend smoothing parameter used
  mape: number;         // Mean Absolute Percentage Error (model fit)
  fittedValues: number[]; // In-sample fitted values
}

/**
 * Holt's Linear Exponential Smoothing
 * 
 * Better than linear regression for time series because:
 * 1. Gives more weight to recent observations (exponential decay)
 * 2. Captures both level and trend separately
 * 3. Adapts to changing trends
 * 4. Works well with limited data points
 * 
 * @param values - Array of historical values (chronological order)
 * @param periodsAhead - Number of periods to forecast
 * @param alpha - Level smoothing (0-1, higher = more weight to recent). Auto-optimized if not provided.
 * @param beta - Trend smoothing (0-1, higher = more weight to recent trend). Auto-optimized if not provided.
 */
export function holtLinearSmoothing(
  values: number[],
  periodsAhead: number = 3,
  alpha?: number,
  beta?: number
): HoltForecastResult {
  const n = values.length;
  
  if (n < 2) {
    return {
      forecasts: [],
      level: values[0] || 0,
      trend: 0,
      alpha: 0,
      beta: 0,
      mape: 0,
      fittedValues: [],
    };
  }

  // Auto-optimize alpha and beta if not provided
  // Use grid search to minimize MAPE
  if (alpha === undefined || beta === undefined) {
    const optimized = optimizeHoltParameters(values);
    alpha = optimized.alpha;
    beta = optimized.beta;
  }

  // Initialize level and trend using first two observations
  // This is a common initialization method
  let level = values[0];
  let trend = values[1] - values[0];

  const fittedValues: number[] = [values[0]]; // First fitted value is just the first observation
  
  // Apply Holt's smoothing
  for (let i = 1; i < n; i++) {
    const prevLevel = level;
    const prevTrend = trend;
    
    // Update level: weighted average of current value and previous forecast
    level = alpha * values[i] + (1 - alpha) * (prevLevel + prevTrend);
    
    // Update trend: weighted average of current trend and previous trend
    trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
    
    fittedValues.push(prevLevel + prevTrend); // One-step ahead forecast
  }

  // Calculate MAPE (Mean Absolute Percentage Error)
  let mapeSum = 0;
  let validCount = 0;
  for (let i = 1; i < n; i++) {
    if (values[i] !== 0) {
      mapeSum += Math.abs((values[i] - fittedValues[i]) / values[i]);
      validCount++;
    }
  }
  const mape = validCount > 0 ? (mapeSum / validCount) * 100 : 0;

  // Calculate standard deviation of residuals for confidence intervals
  const residuals = values.slice(1).map((v, i) => v - fittedValues[i + 1]);
  const residualMean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
  const residualVariance = residuals.reduce((sum, r) => sum + Math.pow(r - residualMean, 2), 0) / residuals.length;
  const residualStd = Math.sqrt(residualVariance);

  // Generate forecasts
  const forecasts: { period: number; value: number; lower: number; upper: number }[] = [];
  
  for (let h = 1; h <= periodsAhead; h++) {
    const forecast = level + h * trend;
    
    // Confidence interval widens with forecast horizon
    // Using approximate prediction interval formula for Holt's method
    const horizonFactor = Math.sqrt(1 + (h - 1) * (alpha * alpha) * (1 + h * beta));
    const margin = 1.96 * residualStd * horizonFactor;
    
    forecasts.push({
      period: h,
      value: Math.max(0, forecast),
      lower: Math.max(0, forecast - margin),
      upper: forecast + margin,
    });
  }

  return {
    forecasts,
    level,
    trend,
    alpha,
    beta,
    mape,
    fittedValues,
  };
}

/**
 * Optimize Holt's parameters using grid search
 * Minimizes MAPE (Mean Absolute Percentage Error)
 */
function optimizeHoltParameters(values: number[]): { alpha: number; beta: number } {
  let bestAlpha = 0.3;
  let bestBeta = 0.1;
  let bestMape = Infinity;

  // Grid search over parameter space
  // For small datasets, we use a coarser grid
  const alphaRange = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  const betaRange = [0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5];

  for (const alpha of alphaRange) {
    for (const beta of betaRange) {
      const result = holtLinearSmoothing(values, 1, alpha, beta);
      if (result.mape < bestMape && result.mape > 0) {
        bestMape = result.mape;
        bestAlpha = alpha;
        bestBeta = beta;
      }
    }
  }

  return { alpha: bestAlpha, beta: bestBeta };
}

/**
 * Ensemble forecast combining multiple methods
 * More robust than any single method for small samples
 */
export function ensembleForecast(
  values: number[],
  periodsAhead: number = 3
): {
  forecasts: { period: number; value: number; lower: number; upper: number }[];
  methods: {
    holt: { weight: number; contribution: number[] };
    linear: { weight: number; contribution: number[] };
    naive: { weight: number; contribution: number[] };
  };
  modelInfo: string;
} {
  const n = values.length;
  
  if (n < 3) {
    // Not enough data for ensemble - use simple extrapolation
    const lastValue = values[n - 1] || 0;
    const trend = n >= 2 ? (values[n - 1] - values[n - 2]) : 0;
    return {
      forecasts: Array.from({ length: periodsAhead }, (_, i) => ({
        period: i + 1,
        value: Math.max(0, lastValue + trend * (i + 1)),
        lower: Math.max(0, lastValue + trend * (i + 1) * 0.7),
        upper: lastValue + trend * (i + 1) * 1.3,
      })),
      methods: {
        holt: { weight: 0, contribution: [] },
        linear: { weight: 0, contribution: [] },
        naive: { weight: 1, contribution: Array.from({ length: periodsAhead }, (_, i) => lastValue + trend * (i + 1)) },
      },
      modelInfo: "Insufficient data - using simple trend extrapolation",
    };
  }

  // Method 1: Holt's Linear Exponential Smoothing
  const holtResult = holtLinearSmoothing(values, periodsAhead);
  const holtForecasts = holtResult.forecasts.map(f => f.value);

  // Method 2: Linear Regression
  const linearData = values.map((y, x) => ({ x, y }));
  const linearReg = linearRegression(linearData);
  const linearForecasts = Array.from({ length: periodsAhead }, (_, i) => 
    Math.max(0, linearReg.slope * (n + i) + linearReg.intercept)
  );

  // Method 3: Naive trend (last observation + average trend)
  const avgTrend = (values[n - 1] - values[0]) / (n - 1);
  const naiveForecasts = Array.from({ length: periodsAhead }, (_, i) => 
    Math.max(0, values[n - 1] + avgTrend * (i + 1))
  );

  // Calculate weights based on recent performance (inverse of error)
  // Give more weight to methods that fit recent data better
  const calcRecentError = (fittedFn: (idx: number) => number) => {
    // Focus on last 3 observations
    const recentN = Math.min(3, n - 1);
    let error = 0;
    for (let i = n - recentN; i < n; i++) {
      const fitted = fittedFn(i);
      error += Math.abs((values[i] - fitted) / values[i]);
    }
    return error / recentN;
  };

  const holtError = calcRecentError((i) => holtResult.fittedValues[i] || values[i]);
  const linearError = calcRecentError((i) => linearReg.slope * i + linearReg.intercept);
  const naiveError = calcRecentError((i) => values[Math.max(0, i - 1)] + avgTrend);

  // Convert errors to weights (inverse, normalized)
  const totalInvError = 1 / (holtError + 0.01) + 1 / (linearError + 0.01) + 1 / (naiveError + 0.01);
  const holtWeight = (1 / (holtError + 0.01)) / totalInvError;
  const linearWeight = (1 / (linearError + 0.01)) / totalInvError;
  const naiveWeight = (1 / (naiveError + 0.01)) / totalInvError;

  // Combine forecasts with weights
  const forecasts = Array.from({ length: periodsAhead }, (_, i) => {
    const value = holtWeight * holtForecasts[i] + 
                  linearWeight * linearForecasts[i] + 
                  naiveWeight * naiveForecasts[i];
    
    // Confidence interval based on spread of methods
    const spread = Math.max(
      Math.abs(holtForecasts[i] - value),
      Math.abs(linearForecasts[i] - value),
      Math.abs(naiveForecasts[i] - value)
    );
    
    // Widen confidence interval for further horizons
    const horizonFactor = 1 + i * 0.3;
    const margin = spread * horizonFactor * 1.5;
    
    return {
      period: i + 1,
      value: Math.max(0, value),
      lower: Math.max(0, value - margin),
      upper: value + margin,
    };
  });

  return {
    forecasts,
    methods: {
      holt: { weight: holtWeight, contribution: holtForecasts },
      linear: { weight: linearWeight, contribution: linearForecasts },
      naive: { weight: naiveWeight, contribution: naiveForecasts },
    },
    modelInfo: `Ensemble (Holt: ${(holtWeight * 100).toFixed(0)}%, Linear: ${(linearWeight * 100).toFixed(0)}%, Naive: ${(naiveWeight * 100).toFixed(0)}%)`,
  };
}

// ============================================================================
// RISK METRICS
// ============================================================================

export interface RiskMetrics {
  volatility: number; // Price volatility (coefficient of variation)
  maxDrawdown: number; // Maximum peak-to-trough decline
  trendStability: number; // R² of price trend (0-100)
  priceVolatilityRating: "Low" | "Medium" | "High" | "Very High";
  riskLevel: "Conservative" | "Moderate" | "Aggressive" | "Speculative";
  consistencyScore: number; // How consistent is growth (0-100)
}

export function calculateRiskMetrics(yearlyData: YearlyData[]): RiskMetrics {
  const prices = yearlyData.map((d) => d.medianPricePerSqm);
  const yoyChanges: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    yoyChanges.push(((prices[i] - prices[i - 1]) / prices[i - 1]) * 100);
  }

  // Volatility (coefficient of variation of prices)
  const volatility = coefficientOfVariation(prices);

  // Max drawdown
  const maxDrawdown = calculateMaxDrawdown(prices);

  // Trend stability (R² of linear regression)
  const priceData = yearlyData.map((d, i) => ({ x: i, y: d.medianPricePerSqm }));
  const regression = linearRegression(priceData);
  const trendStability = regression.r2 * 100;

  // Growth consistency (based on YoY changes)
  const positiveYears = yoyChanges.filter((c) => c > 0).length;
  const consistencyScore = (positiveYears / Math.max(1, yoyChanges.length)) * 100;

  // Price volatility rating
  let priceVolatilityRating: RiskMetrics["priceVolatilityRating"] = "Low";
  if (volatility > 30) priceVolatilityRating = "Very High";
  else if (volatility > 20) priceVolatilityRating = "High";
  else if (volatility > 10) priceVolatilityRating = "Medium";

  // Risk level based on multiple factors
  let riskScore = 0;
  if (volatility > 20) riskScore += 2;
  else if (volatility > 10) riskScore += 1;
  if (maxDrawdown > 20) riskScore += 2;
  else if (maxDrawdown > 10) riskScore += 1;
  if (trendStability < 50) riskScore += 1;
  if (consistencyScore < 50) riskScore += 1;

  let riskLevel: RiskMetrics["riskLevel"] = "Conservative";
  if (riskScore >= 5) riskLevel = "Speculative";
  else if (riskScore >= 3) riskLevel = "Aggressive";
  else if (riskScore >= 1) riskLevel = "Moderate";

  return {
    volatility: Math.round(volatility * 10) / 10,
    maxDrawdown: Math.round(maxDrawdown * 10) / 10,
    trendStability: Math.round(trendStability),
    priceVolatilityRating,
    riskLevel,
    consistencyScore: Math.round(consistencyScore),
  };
}

// ============================================================================
// FORECASTING
// ============================================================================

export interface ForecastResult {
  year: number;
  predictedPrice: number;
  predictedTransactions: number;
  confidence: "high" | "medium" | "low";
  upperBound: number;
  lowerBound: number;
}

export interface ForecastSummary {
  forecasts: ForecastResult[];
  modelQuality: {
    r2: number;
    qualityRating: "Excellent" | "Good" | "Fair" | "Poor";
    dataPoints: number;
    isReliable: boolean;
    warnings: string[];
  };
  expectedCAGR: number;
}

export function forecastValues(
  yearlyData: YearlyData[],
  yearsAhead: number = 3
): ForecastSummary {
  const warnings: string[] = [];

  // Check data quality
  if (yearlyData.length < 4) {
    warnings.push("Insufficient historical data (< 4 years). Forecasts are unreliable.");
  }

  // Prepare data for regression
  const priceData = yearlyData.map((d, i) => ({ x: i, y: d.medianPricePerSqm }));
  const volumeData = yearlyData.map((d, i) => ({ x: i, y: d.transactions }));

  const priceRegression = linearRegression(priceData);
  const volumeRegression = linearRegression(volumeData);

  // Determine quality rating
  let qualityRating: ForecastSummary["modelQuality"]["qualityRating"] = "Poor";
  if (priceRegression.r2 >= 0.85) qualityRating = "Excellent";
  else if (priceRegression.r2 >= 0.7) qualityRating = "Good";
  else if (priceRegression.r2 >= 0.5) qualityRating = "Fair";

  if (priceRegression.r2 < 0.5) {
    warnings.push("Low R² indicates weak trend. Prices may not follow linear pattern.");
  }

  // Check for volatile growth
  const prices = yearlyData.map((d) => d.medianPricePerSqm);
  const volatility = coefficientOfVariation(prices);
  if (volatility > 20) {
    warnings.push("High price volatility detected. Actual results may vary significantly.");
  }

  const lastYear = yearlyData[yearlyData.length - 1].year;
  const forecasts: ForecastResult[] = [];

  // Calculate confidence interval multiplier based on standard error
  const confidenceMultiplier = 1.96; // 95% confidence interval

  for (let i = 1; i <= yearsAhead; i++) {
    const x = yearlyData.length - 1 + i;
    const predictedPrice = priceRegression.slope * x + priceRegression.intercept;
    const predictedTransactions = volumeRegression.slope * x + volumeRegression.intercept;

    // Calculate prediction interval (wider for further predictions)
    const predictionError = priceRegression.standardError * Math.sqrt(1 + 1 / yearlyData.length);
    const margin = predictionError * confidenceMultiplier * (1 + i * 0.2); // Increase uncertainty with distance

    // Determine confidence level
    let confidence: ForecastResult["confidence"] = "high";
    if (priceRegression.r2 < 0.5 || i > 2) confidence = "low";
    else if (priceRegression.r2 < 0.7 || i > 1) confidence = "medium";

    forecasts.push({
      year: lastYear + i,
      predictedPrice: Math.max(0, predictedPrice),
      predictedTransactions: Math.max(0, Math.round(predictedTransactions)),
      confidence,
      upperBound: Math.max(0, predictedPrice + margin),
      lowerBound: Math.max(0, predictedPrice - margin),
    });
  }

  // Calculate expected CAGR
  const firstPrice = yearlyData[0].medianPricePerSqm;
  const lastPredictedPrice = forecasts[forecasts.length - 1].predictedPrice;
  const totalYears = yearlyData.length + yearsAhead - 1;
  const expectedCAGR = calculateCAGR(firstPrice, lastPredictedPrice, totalYears);

  return {
    forecasts,
    modelQuality: {
      r2: priceRegression.r2,
      qualityRating,
      dataPoints: yearlyData.length,
      isReliable: priceRegression.r2 >= 0.5 && yearlyData.length >= 4,
      warnings,
    },
    expectedCAGR,
  };
}

// ============================================================================
// INVESTMENT SCORING (IMPROVED)
// ============================================================================

export interface InvestmentScore {
  region: string;
  overallScore: number;
  priceGrowthScore: number;
  volumeScore: number;
  valueScore: number;
  momentumScore: number;
  riskScore: number; // NEW: Risk-adjusted score
  recommendation: "Strong Buy" | "Buy" | "Hold" | "Caution" | "Avoid";
  confidence: "High" | "Medium" | "Low";
  reasons: string[];
  metrics: {
    yoyGrowth: number;
    cagr3y: number;
    volatility: number;
    transactionVolume: number;
    avgPricePerSqm: number;
  };
}

export function calculateInvestmentScores(
  regionData: RegionData[],
  transactions: Transaction[]
): InvestmentScore[] {
  // Build historical data per region
  const regionHistory = new Map<
    string,
    { years: Map<number, { prices: number[]; count: number }> }
  >();

  transactions.forEach((t) => {
    if (t.pricePerSqm > 0 && t.pricePerSqm < 100000) {
      if (!regionHistory.has(t.region)) {
        regionHistory.set(t.region, { years: new Map() });
      }
      const history = regionHistory.get(t.region)!;
      if (!history.years.has(t.year)) {
        history.years.set(t.year, { prices: [], count: 0 });
      }
      const yearData = history.years.get(t.year)!;
      yearData.prices.push(t.pricePerSqm);
      yearData.count++;
    }
  });

  // Calculate normalization factors
  const allYoyGrowths = regionData.map((r) => r.yoyGrowth).filter((g) => !isNaN(g));
  const allTransactions = regionData.map((r) => r.transactions);
  const allPrices = regionData.map((r) => r.avgPricePerSqm);

  const maxTransactions = Math.max(...allTransactions);
  const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
  const medianYoyGrowth = [...allYoyGrowths].sort((a, b) => a - b)[Math.floor(allYoyGrowths.length / 2)] || 0;

  return regionData.slice(0, 25).map((region) => {
    const reasons: string[] = [];
    const history = regionHistory.get(region.region);

    // Calculate 3-year CAGR if possible
    let cagr3y = 0;
    let volatility = 0;

    if (history && history.years.size >= 3) {
      const yearlyPrices = Array.from(history.years.entries())
        .sort(([a], [b]) => a - b)
        .map(([, data]) => data.prices.reduce((a, b) => a + b, 0) / data.prices.length);

      if (yearlyPrices.length >= 3) {
        const startPrice = yearlyPrices[yearlyPrices.length - 4] || yearlyPrices[0];
        const endPrice = yearlyPrices[yearlyPrices.length - 1];
        cagr3y = calculateCAGR(startPrice, endPrice, 3);
        volatility = coefficientOfVariation(yearlyPrices);
      }
    }

    // ===== PRICE GROWTH SCORE (0-20) =====
    // Based on both YoY and CAGR, weighted
    let priceGrowthScore = 0;
    const effectiveGrowth = cagr3y > 0 ? (region.yoyGrowth * 0.6 + cagr3y * 0.4) : region.yoyGrowth;

    if (effectiveGrowth > 15) {
      priceGrowthScore = 20;
      reasons.push(`Excellent growth: ${effectiveGrowth.toFixed(1)}% (YoY: ${region.yoyGrowth.toFixed(1)}%)`);
    } else if (effectiveGrowth > 10) {
      priceGrowthScore = 16;
      reasons.push(`Strong growth: ${effectiveGrowth.toFixed(1)}%`);
    } else if (effectiveGrowth > 5) {
      priceGrowthScore = 12;
      reasons.push(`Moderate growth: ${effectiveGrowth.toFixed(1)}%`);
    } else if (effectiveGrowth > 0) {
      priceGrowthScore = 8;
      reasons.push(`Modest growth: ${effectiveGrowth.toFixed(1)}%`);
    } else {
      priceGrowthScore = 4;
      reasons.push(`Price decline: ${effectiveGrowth.toFixed(1)}%`);
    }

    // ===== VOLUME/LIQUIDITY SCORE (0-20) =====
    // High volume = easier to sell
    const volumeRatio = region.transactions / maxTransactions;
    let volumeScore = 0;

    if (volumeRatio > 0.3) {
      volumeScore = 20;
      reasons.push("Excellent liquidity - high transaction volume");
    } else if (volumeRatio > 0.15) {
      volumeScore = 15;
      reasons.push("Good liquidity");
    } else if (volumeRatio > 0.05) {
      volumeScore = 10;
      reasons.push("Moderate liquidity");
    } else {
      volumeScore = 5;
      reasons.push("Lower liquidity - may impact resale");
    }

    // ===== VALUE SCORE (0-20) =====
    // Premium doesn't mean bad - context matters
    const priceRatio = region.avgPricePerSqm / avgPrice;
    let valueScore = 0;

    if (priceRatio < 0.7) {
      valueScore = 18;
      reasons.push("Entry-level pricing - accessible investment");
    } else if (priceRatio < 1.0) {
      valueScore = 16;
      reasons.push("Below-average pricing");
    } else if (priceRatio < 1.3) {
      valueScore = 14;
      reasons.push("Mid-market pricing");
    } else if (priceRatio < 1.8) {
      valueScore = 12;
      reasons.push("Premium segment");
    } else {
      valueScore = 10;
      reasons.push("Luxury segment - higher entry barrier");
    }

    // ===== MOMENTUM SCORE (0-20) =====
    // Is growth accelerating or decelerating?
    let momentumScore = 10; // Default neutral
    const yoyAboveMarket = region.yoyGrowth - medianYoyGrowth;

    if (yoyAboveMarket > 10) {
      momentumScore = 20;
      reasons.push("Strong outperformance vs market");
    } else if (yoyAboveMarket > 5) {
      momentumScore = 16;
      reasons.push("Outperforming market");
    } else if (yoyAboveMarket > -5) {
      momentumScore = 12;
      reasons.push("In-line with market");
    } else {
      momentumScore = 6;
      reasons.push("Underperforming market");
    }

    // ===== RISK SCORE (0-20) =====
    // Lower volatility = higher score
    let riskScore = 10;

    if (volatility < 10) {
      riskScore = 20;
      reasons.push("Low volatility - stable prices");
    } else if (volatility < 20) {
      riskScore = 15;
      reasons.push("Moderate volatility");
    } else if (volatility < 30) {
      riskScore = 10;
      reasons.push("Higher volatility");
    } else {
      riskScore = 5;
      reasons.push("High volatility - higher risk");
    }

    // ===== OVERALL SCORE =====
    const overallScore = priceGrowthScore + volumeScore + valueScore + momentumScore + riskScore;

    // Determine recommendation with clearer thresholds
    let recommendation: InvestmentScore["recommendation"];
    if (overallScore >= 75) {
      recommendation = "Strong Buy";
    } else if (overallScore >= 60) {
      recommendation = "Buy";
    } else if (overallScore >= 45) {
      recommendation = "Hold";
    } else if (overallScore >= 30) {
      recommendation = "Caution";
    } else {
      recommendation = "Avoid";
    }

    // Confidence based on data quality
    let confidence: InvestmentScore["confidence"] = "Low";
    if (history && history.years.size >= 4 && region.transactions > 100) {
      confidence = "High";
    } else if (history && history.years.size >= 2 && region.transactions > 50) {
      confidence = "Medium";
    }

    return {
      region: region.regionEn || region.region,
      overallScore,
      priceGrowthScore,
      volumeScore,
      valueScore,
      momentumScore,
      riskScore,
      recommendation,
      confidence,
      reasons,
      metrics: {
        yoyGrowth: region.yoyGrowth,
        cagr3y,
        volatility,
        transactionVolume: region.transactions,
        avgPricePerSqm: region.avgPricePerSqm,
      },
    };
  });
}

// ============================================================================
// MARKET TIMING INDICATOR (FIXED)
// ============================================================================

export interface MarketTiming {
  indicator: "Strong Buy" | "Buy" | "Hold" | "Wait" | "Strong Wait";
  score: number; // 0-100
  confidence: number;
  reasons: string[];
  signals: {
    type: "bullish" | "bearish" | "neutral";
    factor: string;
    impact: number;
    description: string;
  }[];
  metrics: {
    priceVsAverage: number;
    volumeTrend: string;
    yoyPriceChange: number;
    marketMomentum: string;
    volatility: number;
    trendStrength: number;
  };
}

export function calculateMarketTiming(yearlyData: YearlyData[]): MarketTiming {
  if (yearlyData.length < 3) {
    return {
      indicator: "Hold",
      score: 50,
      confidence: 20,
      reasons: ["Insufficient data for timing analysis"],
      signals: [],
      metrics: {
        priceVsAverage: 0,
        volumeTrend: "Unknown",
        yoyPriceChange: 0,
        marketMomentum: "Unknown",
        volatility: 0,
        trendStrength: 0,
      },
    };
  }

  const signals: MarketTiming["signals"] = [];
  const reasons: string[] = [];

  const latestYear = yearlyData[yearlyData.length - 1];
  const previousYear = yearlyData[yearlyData.length - 2];
  const twoYearsAgo = yearlyData[yearlyData.length - 3];

  const historicalAvg =
    yearlyData.reduce((sum, d) => sum + d.medianPricePerSqm, 0) / yearlyData.length;

  // Calculate metrics
  const priceVsAverage = ((latestYear.medianPricePerSqm - historicalAvg) / historicalAvg) * 100;
  const yoyPriceChange =
    ((latestYear.medianPricePerSqm - previousYear.medianPricePerSqm) / previousYear.medianPricePerSqm) * 100;
  const volumeChange =
    ((latestYear.transactions - previousYear.transactions) / previousYear.transactions) * 100;

  // Calculate volatility
  const prices = yearlyData.map((d) => d.medianPricePerSqm);
  const volatility = coefficientOfVariation(prices);

  // Trend strength (R²)
  const priceData = yearlyData.map((d, i) => ({ x: i, y: d.medianPricePerSqm }));
  const regression = linearRegression(priceData);
  const trendStrength = regression.r2 * 100;

  // ===== SIGNAL 1: PRICE VS HISTORICAL AVERAGE =====
  if (priceVsAverage < -15) {
    signals.push({
      type: "bullish",
      factor: "Price vs Average",
      impact: 20,
      description: `Prices ${Math.abs(priceVsAverage).toFixed(1)}% below historical average`,
    });
  } else if (priceVsAverage < 0) {
    signals.push({
      type: "bullish",
      factor: "Price vs Average",
      impact: 10,
      description: `Prices ${Math.abs(priceVsAverage).toFixed(1)}% below average`,
    });
  } else if (priceVsAverage > 30) {
    signals.push({
      type: "bearish",
      factor: "Price vs Average",
      impact: -20,
      description: `Prices ${priceVsAverage.toFixed(1)}% above historical average - potential overheating`,
    });
  } else if (priceVsAverage > 15) {
    signals.push({
      type: "bearish",
      factor: "Price vs Average",
      impact: -10,
      description: `Prices ${priceVsAverage.toFixed(1)}% above average`,
    });
  } else {
    signals.push({
      type: "neutral",
      factor: "Price vs Average",
      impact: 0,
      description: "Prices near historical average",
    });
  }

  // ===== SIGNAL 2: YOY PRICE MOMENTUM =====
  if (yoyPriceChange > 20) {
    // Rapid growth can indicate overheating OR strong momentum
    if (regression.slope > 0 && trendStrength > 70) {
      signals.push({
        type: "bullish",
        factor: "Price Momentum",
        impact: 15,
        description: `Strong sustained growth ${yoyPriceChange.toFixed(1)}% with solid trend`,
      });
    } else {
      signals.push({
        type: "neutral",
        factor: "Price Momentum",
        impact: 5,
        description: `Rapid ${yoyPriceChange.toFixed(1)}% growth - monitor for sustainability`,
      });
    }
  } else if (yoyPriceChange > 10) {
    signals.push({
      type: "bullish",
      factor: "Price Momentum",
      impact: 15,
      description: `Healthy ${yoyPriceChange.toFixed(1)}% YoY growth`,
    });
  } else if (yoyPriceChange > 5) {
    signals.push({
      type: "bullish",
      factor: "Price Momentum",
      impact: 10,
      description: `Moderate ${yoyPriceChange.toFixed(1)}% growth`,
    });
  } else if (yoyPriceChange > 0) {
    signals.push({
      type: "neutral",
      factor: "Price Momentum",
      impact: 5,
      description: `Modest ${yoyPriceChange.toFixed(1)}% growth`,
    });
  } else if (yoyPriceChange > -10) {
    signals.push({
      type: "bullish",
      factor: "Price Momentum",
      impact: 10,
      description: `Minor correction ${yoyPriceChange.toFixed(1)}% - potential buying opportunity`,
    });
  } else {
    signals.push({
      type: "bearish",
      factor: "Price Momentum",
      impact: -15,
      description: `Significant decline ${yoyPriceChange.toFixed(1)}% - wait for stabilization`,
    });
  }

  // ===== SIGNAL 3: VOLUME TREND =====
  let volumeTrend = "Stable";
  if (volumeChange > 30) {
    volumeTrend = "Surging";
    signals.push({
      type: "bullish",
      factor: "Volume",
      impact: 15,
      description: `Transaction volume surging +${volumeChange.toFixed(0)}%`,
    });
  } else if (volumeChange > 10) {
    volumeTrend = "Growing";
    signals.push({
      type: "bullish",
      factor: "Volume",
      impact: 10,
      description: `Growing market activity +${volumeChange.toFixed(0)}%`,
    });
  } else if (volumeChange > -10) {
    signals.push({
      type: "neutral",
      factor: "Volume",
      impact: 0,
      description: "Stable transaction volume",
    });
  } else if (volumeChange > -25) {
    volumeTrend = "Declining";
    signals.push({
      type: "bearish",
      factor: "Volume",
      impact: -10,
      description: `Declining volume ${volumeChange.toFixed(0)}%`,
    });
  } else {
    volumeTrend = "Contracting";
    signals.push({
      type: "bearish",
      factor: "Volume",
      impact: -15,
      description: `Sharp volume contraction ${volumeChange.toFixed(0)}%`,
    });
  }

  // ===== SIGNAL 4: TREND ACCELERATION =====
  const prevYoyChange =
    ((previousYear.medianPricePerSqm - twoYearsAgo.medianPricePerSqm) / twoYearsAgo.medianPricePerSqm) * 100;
  const acceleration = yoyPriceChange - prevYoyChange;

  let marketMomentum = "Neutral";
  if (acceleration > 5 && yoyPriceChange > 0) {
    marketMomentum = "Accelerating";
    signals.push({
      type: "bullish",
      factor: "Trend Acceleration",
      impact: 10,
      description: "Growth accelerating year-over-year",
    });
  } else if (acceleration < -5 && yoyPriceChange > 0) {
    marketMomentum = "Decelerating";
    signals.push({
      type: "neutral",
      factor: "Trend Acceleration",
      impact: 0,
      description: "Growth decelerating but still positive",
    });
  } else if (yoyPriceChange > 5) {
    marketMomentum = "Bullish";
    signals.push({
      type: "bullish",
      factor: "Trend",
      impact: 5,
      description: "Consistent positive trend",
    });
  } else if (yoyPriceChange < -5) {
    marketMomentum = "Bearish";
    signals.push({
      type: "bearish",
      factor: "Trend",
      impact: -10,
      description: "Negative price trend",
    });
  }

  // ===== SIGNAL 5: VOLATILITY =====
  if (volatility < 10) {
    signals.push({
      type: "bullish",
      factor: "Stability",
      impact: 10,
      description: "Low volatility - stable market conditions",
    });
  } else if (volatility > 25) {
    signals.push({
      type: "bearish",
      factor: "Stability",
      impact: -10,
      description: "High volatility - increased risk",
    });
  }

  // ===== CALCULATE OVERALL SCORE =====
  // Base score of 50, adjusted by signals
  let score = 50;
  signals.forEach((signal) => {
    score += signal.impact;
  });

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine indicator
  let indicator: MarketTiming["indicator"];
  if (score >= 75) {
    indicator = "Strong Buy";
    reasons.push("Multiple bullish signals align - favorable entry conditions");
  } else if (score >= 60) {
    indicator = "Buy";
    reasons.push("Positive market conditions support investment");
  } else if (score >= 40) {
    indicator = "Hold";
    reasons.push("Mixed signals - maintain current positions");
  } else if (score >= 25) {
    indicator = "Wait";
    reasons.push("Caution advised - consider waiting for better entry");
  } else {
    indicator = "Strong Wait";
    reasons.push("Multiple bearish signals - delay investment decisions");
  }

  // Add specific reasons from signals
  const bullishSignals = signals.filter((s) => s.type === "bullish");
  const bearishSignals = signals.filter((s) => s.type === "bearish");

  if (bullishSignals.length > 0) {
    reasons.push(`${bullishSignals.length} bullish factor(s): ${bullishSignals.map((s) => s.factor).join(", ")}`);
  }
  if (bearishSignals.length > 0) {
    reasons.push(`${bearishSignals.length} bearish factor(s): ${bearishSignals.map((s) => s.factor).join(", ")}`);
  }

  // Confidence based on signal agreement and data quality
  const signalAgreement = Math.abs(bullishSignals.length - bearishSignals.length) / signals.length;
  const confidence = Math.round(50 + signalAgreement * 30 + (trendStrength / 100) * 20);

  return {
    indicator,
    score,
    confidence: Math.min(100, confidence),
    reasons,
    signals,
    metrics: {
      priceVsAverage: Math.round(priceVsAverage * 10) / 10,
      volumeTrend,
      yoyPriceChange: Math.round(yoyPriceChange * 10) / 10,
      marketMomentum,
      volatility: Math.round(volatility * 10) / 10,
      trendStrength: Math.round(trendStrength),
    },
  };
}
