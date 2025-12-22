# Language Consistency Fix Plan

## Current State Analysis

### ✅ Already Translated (Using `translations.ts`)
- Region names in most charts (using `regionEn` or `translate()`)
- Property types in property-type-analysis.tsx
- Sale types in filters.tsx
- Market segments in market-segment-chart.tsx
- KPI most active region

### ❌ Still Showing Arabic (Needs Fix)

#### 1. **Projects** - NO TRANSLATION EXISTS
- Location: `trend-comparison-tool.tsx` project selector
- Issue: Projects are displayed in Arabic (e.g., "بلوم ليفينج - غرناطة")
- Challenge: Projects are dynamic from data, not a fixed list
- Solution: Extract developer prefix patterns and translate common ones

#### 2. **Dropdown Values in Segment Builder**
- Location: `trend-comparison-tool.tsx` lines 1095-1166
- Issue: Region, Property Type options showing in Arabic
- Fix: Apply `translate()` to dropdown option labels

#### 3. **Quick Comparison Preset Labels**
- Location: `trend-comparison-tool.tsx` lines 950-1075
- Issue: Button labels hardcoded, but data uses Arabic internally
- Status: Currently English ✅, but segment names when displayed might be Arabic

#### 4. **Property Design / Bedroom Display**
- Location: Multiple files
- Issue: `propertyDesign` field contains Arabic descriptions
- Fix: Parse and translate bedroom info from design field

#### 5. **Tooltip Formatters**
- Location: Various chart components
- Issue: Some tooltips show Arabic field names
- Fix: Apply translations in tooltip formatter functions

#### 6. **Export CSV Headers**
- Location: `trend-comparison-tool.tsx` export functions
- Status: Currently has both Arabic and English columns ✅

#### 7. **Off-Plan Premium Analysis**
- Location: `offplan-premium-analysis.tsx`
- Need to verify all labels use translations

#### 8. **Resale Analysis**
- Location: `resale-analysis.tsx`
- Need to verify all labels use translations

#### 9. **Custom Insights**
- Location: `custom-insights.tsx`
- Need to verify filter dropdowns use translations

---

## Implementation Plan

### Phase 1: Add Project Translations (HIGH PRIORITY)

**Problem**: Projects are dynamic and numerous (~500+ unique projects)

**Solution A**: Developer/Brand Prefix Extraction
```typescript
// Extract common developer names for translation
export const PROJECT_PREFIXES: Record<string, string> = {
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
  "الغورير": "Al Ghurair",
  "واحة الزاوية": "Al Zawiya Oasis",
  "بوابة": "Gate",
  "أبراج": "Towers",
  "شاطئ": "Beach",
  "حدائق": "Gardens",
  "مارينا": "Marina",
  "ريزيدنس": "Residence",
  "سنترال": "Central",
  "بارك": "Park",
  "سكوير": "Square",
  "تراس": "Terrace",
};

// Function to translate project names
export function translateProject(projectName: string): string {
  // Try to translate known prefixes
  for (const [ar, en] of Object.entries(PROJECT_PREFIXES)) {
    if (projectName.includes(ar)) {
      return projectName.replace(ar, en);
    }
  }
  return projectName; // Return original if no match
}
```

**Files to Update**:
- [ ] `src/lib/translations.ts` - Add PROJECT_PREFIXES and translateProject()
- [ ] `trend-comparison-tool.tsx` - Use translateProject() in project list

---

### Phase 2: Fix Dropdown Option Labels (HIGH PRIORITY)

**Files to Update**:

#### `trend-comparison-tool.tsx`
- [ ] Region dropdown options: Add `translate(region, 'region')` to display
- [ ] Property Type dropdown options: Add `translate(type, 'propertyType')`
- [ ] Project list items: Use `translateProject()` for display

**Code Change Example**:
```tsx
// Before
<option value={region}>{region}</option>

// After  
<option value={region}>{translate(region, 'region')}</option>
```

---

### Phase 3: Fix Filter Component (MEDIUM PRIORITY)

**File**: `src/components/dashboard/filters.tsx`

- [ ] Verify all property type checkboxes use `translate()`
- [ ] Verify all region checkboxes use `translate()`
- [ ] Verify all sale type checkboxes use `translate()`

---

### Phase 4: Fix Chart Components (MEDIUM PRIORITY)

#### Check and fix each chart:

- [ ] `price-trend-chart.tsx` - Tooltip labels
- [ ] `transaction-volume-chart.tsx` - Tooltip labels
- [ ] `region-chart.tsx` - Axis labels, tooltips
- [ ] `property-type-chart.tsx` - Labels, tooltips
- [ ] `market-segment-chart.tsx` - Labels
- [ ] `bedroom-analysis-chart.tsx` - Labels
- [ ] `seasonality-heatmap.tsx` - Tooltips
- [ ] `yoy-comparison-chart.tsx` - Labels
- [ ] `region-benchmark-chart.tsx` - Labels

---

### Phase 5: Fix Analysis Components (MEDIUM PRIORITY)

- [ ] `offplan-premium-analysis.tsx` - All filter dropdowns, labels
- [ ] `resale-analysis.tsx` - All labels, segment names
- [ ] `custom-insights.tsx` - Filter dropdowns, insight text
- [ ] `sale-type-analysis.tsx` - Labels
- [ ] `segment-comparison-tool.tsx` - Labels (if still used)

---

### Phase 6: Fix Insights Page (LOW PRIORITY)

- [ ] `investment-score-card.tsx` - Region names in recommendations
- [ ] `market-timing-card.tsx` - Any Arabic text
- [ ] `price-forecast-chart.tsx` - Labels

---

### Phase 7: Fix Tools Page (LOW PRIORITY)

- [ ] `what-if-calculator.tsx` - Dropdown options
- [ ] `report-generator.tsx` - Report content

---

## Verification Checklist

After each phase, verify:

1. [ ] All dropdowns show English options
2. [ ] All chart labels are in English
3. [ ] All tooltips show English
4. [ ] All segment names in comparisons are English
5. [ ] Export files have proper English columns
6. [ ] Quick comparison presets work correctly
7. [ ] Project names are translated (where possible)

---

## Translation Coverage Report

| Category | Total Entries | Translated | Missing |
|----------|--------------|------------|---------|
| Regions | ~83 | 83 | 0 |
| Property Types | ~24 | 24 | 0 |
| Bedrooms | ~14 | 14 | 0 |
| Sale Types | 3 | 3 | 0 |
| Market Types | 2 | 2 | 0 |
| Asset Categories | 5 | 5 | 0 |
| **Projects** | ~500+ | **0** | **500+** |

---

## Priority Order

1. **HIGH**: Project translations (new feature, highly visible)
2. **HIGH**: Dropdown labels in segment builder
3. **MEDIUM**: Filter component labels
4. **MEDIUM**: Chart tooltips and labels
5. **LOW**: Edge cases and minor UI elements

---

## Estimated Effort

| Phase | Files | Estimated Time |
|-------|-------|----------------|
| Phase 1 | 2 | 30 min |
| Phase 2 | 1 | 20 min |
| Phase 3 | 1 | 15 min |
| Phase 4 | 10 | 45 min |
| Phase 5 | 5 | 30 min |
| Phase 6 | 3 | 15 min |
| Phase 7 | 2 | 10 min |
| **Total** | **24** | **~2.5 hours** |

---

## Decision Required

**Option A**: Fix all inconsistencies (comprehensive, ~2.5 hours)
**Option B**: Fix high priority only (projects + dropdowns, ~1 hour)
**Option C**: Add language toggle (let user choose Arabic/English)

**Recommendation**: Start with Option B, then progressively fix others.

