/**
 * CENTRALIZED TRANSLATION SYSTEM
 * ==============================
 * 
 * This file contains ALL Arabic-to-English translations used in the dashboard.
 * Import from this file instead of defining local translations.
 * 
 * Usage:
 *   import { translate, TRANSLATIONS } from '@/lib/translations';
 *   
 *   // Get translation
 *   const english = translate(arabicValue, 'region'); // returns English or original
 *   
 *   // Or access directly
 *   const english = TRANSLATIONS.regions['جزيرة الريم']; // 'Reem Island'
 */

// =============================================================================
// REGION TRANSLATIONS (Complete list from data)
// =============================================================================
export const REGIONS: Record<string, string> = {
  // Major Islands
  "جزيرة الريم": "Reem Island",
  "جزيرة ياس": "Yas Island",
  "جزيرة السعديات": "Saadiyat Island",
  "جزيرة الجبيل": "Jubail Island",
  "جزيرة فاهد": "Fahid Island",
  "جزيرة الحديريات": "Hudayriyat Island",
  "الحديريات": "Al Hudayriyat",
  "جزيرة المارية": "Al Maryah Island",
  "جزيرة نوراي": "Nurai Island",
  
  // Major Areas
  "الريف": "Al Reef",
  "الشامخة": "Al Shamkha",
  "مدينة خليفة": "Khalifa City",
  "مدينة زايد": "Zayed City",
  "مدينة محمد بن زايد": "Mohammed Bin Zayed City",
  "الراحة": "Al Raha",
  "الباهية": "Al Bahia",
  "الليان": "Al Layan",
  "الفقع": "Al Faqaa",
  "السمحة": "Al Samha",
  "الروضة": "Al Rawdah",
  "الخالدية": "Al Khalidiya",
  "الحصن": "Al Hosn",
  "الحنيورة": "Al Hanyoora",
  "الخبيصي": "Al Khubaisi",
  "الختم": "Al Khatm",
  "الخزنة": "Al Khazna",
  "الدانة": "Al Dana",
  "الرحبة": "Al Rahba",
  "المرور": "Al Muroor",
  "المشرف": "Al Mushrif",
  "المقطع": "Al Maqtaa",
  "المنهل": "Al Manhal",
  "المنيرة": "Al Muneera",
  "النادي السياحي": "Tourist Club",
  "الهيلي": "Al Hili",
  "الوثبة": "Al Wathba",
  "بني ياس": "Bani Yas",
  "عين الفايضة": "Ain Al Faydah",
  "غدير الطير": "Ghadeer Al Tair",
  "ياس": "Yas",
  "شاطئ الراحة": "Al Raha Beach",
  "البطين": "Al Bateen",
  "الكرامة": "Al Karama",
  "الوحدة": "Al Wahda",
  "الظفرة": "Al Dhafra",
  "العين": "Al Ain",
  "المفرق": "Al Mafraq",
  "مصدر": "Masdar",
  "مصفح": "Mussafah",
  "السلع": "Al Silaa",
  "المرفأ": "Al Mirfa",
  "الغربية": "Al Gharbia",
  "المدينة الصناعية": "Industrial City",
  "زايد الرياضية": "Zayed Sports City",
  "كورنيش أبوظبي": "Abu Dhabi Corniche",
  "مارينا": "Marina",
  "بوابة البحر": "Sea Gate",
  "واحة الزاوية": "Al Zawia Oasis",
};

// =============================================================================
// PROPERTY TYPE TRANSLATIONS
// =============================================================================
export const PROPERTY_TYPES: Record<string, string> = {
  // Residential
  "شقة": "Apartment",
  "ڨيلا": "Villa",
  "تاونهاوس / ڨيلا شبه منفصلة": "Townhouse",
  "دوپلكس": "Duplex",
  "مجمع سكني": "Residential Complex",
  "مزرعة": "Farm",
  "بنتهاوس": "Penthouse",
  "استوديو": "Studio",
  
  // Land
  "أرض لڨيلا": "Villa Land",
  "أرض لمزرعة": "Farm Land",
  "أرض لتاونهاوس / فيلا شبه منفصلة": "Townhouse Land",
  "أرض سكنية أخرى": "Other Residential Land",
  "أرض تجارية أخرى": "Other Commercial Land",
  "أرض صناعية أخرى": "Other Industrial Land",
  "أرض عامة أخرى": "Other Public Land",
  "أرض أخرى": "Other Land",
  "أرض أخرى متعددة الاستخدام": "Mixed Use Land",
  "أرض لمجمع سكني": "Residential Complex Land",
  "أرض لحديقة": "Garden Land",
  "أرض لعيادة / مستشفى": "Clinic/Hospital Land",
  
  // Commercial
  "مكتب": "Office",
  "محل شع بالتجزئة": "Retail Shop",
  "معرض": "Showroom",
  "مستودع": "Warehouse",
  "فندق": "Hotel",
  "شقة فندقية": "Hotel Apartment",
  
  // Other
  "آخر": "Other",
  "أخرى": "Other",
};

// Property Type Short Codes (for badges, charts)
export const PROPERTY_TYPES_SHORT: Record<string, string> = {
  "شقة": "APT",
  "ڨيلا": "VIL",
  "تاونهاوس / ڨيلا شبه منفصلة": "TH",
  "أرض لڨيلا": "VL",
  "مزرعة": "FRM",
  "مجمع سكني": "RC",
  "أرض لمزرعة": "FL",
  "دوپلكس": "DPX",
  "مكتب": "OFC",
  "آخر": "OTH",
};

// =============================================================================
// BEDROOM TRANSLATIONS
// =============================================================================
export const BEDROOMS: Record<string, string> = {
  "ستوديو": "Studio",
  "استوديو": "Studio",
  "غرفة نوم واحدة": "1 Bedroom",
  "1 غرفة نوم": "1 Bedroom",
  "غرفتين نوم": "2 Bedrooms",
  "2 غرف نوم": "2 Bedrooms",
  "٣ غرف نوم": "3 Bedrooms",
  "3 غرف نوم": "3 Bedrooms",
  "٤ غرف نوم": "4 Bedrooms",
  "4 غرف نوم": "4 Bedrooms",
  "٥ غرف نوم": "5 Bedrooms",
  "5 غرف نوم": "5 Bedrooms",
  "٦ غرف نوم وما فوق": "6+ Bedrooms",
  "6 غرف نوم وما فوق": "6+ Bedrooms",
  "غير مصنف": "Unclassified",
  "N/A": "N/A",
};

// Bedroom Short Codes
export const BEDROOMS_SHORT: Record<string, string> = {
  "ستوديو": "Studio",
  "استوديو": "Studio",
  "غرفة نوم واحدة": "1 BR",
  "1 غرفة نوم": "1 BR",
  "غرفتين نوم": "2 BR",
  "2 غرف نوم": "2 BR",
  "٣ غرف نوم": "3 BR",
  "3 غرف نوم": "3 BR",
  "٤ غرف نوم": "4 BR",
  "4 غرف نوم": "4 BR",
  "٥ غرف نوم": "5 BR",
  "5 غرف نوم": "5 BR",
  "٦ غرف نوم وما فوق": "6+ BR",
  "6 غرف نوم وما فوق": "6+ BR",
  "غير مصنف": "N/A",
};

// =============================================================================
// SALE TYPE TRANSLATIONS
// =============================================================================
export const SALE_TYPES: Record<string, string> = {
  "جاهزة": "Ready",
  "على المخطط": "Off-Plan",
  "أمر محكمة": "Court Order",
};

// =============================================================================
// MARKET TYPE TRANSLATIONS
// =============================================================================
export const MARKET_TYPES: Record<string, string> = {
  "أولي": "Primary",
  "ثانوي": "Secondary",
};

// =============================================================================
// ASSET CATEGORY TRANSLATIONS
// =============================================================================
export const ASSET_CATEGORIES: Record<string, string> = {
  "سكني": "Residential",
  "تجاري": "Commercial",
  "صناعي": "Industrial",
  "زراعي": "Agricultural",
  "متعدد الاستخدام": "Mixed Use",
};

// =============================================================================
// PROJECT NAME TRANSLATIONS (Developer prefixes and common terms)
// =============================================================================
export const PROJECT_PREFIXES: Record<string, string> = {
  // Major Developers
  "بلوم ليفينج": "Bloom Living",
  "بلوم": "Bloom",
  "الدار": "Aldar",
  "إعمار": "Emaar",
  "داماك": "Damac",
  "منازل": "Manazil",
  "هيدرا": "Hydra",
  "ريبورتاج": "Reportage",
  "إيجل هيلز": "Eagle Hills",
  "ميراس": "Meraas",
  "الغرير": "Al Ghurair",
  "رأس الخيمة": "RAK",
  "طلعت مصطفى": "Talaat Moustafa",
  "إمكان": "Imkan",
  "Q للعقارات": "Q Properties",
  "أرادَ": "Arada",
  "الفطيم": "Al Futtaim",
  "مبادلة": "Mubadala",
  "الوطنية": "Al Wataniya",
  
  // Common Project Terms
  "أبراج": "Towers",
  "برج": "Tower",
  "حدائق": "Gardens",
  "حديقة": "Garden",
  "شاطئ": "Beach",
  "مارينا": "Marina",
  "ريزيدنس": "Residence",
  "ريزيدنسز": "Residences",
  "سنترال": "Central",
  "بارك": "Park",
  "سكوير": "Square",
  "تراس": "Terrace",
  "بوابة": "Gate",
  "واحة": "Oasis",
  "جيت": "Gate",
  "هيلز": "Hills",
  "فيو": "View",
  "فيوز": "Views",
  "بلازا": "Plaza",
  "كورت": "Court",
  "بالاس": "Palace",
  "ليفينج": "Living",
  "هاوس": "House",
  "هومز": "Homes",
  "إستيت": "Estate",
  "إستيتس": "Estates",
  "كريك": "Creek",
  "آيلاند": "Island",
  "لاجون": "Lagoon",
  "بيتش": "Beach",
  "سي": "Sea",
  "باي": "Bay",
  "هاربور": "Harbour",
  "بورت": "Port",
  "كورنيش": "Corniche",
  "سيتي": "City",
  "تاون": "Town",
  "فيلج": "Village",
  "كومبلكس": "Complex",
  "سنتر": "Center",
  "مول": "Mall",
  "جاليريا": "Galleria",
  "أفنيو": "Avenue",
  "ستريت": "Street",
  "رود": "Road",
  "واي": "Way",
  "لاين": "Lane",
  "درايف": "Drive",
  "بوليفارد": "Boulevard",
  
  // Location Descriptors
  "الغربية": "West",
  "الشرقية": "East",
  "الشمالية": "North",
  "الجنوبية": "South",
  "السفلى": "Lower",
  "العليا": "Upper",
  
  // Project Types
  "فيلا": "Villa",
  "فلل": "Villas",
  "شقق": "Apartments",
  "تاون هاوس": "Townhouse",
  "تاونهاوس": "Townhouse",
  "دوبلكس": "Duplex",
  "بنتهاوس": "Penthouse",
  "ستوديو": "Studio",
  "لوفت": "Loft",
  
  // Spanish Names (Bloom Living projects)
  "غرناطة": "Granada",
  "توليدو": "Toledo",
  "كازارس": "Casares",
  "كورديا": "Cordoba",
  "اشبيلية": "Seville",
  "كارمونا": "Carmona",
  "أوقيرا": "Osuna",
  "المريا": "Almeria",
  "ماربيا": "Marbella",
  "فالنسيا": "Valencia",
  
  // Numbers in Arabic
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "٠": "0",
  
  // Common Terms
  "خصوصي": "Private",
  "عام": "Public",
  "جديد": "New",
  "قديم": "Old",
  "كبير": "Large",
  "صغير": "Small",
  "فاخر": "Luxury",
  "بريميوم": "Premium",
  "إكسكلوسيف": "Exclusive",
  "سيجنتشر": "Signature",
  "رويال": "Royal",
  "جراند": "Grand",
  "ذا": "The",
};

// =============================================================================
// COMBINED TRANSLATIONS OBJECT
// =============================================================================
export const TRANSLATIONS = {
  regions: REGIONS,
  propertyTypes: PROPERTY_TYPES,
  propertyTypesShort: PROPERTY_TYPES_SHORT,
  bedrooms: BEDROOMS,
  bedroomsShort: BEDROOMS_SHORT,
  saleTypes: SALE_TYPES,
  marketTypes: MARKET_TYPES,
  assetCategories: ASSET_CATEGORIES,
  projectPrefixes: PROJECT_PREFIXES,
} as const;

// =============================================================================
// TRANSLATION HELPER FUNCTIONS
// =============================================================================

export type TranslationType = 
  | 'region' 
  | 'propertyType' 
  | 'bedroom' 
  | 'saleType' 
  | 'marketType' 
  | 'assetCategory';

/**
 * Translate an Arabic value to English
 * @param value - The Arabic value to translate
 * @param type - The type of translation (region, propertyType, etc.)
 * @returns English translation or original value if not found
 */
export function translate(value: string | undefined | null, type: TranslationType): string {
  if (!value) return '';
  
  switch (type) {
    case 'region':
      return REGIONS[value] || value;
    case 'propertyType':
      return PROPERTY_TYPES[value] || value;
    case 'bedroom':
      return BEDROOMS[value] || value;
    case 'saleType':
      return SALE_TYPES[value] || value;
    case 'marketType':
      return MARKET_TYPES[value] || value;
    case 'assetCategory':
      return ASSET_CATEGORIES[value] || value;
    default:
      return value;
  }
}

/**
 * Translate with short code (for badges, compact UI)
 */
export function translateShort(value: string | undefined | null, type: 'propertyType' | 'bedroom'): string {
  if (!value) return '';
  
  switch (type) {
    case 'propertyType':
      return PROPERTY_TYPES_SHORT[value] || PROPERTY_TYPES[value] || value;
    case 'bedroom':
      return BEDROOMS_SHORT[value] || BEDROOMS[value] || value;
    default:
      return value;
  }
}

/**
 * Translate project names by replacing Arabic prefixes with English
 * Handles partial translations (developer name + location)
 * @param projectName - The Arabic project name
 * @returns Translated project name (fully or partially)
 */
export function translateProject(projectName: string | undefined | null): string {
  if (!projectName) return '';
  
  let result = projectName;
  
  // Sort prefixes by length (longest first) to avoid partial matches
  const sortedPrefixes = Object.entries(PROJECT_PREFIXES)
    .sort((a, b) => b[0].length - a[0].length);
  
  // Replace all matching prefixes
  for (const [ar, en] of sortedPrefixes) {
    if (result.includes(ar)) {
      result = result.replace(new RegExp(ar, 'g'), en);
    }
  }
  
  // Clean up any double spaces and trim
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

/**
 * Get display label (English or Arabic based on preference)
 * For now returns English, but can be extended for language switching
 */
export function getLabel(value: string | undefined | null, type: TranslationType): string {
  return translate(value, type);
}

/**
 * Check if a value has a translation
 */
export function hasTranslation(value: string, type: TranslationType): boolean {
  switch (type) {
    case 'region':
      return value in REGIONS;
    case 'propertyType':
      return value in PROPERTY_TYPES;
    case 'bedroom':
      return value in BEDROOMS;
    case 'saleType':
      return value in SALE_TYPES;
    case 'marketType':
      return value in MARKET_TYPES;
    case 'assetCategory':
      return value in ASSET_CATEGORIES;
    default:
      return false;
  }
}

/**
 * Get all translations for a type (useful for dropdowns)
 */
export function getTranslations(type: TranslationType): Record<string, string> {
  switch (type) {
    case 'region':
      return REGIONS;
    case 'propertyType':
      return PROPERTY_TYPES;
    case 'bedroom':
      return BEDROOMS;
    case 'saleType':
      return SALE_TYPES;
    case 'marketType':
      return MARKET_TYPES;
    case 'assetCategory':
      return ASSET_CATEGORIES;
    default:
      return {};
  }
}

// =============================================================================
// REVERSE TRANSLATIONS (English -> Arabic)
// =============================================================================

function createReverseMap(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(map).map(([ar, en]) => [en, ar])
  );
}

export const REGIONS_REVERSE = createReverseMap(REGIONS);
export const PROPERTY_TYPES_REVERSE = createReverseMap(PROPERTY_TYPES);
export const SALE_TYPES_REVERSE = createReverseMap(SALE_TYPES);

/**
 * Translate from English to Arabic
 */
export function translateToArabic(value: string, type: TranslationType): string {
  if (!value) return '';
  
  switch (type) {
    case 'region':
      return REGIONS_REVERSE[value] || value;
    case 'propertyType':
      return PROPERTY_TYPES_REVERSE[value] || value;
    case 'saleType':
      return SALE_TYPES_REVERSE[value] || value;
    default:
      return value;
  }
}

/**
 * Get a short/clean version of project name for display
 */
export function getProjectDisplayName(projectName: string | undefined | null): string {
  if (!projectName) return '';
  
  const translated = translateProject(projectName);
  
  // Clean up extra spaces and dashes
  return translated
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .trim();
}

