import { clientEnv } from "../config/env";

export const APP_CONFIG = {
  name: clientEnv.NEXT_PUBLIC_APP_NAME,
  description:
    "A polished developer dashboard for GitHub insights, daily focus, weather, quotes, and AI-powered coding tips.",
  url: clientEnv.NEXT_PUBLIC_APP_URL,
  defaultGithubUsername: clientEnv.NEXT_PUBLIC_DEFAULT_GITHUB_USERNAME,
  defaultWeatherCity: clientEnv.NEXT_PUBLIC_DEFAULT_WEATHER_CITY,
  supportEmail: "support@example.com",
  repoLink: "https://github.com",
} as const;

export const API_ROUTES = {
  github: "/api/github",
  githubGraphql: "/api/github-graphql",
  weather: "/api/weather",
  quote: "/api/quote",
  aiTip: "/api/ai-tip",
} as const;

export const DASHBOARD_LIMITS = {
  maxPinnedRepos: 6,
  maxRecentCommits: 10,
  maxContributionDays: 84,
  maxLanguageSlices: 6,
} as const;

export const DASHBOARD_TIME_RANGES = [
  { label: "7D", value: "7d", days: 7 },
  { label: "30D", value: "30d", days: 30 },
  { label: "90D", value: "90d", days: 90 },
  { label: "1Y", value: "1y", days: 365 },
] as const;

export const DATE_FORMATS = {
  short: {
    month: "short",
    day: "numeric",
  },
  long: {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
  full: {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
} as const;

export const FALLBACK_MESSAGES = {
  weather: "Weather data is temporarily unavailable.",
  quote: "Small progress every day adds up.",
  aiTip: "Break your work into small, testable units before optimizing.",
  github: "GitHub data could not be loaded.",
} as const;
