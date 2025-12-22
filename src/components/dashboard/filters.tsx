"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Filter, X, ChevronDown, ChevronUp, Calendar, MapPin, Home, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/translations";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FiltersProps {
  years: number[];
  regions: string[];
  propertyTypes: string[];
  saleTypes?: string[];
  selectedYears: number[];
  selectedRegions: string[];
  selectedPropertyTypes: string[];
  selectedSaleTypes: string[];
  onYearsChange: (years: number[]) => void;
  onRegionsChange: (regions: string[]) => void;
  onPropertyTypesChange: (types: string[]) => void;
  onSaleTypesChange: (types: string[]) => void;
  onClearAll: () => void;
}

// Collapsible section component
function FilterSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-700/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-slate-200">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {isOpen && <div className="pb-3 px-1">{children}</div>}
    </div>
  );
}

// Checkbox item component
function CheckboxItem({
  value,
  label,
  checked,
  onChange,
}: {
  value: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-800/50 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
      />
      <span className="text-sm text-slate-300 group-hover:text-slate-100 truncate">
        {label}
      </span>
    </label>
  );
}

export function Filters({
  years,
  regions,
  propertyTypes,
  saleTypes = ["جاهزة", "على المخطط", "أمر محكمة"],
  selectedYears,
  selectedRegions,
  selectedPropertyTypes,
  selectedSaleTypes,
  onYearsChange,
  onRegionsChange,
  onPropertyTypesChange,
  onSaleTypesChange,
  onClearAll,
}: FiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return (
      selectedYears.length +
      selectedRegions.length +
      selectedPropertyTypes.length +
      selectedSaleTypes.length
    );
  }, [selectedYears, selectedRegions, selectedPropertyTypes, selectedSaleTypes]);

  // Filter regions by search term
  const filteredRegions = useMemo(() => {
    if (!searchTerm) return regions.slice(0, 20);
    return regions.filter((r) =>
      r.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [regions, searchTerm]);

  // Toggle handlers
  const toggleYear = (year: number) => {
    if (selectedYears.includes(year)) {
      onYearsChange(selectedYears.filter((y) => y !== year));
    } else {
      onYearsChange([...selectedYears, year]);
    }
  };

  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      onRegionsChange(selectedRegions.filter((r) => r !== region));
    } else {
      onRegionsChange([...selectedRegions, region]);
    }
  };

  const togglePropertyType = (type: string) => {
    if (selectedPropertyTypes.includes(type)) {
      onPropertyTypesChange(selectedPropertyTypes.filter((t) => t !== type));
    } else {
      onPropertyTypesChange([...selectedPropertyTypes, type]);
    }
  };

  const toggleSaleType = (type: string) => {
    if (selectedSaleTypes.includes(type)) {
      onSaleTypesChange(selectedSaleTypes.filter((t) => t !== type));
    } else {
      onSaleTypesChange([...selectedSaleTypes, type]);
    }
  };

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-4 h-4 text-amber-400" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Years Filter */}
        <FilterSection title="Year" icon={Calendar} defaultOpen={true}>
          <div className="flex flex-wrap gap-1.5">
            {years.sort((a, b) => b - a).map((year) => (
              <button
                key={year}
                onClick={() => toggleYear(year)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg transition-colors",
                  selectedYears.includes(year)
                    ? "bg-amber-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Regions Filter */}
        <FilterSection title="Region" icon={MapPin}>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search regions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {filteredRegions.map((region) => (
                <CheckboxItem
                  key={region}
                  value={region}
                  label={translate(region, 'region')}
                  checked={selectedRegions.includes(region)}
                  onChange={() => toggleRegion(region)}
                />
              ))}
            </div>
            {selectedRegions.length > 0 && (
              <div className="pt-2 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">Selected ({selectedRegions.length}):</p>
                <div className="flex flex-wrap gap-1">
                  {selectedRegions.map((region) => (
                    <span
                      key={region}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded"
                    >
                      {translate(region, 'region')}
                      <button
                        onClick={() => toggleRegion(region)}
                        className="hover:text-amber-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FilterSection>

        {/* Property Type Filter */}
        <FilterSection title="Property Type" icon={Home}>
          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {propertyTypes.map((type) => (
              <CheckboxItem
                key={type}
                value={type}
                label={translate(type, 'propertyType')}
                checked={selectedPropertyTypes.includes(type)}
                onChange={() => togglePropertyType(type)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Sale Type Filter */}
        <FilterSection title="Sale Type" icon={Tag}>
          <div className="space-y-0.5">
            {saleTypes.map((type) => (
              <CheckboxItem
                key={type}
                value={type}
                label={translate(type, 'saleType')}
                checked={selectedSaleTypes.includes(type)}
                onChange={() => toggleSaleType(type)}
              />
            ))}
          </div>
        </FilterSection>
      </CardContent>
    </Card>
  );
}

