"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartWrapper } from "@/components/charts/chart-wrapper";
import type { CommitTrendPoint } from "@/types/dashboard";

interface CommitsLineChartProps {
  data: CommitTrendPoint[];
}

export function CommitsLineChart({ data }: CommitsLineChartProps) {
  return (
    <ChartWrapper title="Commit Activity" description="A quick look at your commit rhythm over time.">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="commits" stroke="#0f172a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartWrapper>
  );
}
