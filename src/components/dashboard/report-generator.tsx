"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { DashboardData } from "@/types";
import { translate } from "@/lib/translations";
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle,
  Loader2,
  Table,
  BarChart3,
  TrendingUp,
} from "lucide-react";

interface ReportGeneratorProps {
  data: DashboardData;
}

type ReportType = "summary" | "detailed" | "yearly" | "regions";

export function ReportGenerator({ data }: ReportGeneratorProps) {
  const [generating, setGenerating] = useState<ReportType | null>(null);
  const [generated, setGenerated] = useState<ReportType | null>(null);

  const generateCSV = (type: ReportType) => {
    setGenerating(type);
    
    setTimeout(() => {
      let csvContent = "";
      let filename = "";

      switch (type) {
        case "summary":
          filename = "abu_dhabi_re_summary.csv";
          csvContent = generateSummaryCSV();
          break;
        case "detailed":
          filename = "abu_dhabi_re_detailed.csv";
          csvContent = generateDetailedCSV();
          break;
        case "yearly":
          filename = "abu_dhabi_re_yearly.csv";
          csvContent = generateYearlyCSV();
          break;
        case "regions":
          filename = "abu_dhabi_re_regions.csv";
          csvContent = generateRegionsCSV();
          break;
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setGenerating(null);
      setGenerated(type);
      
      // Reset success indicator after 3 seconds
      setTimeout(() => setGenerated(null), 3000);
    }, 500);
  };

  const generateSummaryCSV = (): string => {
    const { kpis, yearlyData } = data;
    const latestYear = yearlyData[yearlyData.length - 1];
    const firstYear = yearlyData[0];

    const rows = [
      ["Abu Dhabi Real Estate Market Summary Report"],
      ["Generated", new Date().toLocaleDateString()],
      [""],
      ["Key Metrics", "Value"],
      ["Total Transactions", kpis.totalTransactions.toString()],
      ["Total Value (AED)", kpis.totalValue.toString()],
      ["Average Price/SQM (AED)", kpis.avgPricePerSqm.toFixed(2)],
      ["Most Active Region", kpis.mostActiveRegionEn],
      [""],
      ["Market Performance", ""],
      ["Data Period", `${firstYear.year} - ${latestYear.year}`],
      ["Price CAGR", `${(((latestYear.medianPricePerSqm / firstYear.medianPricePerSqm) ** (1 / (yearlyData.length - 1)) - 1) * 100).toFixed(2)}%`],
      ["YoY Transaction Growth", `${kpis.yoyTransactionGrowth.toFixed(2)}%`],
      ["YoY Price Growth", `${kpis.yoyPriceGrowth.toFixed(2)}%`],
      ["Latest Year Transactions", latestYear.transactions.toString()],
      ["Latest Year Value (AED)", latestYear.totalValue.toString()],
    ];

    return rows.map(row => row.join(",")).join("\n");
  };

  const generateDetailedCSV = (): string => {
    const { kpis, yearlyData, regionData, propertyTypeData, bedroomData } = data;

    const rows = [
      ["Abu Dhabi Real Estate Detailed Report"],
      ["Generated", new Date().toLocaleDateString()],
      [""],
      ["=== MARKET OVERVIEW ==="],
      ["Metric", "Value"],
      ["Total Transactions", kpis.totalTransactions.toString()],
      ["Total Value (AED)", kpis.totalValue.toString()],
      ["Average Price/SQM", kpis.avgPricePerSqm.toFixed(2)],
      ["Most Active Region", kpis.mostActiveRegionEn],
      [""],
      ["=== YEARLY TRENDS ==="],
      ["Year", "Transactions", "Total Value (AED)", "Avg Price/SQM", "Median Price/SQM", "YoY Change %"],
    ];

    yearlyData.forEach((year, index) => {
      const yoyChange = index > 0 
        ? (((year.medianPricePerSqm - yearlyData[index - 1].medianPricePerSqm) / yearlyData[index - 1].medianPricePerSqm) * 100).toFixed(2)
        : "N/A";
      rows.push([
        year.year.toString(),
        year.transactions.toString(),
        year.totalValue.toString(),
        year.avgPricePerSqm.toFixed(2),
        year.medianPricePerSqm.toFixed(2),
        yoyChange,
      ]);
    });

    rows.push([""]);
    rows.push(["=== TOP REGIONS ==="]);
    rows.push(["Region", "Transactions", "Total Value (AED)", "Avg Price/SQM", "YoY Growth %"]);

    regionData.slice(0, 15).forEach((region) => {
      rows.push([
        region.regionEn || translate(region.region, 'region'),
        region.transactions.toString(),
        region.totalValue.toString(),
        region.avgPricePerSqm.toFixed(2),
        region.yoyGrowth.toFixed(2),
      ]);
    });

    rows.push([""]);
    rows.push(["=== PROPERTY TYPES ==="]);
    rows.push(["Type", "Count", "Avg Price/SQM"]);

    propertyTypeData.forEach((type) => {
      rows.push([
        type.typeEn || translate(type.type, 'propertyType'),
        type.count.toString(),
        type.avgPricePerSqm.toFixed(2),
      ]);
    });

    rows.push([""]);
    rows.push(["=== BEDROOM ANALYSIS ==="]);
    rows.push(["Bedrooms", "Count", "Avg Price (AED)", "Avg Area (sqm)", "Avg Price/SQM"]);

    bedroomData.forEach((bed) => {
      rows.push([
        bed.bedroomsEn || translate(bed.bedrooms, 'bedroom'),
        bed.count.toString(),
        bed.avgPrice.toFixed(2),
        bed.avgArea.toFixed(2),
        bed.avgPricePerSqm.toFixed(2),
      ]);
    });

    return rows.map(row => row.join(",")).join("\n");
  };

  const generateYearlyCSV = (): string => {
    const { yearlyData } = data;

    const rows = [
      ["Abu Dhabi Real Estate Yearly Analysis"],
      ["Generated", new Date().toLocaleDateString()],
      [""],
      ["Year", "Transactions", "Total Value (AED)", "Avg Price/SQM", "Median Price/SQM", "YoY Transactions %", "YoY Price %"],
    ];

    yearlyData.forEach((year, index) => {
      const yoyTransactions = index > 0 
        ? (((year.transactions - yearlyData[index - 1].transactions) / yearlyData[index - 1].transactions) * 100).toFixed(2)
        : "N/A";
      const yoyPrice = index > 0 
        ? (((year.medianPricePerSqm - yearlyData[index - 1].medianPricePerSqm) / yearlyData[index - 1].medianPricePerSqm) * 100).toFixed(2)
        : "N/A";
      
      rows.push([
        year.year.toString(),
        year.transactions.toString(),
        year.totalValue.toString(),
        year.avgPricePerSqm.toFixed(2),
        year.medianPricePerSqm.toFixed(2),
        yoyTransactions,
        yoyPrice,
      ]);
    });

    return rows.map(row => row.join(",")).join("\n");
  };

  const generateRegionsCSV = (): string => {
    const { regionData } = data;

    const rows = [
      ["Abu Dhabi Real Estate Regional Analysis"],
      ["Generated", new Date().toLocaleDateString()],
      [""],
      ["Region", "Transactions", "Total Value (AED)", "Avg Price/SQM", "YoY Growth %", "Market Share %"],
    ];

    const totalTransactions = regionData.reduce((sum, r) => sum + r.transactions, 0);

    regionData.forEach((region) => {
      rows.push([
        region.regionEn || translate(region.region, 'region'),
        region.transactions.toString(),
        region.totalValue.toString(),
        region.avgPricePerSqm.toFixed(2),
        region.yoyGrowth.toFixed(2),
        ((region.transactions / totalTransactions) * 100).toFixed(2),
      ]);
    });

    return rows.map(row => row.join(",")).join("\n");
  };

  const reportTypes = [
    {
      type: "summary" as ReportType,
      title: "Executive Summary",
      description: "Key metrics and market overview",
      icon: FileText,
      color: "amber",
    },
    {
      type: "detailed" as ReportType,
      title: "Detailed Report",
      description: "Complete analysis with all sections",
      icon: FileSpreadsheet,
      color: "blue",
    },
    {
      type: "yearly" as ReportType,
      title: "Yearly Analysis",
      description: "Year-by-year performance data",
      icon: BarChart3,
      color: "emerald",
    },
    {
      type: "regions" as ReportType,
      title: "Regional Analysis",
      description: "All regions with metrics",
      icon: Table,
      color: "purple",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="w-5 h-5 text-amber-400" />
          Export Reports
        </CardTitle>
        <CardDescription>
          Download market data and analysis in CSV format for further analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const isGenerating = generating === report.type;
            const isGenerated = generated === report.type;

            return (
              <button
                key={report.type}
                onClick={() => generateCSV(report.type)}
                disabled={isGenerating}
                className={`p-4 rounded-lg border transition-all text-left group hover:scale-[1.02] ${
                  isGenerated
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      report.color === "amber" ? "bg-amber-500/10" :
                      report.color === "blue" ? "bg-blue-500/10" :
                      report.color === "emerald" ? "bg-emerald-500/10" :
                      "bg-purple-500/10"
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        report.color === "amber" ? "text-amber-400" :
                        report.color === "blue" ? "text-blue-400" :
                        report.color === "emerald" ? "text-emerald-400" :
                        "text-purple-400"
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{report.title}</h4>
                      <p className="text-sm text-slate-400">{report.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {isGenerating ? (
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    ) : isGenerated ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Download className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Data Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Total Records</p>
              <p className="font-medium text-white">{formatNumber(data.kpis.totalTransactions)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Years Covered</p>
              <p className="font-medium text-white">{data.yearlyData.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Regions</p>
              <p className="font-medium text-white">{data.regionData.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Last Updated</p>
              <p className="font-medium text-white">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
