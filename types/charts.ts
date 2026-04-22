export type ChartRange = "7d" | "30d" | "90d" | "6m" | "1y";
export type TrendDirection = "up" | "down" | "neutral";

export interface BaseChartPoint {
  key: string;
  label: string;
}

export interface LineChartPoint extends BaseChartPoint {
  value: number;
}

export interface StackedChartPoint extends BaseChartPoint {
  [seriesKey: string]: string | number;
}

export interface DonutChartSlice {
  name: string;
  value: number;
}

export interface HeatmapCell {
  date: string;
  value: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface MetricTrend {
  value: number;
  delta: number;
  direction: TrendDirection;
  label: string;
}

export interface DashboardCharts {
  commitVelocity: LineChartPoint[];
  repoStars: DonutChartSlice[];
  languageBreakdown: DonutChartSlice[];
  weatherTrend: LineChartPoint[];
  contributionHeatmap: HeatmapCell[];
}
