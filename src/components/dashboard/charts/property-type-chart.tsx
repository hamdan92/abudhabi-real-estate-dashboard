"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { PropertyTypeData } from "@/types";

interface PropertyTypeChartProps {
  data: PropertyTypeData[];
  title?: string;
  limit?: number;
}

const COLORS = [
  "#f59e0b",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#22c55e",
  "#06b6d4",
];

// Property type translations
const TYPE_LABELS: Record<string, string> = {
  "شقة": "Apartment",
  "ڨيلا": "Villa",
  "تاونهاوس / ڨيلا شبه منفصلة": "Townhouse",
  "أرض لڨيلا": "Villa Land",
  "مزرعة": "Farm",
  "مجمع سكني": "Residential Complex",
  "أرض لمزرعة": "Farm Land",
  "دوپلكس": "Duplex",
  "مكتب": "Office",
  "آخر": "Other",
};

export function PropertyTypeChart({
  data,
  title = "Property Type Distribution",
  limit = 8,
}: PropertyTypeChartProps) {
  const chartData = data.slice(0, limit).map((item) => ({
    ...item,
    name: TYPE_LABELS[item.type] || item.type,
  }));

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="count"
                nameKey="name"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#0f172a"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f1f5f9" }}
                formatter={(value: number, name: string) => [
                  `${formatNumber(value)} (${((value / total) * 100).toFixed(1)}%)`,
                  name,
                ]}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

