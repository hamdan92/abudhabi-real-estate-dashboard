// Real Estate Transaction Types

export interface Transaction {
  id: number;
  assetCategory: string;           // فئة الأصل
  propertyType: string;            // نوع العقار
  registrationDate: Date;          // تاريخ التسجيل
  soldArea: number;                // المساحة المباعة / الطابقية (متر مربّع)
  landArea: number;                // مساحة الأرض (متر مربّع)
  pricePerSqm: number;             // سعر المتر (درهم إماراتي)
  propertyDesign: string;          // تصميم العقار
  region: string;                  // المنطقة
  subArea: string;                 // الحوض
  project: string;                 // المشروع
  totalPrice: number;              // السعر (درهم إماراتي)
  percentageSold: number;          // النسبة المباعة
  saleType: string;                // نوع البيع (جاهزة/على المخطط)
  marketType: string;              // السوق (أولي/ثانوي)
  
  // Computed fields
  year: number;
  month: number;
  quarter: number;
}

export interface KPIData {
  totalTransactions: number;
  totalValue: number;
  avgPricePerSqm: number;
  avgPropertyPrice: number;
  mostActiveRegion: string;
  mostActiveRegionEn: string;
  yoyTransactionGrowth: number;
  yoyPriceGrowth: number;
}

export interface TimeSeriesData {
  date: string;
  year: number;
  month: number;
  transactions: number;
  totalValue: number;
  avgPricePerSqm: number;
  medianPricePerSqm: number;
}

export interface RegionData {
  region: string;
  regionEn: string;
  transactions: number;
  totalValue: number;
  avgPrice: number;
  avgPricePerSqm: number;
  medianPricePerSqm: number;
  yoyGrowth: number;
}

export interface PropertyTypeData {
  type: string;
  typeEn: string;
  count: number;
  avgPrice: number;
  avgPricePerSqm: number;
  avgArea: number;
  percentage: number;
}

export interface BedroomData {
  bedrooms: string;
  bedroomsEn: string;
  count: number;
  avgPrice: number;
  avgPricePerSqm: number;
  avgArea: number;
}

export interface YearlyData {
  year: number;
  transactions: number;
  totalValue: number;
  avgPrice: number;
  avgPricePerSqm: number;
  medianPricePerSqm: number;
}

export interface MarketSegmentData {
  segment: string;
  segmentEn: string;
  transactions: number;
  totalValue: number;
  avgPrice: number;
  percentage: number;
}

export interface FilterState {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  regions: string[];
  propertyTypes: string[];
  bedrooms: string[];
  saleTypes: string[];
  marketTypes: string[];
  priceRange: {
    min: number;
    max: number;
  };
}

// ============================================================================
// SEGMENTED ANALYSIS TYPES (NEW)
// ============================================================================

// Yearly trend data for a specific segment
export interface SegmentYearlyData {
  year: number;
  transactions: number;
  totalValue: number;
  avgPricePerSqm: number;
  medianPricePerSqm: number;
  yoyGrowth: number;
  marketShare: number; // % of total market
}

// Full analysis for a property type segment
export interface PropertyTypeAnalysis {
  type: string;
  typeEn: string;
  totalTransactions: number;
  totalValue: number;
  avgPricePerSqm: number;
  medianPricePerSqm: number;
  avgArea: number;
  marketShare: number;
  yearlyData: SegmentYearlyData[];
  cagr: number; // Compound annual growth rate
  yoyGrowth: number;
  topRegions: { region: string; count: number; avgPricePerSqm: number }[];
}

// Full analysis for Ready vs Off-Plan
export interface SaleTypeAnalysis {
  saleType: string;
  saleTypeEn: string;
  totalTransactions: number;
  totalValue: number;
  avgPricePerSqm: number;
  medianPricePerSqm: number;
  marketShare: number;
  yearlyData: SegmentYearlyData[];
  cagr: number;
  yoyGrowth: number;
  priceComparisonByRegion: {
    region: string;
    avgPricePerSqm: number;
    transactions: number;
  }[];
}

// Comparison data for same segment across different dimensions
export interface SegmentComparison {
  dimension: string; // e.g., "Region", "Property Type"
  segment1: {
    name: string;
    avgPricePerSqm: number;
    transactions: number;
    yoyGrowth: number;
    cagr: number;
  };
  segment2: {
    name: string;
    avgPricePerSqm: number;
    transactions: number;
    yoyGrowth: number;
    cagr: number;
  };
  priceDifferential: number; // % difference
  growthDifferential: number;
}

// Ready vs Off-Plan comparison within same unit type + region
export interface ReadyVsOffPlanComparison {
  region: string;
  regionEn: string;
  propertyType: string;
  propertyTypeEn: string;
  ready: {
    count: number;
    avgPricePerSqm: number;
    medianPricePerSqm: number;
    yoyGrowth: number;
  } | null;
  offPlan: {
    count: number;
    avgPricePerSqm: number;
    medianPricePerSqm: number;
    yoyGrowth: number;
  } | null;
  pricePremium: number; // Ready premium over off-plan (%)
  volumeRatio: number; // Ready volume / Off-plan volume
}

// Region comparison with filters applied
export interface RegionComparisonData {
  region: string;
  regionEn: string;
  transactions: number;
  avgPricePerSqm: number;
  medianPricePerSqm: number;
  totalValue: number;
  yoyGrowth: number;
  cagr3y: number;
  volatility: number;
  propertyType?: string;
  saleType?: string;
  bedrooms?: string;
}

// ============================================================================
// ENHANCED DASHBOARD DATA
// ============================================================================

export interface DashboardData {
  transactions: Transaction[];
  kpis: KPIData;
  yearlyData: YearlyData[];
  monthlyData: TimeSeriesData[];
  regionData: RegionData[];
  propertyTypeData: PropertyTypeData[];
  bedroomData: BedroomData[];
  marketSegments: {
    saleType: MarketSegmentData[];
    marketType: MarketSegmentData[];
  };
}

export interface SegmentedDashboardData extends DashboardData {
  // Property type segmented analysis
  propertyTypeAnalysis: PropertyTypeAnalysis[];
  // Sale type (Ready/Off-Plan) segmented analysis
  saleTypeAnalysis: SaleTypeAnalysis[];
  // Ready vs Off-Plan comparisons by region and type
  readyVsOffPlan: ReadyVsOffPlanComparison[];
}

// ============================================================================
// ARABIC TO ENGLISH MAPPINGS
// ============================================================================

export const COLUMN_MAPPINGS = {
  'فئة الأصل': 'assetCategory',
  'نوع العقار': 'propertyType',
  'تاريخ التسجيل': 'registrationDate',
  'المساحة المباعة \\ الطابقية (متر مربّع)': 'soldArea',
  'مساحة الأرض (متر مربّع)': 'landArea',
  'سعر المتر (درهم إماراتي)': 'pricePerSqm',
  'تصميم العقار': 'propertyDesign',
  'المنطقة': 'region',
  'الحوض': 'subArea',
  'المشروع': 'project',
  'السعر (درهم إماراتي)': 'totalPrice',
  'النسبة المباعة': 'percentageSold',
  'نوع البيع': 'saleType',
  'السوق': 'marketType',
} as const;

// Asset Category translations
export const ASSET_CATEGORIES = {
  'سكني': 'Residential',
  'تجاري': 'Commercial',
  'زراعي': 'Agricultural',
  'أخرى': 'Other',
  'صناعي وتخزيني': 'Industrial',
  'تعليمي': 'Educational',
  'رعاية صحية': 'Healthcare',
  'بنية تحتية': 'Infrastructure',
  'ديني': 'Religious',
  'ترفيهي': 'Recreational',
} as const;

// NOTE: All translation constants have been moved to @/lib/translations.ts
// Import from there: import { translate, TRANSLATIONS } from '@/lib/translations';
