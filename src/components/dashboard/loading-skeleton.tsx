"use client";

import { Card } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="h-4 w-24 bg-slate-700 rounded mb-4" />
            <div className="h-8 w-32 bg-slate-700 rounded mb-2" />
            <div className="h-3 w-20 bg-slate-800 rounded" />
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="p-6">
            <div className="h-5 w-40 bg-slate-700 rounded mb-4" />
            <div className="h-[350px] bg-slate-800/50 rounded" />
          </Card>
        ))}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="p-6">
            <div className="h-5 w-40 bg-slate-700 rounded mb-4" />
            <div className="h-[350px] bg-slate-800/50 rounded" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
        </div>
        <p className="text-slate-400 text-lg">Loading real estate data...</p>
      </div>
    </div>
  );
}

