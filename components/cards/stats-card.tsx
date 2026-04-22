"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import type { StatsMetric } from "@/types/dashboard";

interface StatsCardProps {
  metric: StatsMetric;
  icon?: ReactNode;
}

function useCountUp(value: number, duration = 900) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const frames = 30;
    const step = value / frames;

    const interval = window.setInterval(() => {
      frame += 1;
      setDisplayValue(Math.min(Math.round(step * frame), value));
      if (frame >= frames) {
        window.clearInterval(interval);
      }
    }, duration / frames);

    return () => window.clearInterval(interval);
  }, [value, duration]);

  return displayValue;
}

export function StatsCard({ metric, icon }: StatsCardProps) {
  const displayValue = useCountUp(metric.value);

  const trend = useMemo(() => {
    if (metric.trend === "down" || (metric.change ?? 0) < 0) {
      return {
        icon: ArrowDownRight,
        className: "text-rose-600 dark:text-rose-300",
      };
    }

    if (metric.trend === "neutral" || !metric.change) {
      return {
        icon: Minus,
        className: "text-slate-500 dark:text-slate-400",
      };
    }

    return {
      icon: ArrowUpRight,
      className: "text-emerald-600 dark:text-emerald-300",
    };
  }, [metric.change, metric.trend]);

  const TrendIcon = trend.icon;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.label}</p>
            <div className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {formatNumber(displayValue)}
            </div>
          </div>
          {icon ? <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-900 dark:text-slate-200">{icon}</div> : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <div className={cn("inline-flex items-center gap-1 font-medium", trend.className)}>
            <TrendIcon className="h-4 w-4" />
            {metric.change ? `${Math.abs(metric.change)}%` : "No change"}
          </div>
          {metric.helperText ? <span className="text-slate-500 dark:text-slate-400">{metric.helperText}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
