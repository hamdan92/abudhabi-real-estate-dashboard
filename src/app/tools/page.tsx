"use client";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardHeader } from "@/components/dashboard/header";
import { LoadingSpinner } from "@/components/dashboard/loading-skeleton";
import { WhatIfCalculator } from "@/components/dashboard/what-if-calculator";
import { ReportGenerator } from "@/components/dashboard/report-generator";
import {
  Calculator,
  FileDown,
  ArrowLeft,
  Wrench,
} from "lucide-react";
import Link from "next/link";

export default function ToolsPage() {
  const { data, isLoading, error, refetch } = useDashboardData();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Error: {error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { yearlyData, regionData } = data;

  return (
    <div className="min-h-screen bg-slate-950">
      <DashboardHeader onRefresh={refetch} isLoading={isLoading} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link & Title */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Overview
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Wrench className="w-8 h-8 text-amber-400" />
            Tools & Calculators
          </h2>
          <p className="text-slate-400">
            Interactive tools to help you make informed investment decisions
          </p>
        </div>

        {/* What-If Calculator */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-6 h-6 text-amber-400" />
            <h3 className="text-2xl font-bold text-white">What-If Scenario Analysis</h3>
          </div>
          
          <WhatIfCalculator yearlyData={yearlyData} regionData={regionData} />
        </section>

        {/* Report Generator */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <FileDown className="w-6 h-6 text-amber-400" />
            <h3 className="text-2xl font-bold text-white">Export Data & Reports</h3>
          </div>
          
          <ReportGenerator data={data} />
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-slate-800">
          <p className="text-slate-500 text-sm">
            Abu Dhabi Real Estate Analytics Dashboard • Tools & Calculators
          </p>
        </footer>
      </main>
    </div>
  );
}

