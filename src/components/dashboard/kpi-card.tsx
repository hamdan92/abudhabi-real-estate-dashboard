"use client";

import { Card } from "@/components/ui/card";
import { cn, formatNumber, formatCurrency, formatPercentage } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  format?: "number" | "currency" | "percentage" | "text";
  compact?: boolean;
  className?: string;
  subtitle?: string;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = "vs last year",
  icon: Icon,
  format = "number",
  compact = true,
  className,
  subtitle,
}: KPICardProps) {
  const formattedValue = (() => {
    if (format === "text" || typeof value === "string") return value;
    if (format === "currency") return formatCurrency(value as number, compact);
    if (format === "percentage") return formatPercentage(value as number);
    return formatNumber(value as number);
  })();

  const trendIcon = (() => {
    if (change === undefined) return null;
    if (change > 0.5) return <TrendingUp className="h-4 w-4" />;
    if (change < -0.5) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  })();

  const trendColor = (() => {
    if (change === undefined) return "";
    if (change > 0.5) return "text-emerald-400";
    if (change < -0.5) return "text-rose-400";
    return "text-slate-400";
  })();

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            {subtitle && (
              <p className="text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Icon className="h-5 w-5 text-amber-400" />
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-3xl font-bold text-slate-100 tracking-tight">
            {formattedValue}
          </p>
          
          {change !== undefined && (
            <div className={cn("mt-2 flex items-center gap-1 text-sm", trendColor)}>
              {trendIcon}
              <span className="font-medium">{formatPercentage(change)}</span>
              <span className="text-slate-500">{changeLabel}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />
    </Card>
  );
}

