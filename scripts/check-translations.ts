/**
 * Translation Coverage Checker
 * Run with: npx ts-node scripts/check-translations.ts
 * 
 * This script extracts all unique values from the data file
 * and checks translation coverage.
 */

import * as fs from 'fs';
import * as path from 'path';

// Import translations
const translationsPath = path.join(__dirname, '../src/lib/translations.ts');
const translationsContent = fs.readFileSync(translationsPath, 'utf-8');

// Extract translation maps from the file
function extractMap(content: string, mapName: string): Record<string, string> {
  const regex = new RegExp(`export const ${mapName}: Record<string, string> = \\{([^}]+(?:\\{[^}]*\\}[^}]*)*)\\};`, 's');
  const match = content.match(regex);
  
  if (!match) {
    console.log(`Could not find ${mapName}`);
    return {};
  }
  
  const mapContent = match[1];
  const result: Record<string, string> = {};
  
  // Parse key-value pairs
  const pairRegex = /"([^"]+)":\s*"([^"]*)"/g;
  let pairMatch;
  while ((pairMatch = pairRegex.exec(mapContent)) !== null) {
    result[pairMatch[1]] = pairMatch[2];
  }
  
  return result;
}

// Load translation maps
const REGIONS = extractMap(translationsContent, 'REGIONS');
const PROPERTY_TYPES = extractMap(translationsContent, 'PROPERTY_TYPES');
const PROJECTS = extractMap(translationsContent, 'PROJECTS');
const BEDROOMS = extractMap(translationsContent, 'BEDROOMS');
const SALE_TYPES = extractMap(translationsContent, 'SALE_TYPES');
const MARKET_TYPES = extractMap(translationsContent, 'MARKET_TYPES');
const ASSET_CATEGORIES = extractMap(translationsContent, 'ASSET_CATEGORIES');

// Test values (from data extraction)
const TEST_REGIONS = [
  "جزيرة الريم", "جزيرة ياس", "جزيرة السعديات", "مدينة زايد", "مدينة خليفة",
  "الشامخة", "الريف", "الباهية", "الفقع", "جزيرة رمحان", "غنتوت", "رماح", "ربدان",
  "المنتزه", "الجيمي", "الكاسر", "مدينة الرياض"
];

const TEST_PROPERTY_TYPES = [
  "شقة", "ڨيلا", "تاونهاوس / ڨيلا شبه منفصلة", "دوپلكس", "پنتهاوس",
  "مجمع سكني", "مجمع سكني (سكن عمال)", "مزرعة", "مكتب", "مجمع مكاتب",
  "محل بيع بالتجزئة", "مول / سوق / مركز بيع بالتجزئة", "أرض لڨيلا",
  "أرض لتاونهاوس / ڨيلا شبه منفصلة", "أرض لمجمع سكني (سكن عمال)",
  "أرض لمول / سوق / مركز بيع بالتجزئة", "أرض لفندق / منتجع / شقق فندقية"
];

const TEST_PROJECTS = [
  "بلووم ليڤينج - غرناطة ١", "بلووم ليڤينج - توليدو", "بلووم ليڤينج - كازارس",
  "بلووم ليڤينج - كوردوبا", "بلووم ليڤينج - إشبيلية", "بلووم ليڤينج - أولڤيرا",
  "بلووم ليڤينج - ألميريا", "خصوصي", "ياس بيتش رزيدنس", "ريم هلز - المرحلة ١ أي"
];

function checkCoverage(
  testValues: string[],
  translations: Record<string, string>,
  name: string
): void {
  console.log(`\n=== ${name} ===`);
  console.log(`Total in translations: ${Object.keys(translations).length}`);
  
  const missing: string[] = [];
  const found: string[] = [];
  
  for (const value of testValues) {
    if (translations[value]) {
      found.push(value);
    } else {
      missing.push(value);
    }
  }
  
  console.log(`Test values: ${testValues.length}`);
  console.log(`Found: ${found.length}`);
  console.log(`Missing: ${missing.length}`);
  
  if (missing.length > 0) {
    console.log(`\nMissing translations:`);
    for (const m of missing) {
      console.log(`  "${m}": "",`);
    }
  } else {
    console.log(`✅ All test values have translations!`);
  }
}

// Run checks
console.log('🔍 Translation Coverage Report');
console.log('================================');

checkCoverage(TEST_REGIONS, REGIONS, 'REGIONS');
checkCoverage(TEST_PROPERTY_TYPES, PROPERTY_TYPES, 'PROPERTY TYPES');
checkCoverage(TEST_PROJECTS, PROJECTS, 'PROJECTS');

// Summary
console.log('\n================================');
console.log('📊 Summary:');
console.log(`  Regions: ${Object.keys(REGIONS).length} translations`);
console.log(`  Property Types: ${Object.keys(PROPERTY_TYPES).length} translations`);
console.log(`  Projects: ${Object.keys(PROJECTS).length} translations`);
console.log(`  Bedrooms: ${Object.keys(BEDROOMS).length} translations`);
console.log(`  Sale Types: ${Object.keys(SALE_TYPES).length} translations`);
console.log(`  Market Types: ${Object.keys(MARKET_TYPES).length} translations`);
console.log(`  Asset Categories: ${Object.keys(ASSET_CATEGORIES).length} translations`);

