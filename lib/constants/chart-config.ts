export const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted-foreground))",
  success: "hsl(142 71% 45%)",
  warning: "hsl(38 92% 50%)",
  danger: "hsl(0 84% 60%)",
  info: "hsl(221 83% 53%)",
} as const;

export const LANGUAGE_CHART_CONFIG = [
  CHART_COLORS.primary,
  CHART_COLORS.info,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.accent,
  CHART_COLORS.secondary,
] as const;

export const CONTRIBUTION_CHART_CONFIG = {
  dataKey: "contributions",
  labelKey: "dateLabel",
  stroke: CHART_COLORS.primary,
  fill: CHART_COLORS.primary,
  radius: [10, 10, 0, 0] as const,
} as const;

export const REPOSITORY_CHART_CONFIG = {
  stars: {
    dataKey: "stars",
    color: CHART_COLORS.warning,
    label: "Stars",
  },
  forks: {
    dataKey: "forks",
    color: CHART_COLORS.info,
    label: "Forks",
  },
  watchers: {
    dataKey: "watchers",
    color: CHART_COLORS.success,
    label: "Watchers",
  },
} as const;

export const CHART_GRID_STYLE = {
  strokeDasharray: "4 4",
  vertical: false,
  opacity: 0.2,
} as const;

export const CHART_AXIS_STYLE = {
  fontSize: 12,
  tickMargin: 10,
} as const;

export const CHART_ANIMATION = {
  duration: 700,
  easing: "ease-out",
} as const;
