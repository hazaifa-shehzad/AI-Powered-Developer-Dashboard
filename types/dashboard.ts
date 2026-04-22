export type ThemeMode = "light" | "dark" | "system";

export interface GitHubProfile {
  login: string;
  name: string;
  avatarUrl: string;
  bio?: string;
  location?: string;
  company?: string;
  blog?: string;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists?: number;
  htmlUrl: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description?: string;
  htmlUrl: string;
  homepage?: string;
  language?: string;
  stars: number;
  forks: number;
  watchers?: number;
  topics?: string[];
  updatedAt: string;
}

export interface GitHubCommit {
  id: string;
  message: string;
  repoName: string;
  authorName: string;
  authorAvatar?: string;
  committedAt: string;
  htmlUrl: string;
  sha: string;
}

export interface ContributionDay {
  date: string;
  contributionCount: number;
  color?: string;
}

export interface ContributionSummary {
  totalContributions: number;
  longestStreak?: number;
  currentStreak?: number;
  activeDays?: number;
}

export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike?: number;
  condition: string;
  icon?: string;
  humidity?: number;
  windSpeed?: number;
  localTime?: string;
}

export interface QuoteData {
  quote: string;
  author: string;
}

export interface AITipData {
  title: string;
  body: string;
  tag?: string;
}

export interface StatsMetric {
  label: string;
  value: number;
  change?: number;
  helperText?: string;
  trend?: "up" | "down" | "neutral";
}

export interface LanguageStat {
  name: string;
  value: number;
}

export interface CommitTrendPoint {
  date: string;
  commits: number;
}
