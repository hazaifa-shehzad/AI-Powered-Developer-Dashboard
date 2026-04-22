import { Flame, Sparkles, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { ContributionSummary } from "@/types/dashboard";

interface ContributionCardProps {
  summary: ContributionSummary;
}

export function ContributionCard({ summary }: ContributionCardProps) {
  const stats = [
    {
      label: "Total contributions",
      value: formatNumber(summary.totalContributions),
      icon: Trophy,
    },
    {
      label: "Current streak",
      value: `${summary.currentStreak ?? 0} days`,
      icon: Flame,
    },
    {
      label: "Active days",
      value: `${summary.activeDays ?? 0}`,
      icon: Sparkles,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribution Momentum</CardTitle>
        <CardDescription>How consistently you've been pushing code and showing up.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Icon className="h-4 w-4" />
                {item.label}
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{item.value}</div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
