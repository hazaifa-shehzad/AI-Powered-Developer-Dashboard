export type GitHubVisibility = "public" | "private";
export type GitHubRepoSort = "updated" | "stars" | "forks" | "name";

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string;
  htmlUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  email: string | null;
  twitterUsername: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists: number;
  hireable: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubRepositoryOwner {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  owner: GitHubRepositoryOwner;
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazersCount: number;
  forksCount: number;
  watchersCount: number;
  openIssuesCount: number;
  defaultBranch: string;
  visibility: GitHubVisibility;
  isFork: boolean;
  isArchived: boolean;
  isPrivate: boolean;
  sizeKb: number;
  pushedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubCommitAuthor {
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  htmlUrl?: string | null;
}

export interface GitHubCommit {
  sha: string;
  shortSha: string;
  message: string;
  htmlUrl: string;
  repoName: string;
  branch?: string | null;
  author: GitHubCommitAuthor | null;
  committedAt: string;
}

export interface GitHubContributionDay {
  date: string;
  contributionCount: number;
  color: string;
  weekday: number;
}

export interface GitHubContributionWeek {
  firstDay: string;
  contributionDays: GitHubContributionDay[];
}

export interface GitHubContributionCalendar {
  totalContributions: number;
  weeks: GitHubContributionWeek[];
}

export interface GitHubLanguageStat {
  name: string;
  value: number;
  percentage: number;
}

export interface GitHubActivityOverview {
  totalStars: number;
  totalForks: number;
  totalOpenIssues: number;
  totalWatchers: number;
  totalCommits: number;
  activeRepos: number;
}

export interface GitHubDashboardPayload {
  profile: GitHubUserProfile;
  repositories: GitHubRepository[];
  recentCommits: GitHubCommit[];
  contributionCalendar: GitHubContributionCalendar | null;
  languages: GitHubLanguageStat[];
  overview: GitHubActivityOverview;
}

export interface GitHubUserApiResponse {
  profile: GitHubUserProfile;
  repositories: GitHubRepository[];
  recentCommits: GitHubCommit[];
}

export interface GitHubContributionsApiResponse {
  contributionCalendar: GitHubContributionCalendar;
}
