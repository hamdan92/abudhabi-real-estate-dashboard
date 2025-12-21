import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number with commas
export function formatNumber(num: number, decimals: number = 0): string {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format currency in AED
export function formatCurrency(num: number, compact: boolean = false): string {
  if (num === null || num === undefined || isNaN(num)) return "AED 0";
  
  if (compact) {
    if (num >= 1_000_000_000) {
      return `AED ${(num / 1_000_000_000).toFixed(1)}B`;
    }
    if (num >= 1_000_000) {
      return `AED ${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
      return `AED ${(num / 1_000).toFixed(1)}K`;
    }
  }
  
  return `AED ${formatNumber(num)}`;
}

// Format percentage
export function formatPercentage(num: number, decimals: number = 1): string {
  if (num === null || num === undefined || isNaN(num)) return "0%";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(decimals)}%`;
}

// Calculate percentage change
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Calculate median of an array
export function median(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].filter(n => !isNaN(n)).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Calculate average of an array
export function average(arr: number[]): number {
  if (!arr.length) return 0;
  const valid = arr.filter(n => !isNaN(n) && n !== null && n !== undefined);
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// Get trend direction
export function getTrendDirection(change: number): "up" | "down" | "neutral" {
  if (change > 0.5) return "up";
  if (change < -0.5) return "down";
  return "neutral";
}

// Generate color based on value
export function getHeatmapColor(value: number, min: number, max: number): string {
  const normalized = (value - min) / (max - min);
  if (normalized < 0.25) return "#22c55e"; // green
  if (normalized < 0.5) return "#eab308"; // yellow
  if (normalized < 0.75) return "#f97316"; // orange
  return "#ef4444"; // red
}

// Date helpers
export function getYearFromDate(date: Date): number {
  return new Date(date).getFullYear();
}

export function getMonthFromDate(date: Date): number {
  return new Date(date).getMonth() + 1;
}

export function getQuarterFromDate(date: Date): number {
  return Math.ceil((new Date(date).getMonth() + 1) / 3);
}

// Format date for display
export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format month-year for charts
export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

// Group by helper
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

// Sort by value descending
export function sortByValueDesc<T>(array: T[], key: keyof T): T[] {
  return [...array].sort((a, b) => Number(b[key]) - Number(a[key]));
}

