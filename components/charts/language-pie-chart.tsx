"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartWrapper } from "@/components/charts/chart-wrapper";
import type { LanguageStat } from "@/types/dashboard";

const COLORS = ["#0f172a", "#2563eb", "#14b8a6", "#8b5cf6", "#f97316", "#e11d48"];

interface LanguagePieChartProps {
  data: LanguageStat[];
}

export function LanguagePieChart({ data }: LanguagePieChartProps) {
  return (
    <ChartWrapper title="Language Breakdown" description="Where most of your repository code lives.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={102} paddingAngle={3}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{entry.name}</span>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartWrapper>
  );
}
