import { formatDate } from "@/lib/utils";
import type { ContributionDay } from "@/types/dashboard";

interface ContributionsHeatmapProps {
  days: ContributionDay[];
}

function getContributionLevel(count: number) {
  if (count === 0) return "bg-slate-200 dark:bg-slate-800";
  if (count <= 2) return "bg-emerald-200 dark:bg-emerald-900";
  if (count <= 5) return "bg-emerald-400 dark:bg-emerald-700";
  if (count <= 9) return "bg-emerald-500 dark:bg-emerald-600";
  return "bg-emerald-700 dark:bg-emerald-500";
}

export function ContributionsHeatmap({ days }: ContributionsHeatmapProps) {
  const weeks: ContributionDay[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${formatDate(day.date, { month: "short", day: "numeric" })}: ${day.contributionCount} contributions`}
                className={`h-3.5 w-3.5 rounded-[4px] ${day.color ?? getContributionLevel(day.contributionCount)}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
