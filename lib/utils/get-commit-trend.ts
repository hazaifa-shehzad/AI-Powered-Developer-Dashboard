export type ContributionPoint = {
  date: string;
  contributionCount: number;
};

export type CommitTrend = {
  total: number;
  currentPeriod: number;
  previousPeriod: number;
  delta: number;
  direction: "up" | "down" | "flat";
  series: Array<{
    date: string;
    dateLabel: string;
    contributions: number;
  }>;
};

export function getCommitTrend(
  items: ContributionPoint[],
  period = 7,
): CommitTrend {
  const normalized = [...items]
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .map((item) => ({
      date: item.date,
      dateLabel: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(item.date)),
      contributions: item.contributionCount,
    }));

  const total = normalized.reduce((sum, item) => sum + item.contributions, 0);
  const currentSlice = normalized.slice(-period);
  const previousSlice = normalized.slice(-(period * 2), -period);

  const currentPeriod = currentSlice.reduce((sum, item) => sum + item.contributions, 0);
  const previousPeriod = previousSlice.reduce((sum, item) => sum + item.contributions, 0);
  const delta = currentPeriod - previousPeriod;

  return {
    total,
    currentPeriod,
    previousPeriod,
    delta,
    direction: delta === 0 ? "flat" : delta > 0 ? "up" : "down",
    series: normalized,
  };
}
