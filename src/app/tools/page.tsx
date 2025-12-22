"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import {
  ArrowLeft,
  Wrench,
  Construction,
} from "lucide-react";
import Link from "next/link";

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <DashboardHeader onRefresh={() => {}} isLoading={false} />

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

        {/* Under Development Message */}
        <section className="flex flex-col items-center justify-center py-32 bg-slate-900/30 rounded-2xl border border-slate-800">
          <Construction className="w-20 h-20 text-amber-400 mb-6" />
          <h3 className="text-3xl font-bold text-white mb-3">Under Development</h3>
          <p className="text-slate-400 text-center max-w-lg mb-6">
            We&apos;re building powerful investment tools including What-If calculators, 
            scenario analysis, and report generators. Check back soon!
          </p>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
            >
              Go to Overview
            </Link>
            <Link
              href="/analytics"
              className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
            >
              View Analytics
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-slate-800 mt-12">
          <p className="text-slate-500 text-sm">
            Abu Dhabi Real Estate Analytics Dashboard • Tools
          </p>
        </footer>
      </main>
    </div>
  );
}
