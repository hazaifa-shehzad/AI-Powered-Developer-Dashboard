import { API_ROUTES, DASHBOARD_LIMITS } from "../constants/app";
import { getApiUrl, isServer } from "../config/env";
import { getCommitTrend } from "../utils/get-commit-trend";
import { groupLanguages } from "../utils/group-languages";

export type GitHubUserProfile = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  location: string | null;
  company: string | null;
  blog: string | null;
  twitter_username: string | null;
  created_at: string;
  updated_at: string;
};

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  size: number;
  default_branch: string;
  homepage: string | null;
  updated_at: string;
  pushed_at: string;
};

export type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
};

export type GitHubContributionDay = {
  date: string;
  contributionCount: number;
  color?: string;
};

export type GitHubContributionCalendar = {
  totalContributions: number;
  weeks: Array<{
    contributionDays: GitHubContributionDay[];
  }>;
};

export type GitHubDashboardData = {
  profile: GitHubUserProfile;
  repos: GitHubRepo[];
  contributions: GitHubContributionCalendar;
  metrics: {
    totalStars: number;
    totalForks: number;
    totalWatchers: number;
    totalOpenIssues: number;
    activeRepos: number;
  };
  languages: ReturnType<typeof groupLanguages>;
  commitTrend: ReturnType<typeof getCommitTrend>;
  topRepos: Array<{
    name: string;
    stars: number;
    forks: number;
    watchers: number;
    language: string | null;
    updatedAt: string;
    url: string;
  }>;
};

type NextFetchOptions = {
  revalidate?: number;
  tags?: string[];
};

type FetchOptions = RequestInit & {
  searchParams?: Record<string, string | number | boolean | undefined>;
  next?: NextFetchOptions;
};

function buildUrl(path: string, searchParams?: FetchOptions["searchParams"]) {
  const url = new URL(
    isServer ? getApiUrl(path) : path,
    isServer ? undefined : window.location.origin,
  );

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return isServer ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

async function fetchJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { searchParams, headers, next, ...init } = options;
  const response = await fetch(buildUrl(path, searchParams), {
    ...init,
    headers: {
      Accept: "application/json",
      ...headers,
    },
    cache: init.cache ?? "no-store",
    next,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "Unknown error");
    throw new Error(`GitHub request failed (${response.status}): ${message}`);
  }

  return (await response.json()) as T;
}

export async function getGitHubProfile(username: string) {
  return fetchJson<GitHubUserProfile>(API_ROUTES.github, {
    searchParams: {
      username,
      type: "profile",
    },
    next: { revalidate: 60 },
  });
}

export async function getGitHubRepos(username: string, perPage = 12) {
  return fetchJson<GitHubRepo[]>(API_ROUTES.github, {
    searchParams: {
      username,
      type: "repos",
      per_page: perPage,
      sort: "updated",
    },
    next: { revalidate: 60 },
  });
}

export async function getGitHubRepoCommits(
  owner: string,
  repo: string,
  perPage = DASHBOARD_LIMITS.maxRecentCommits,
) {
  return fetchJson<GitHubCommit[]>(API_ROUTES.github, {
    searchParams: {
      owner,
      repo,
      type: "commits",
      per_page: perPage,
    },
    next: { revalidate: 60 },
  });
}

export async function getGitHubContributionCalendar(username: string) {
  const data = await fetchJson<{ contributionCalendar: GitHubContributionCalendar }>(
    API_ROUTES.githubGraphql,
    {
      searchParams: { username },
      next: { revalidate: 60 },
    },
  );

  return data.contributionCalendar;
}

function flattenContributionDays(contributions: GitHubContributionCalendar) {
  return contributions.weeks.flatMap((week) => week.contributionDays);
}

function buildDashboardMetrics(repos: GitHubRepo[]) {
  return repos.reduce(
    (acc, repo) => {
      acc.totalStars += repo.stargazers_count;
      acc.totalForks += repo.forks_count;
      acc.totalWatchers += repo.watchers_count;
      acc.totalOpenIssues += repo.open_issues_count;
      acc.activeRepos += repo.pushed_at ? 1 : 0;
      return acc;
    },
    {
      totalStars: 0,
      totalForks: 0,
      totalWatchers: 0,
      totalOpenIssues: 0,
      activeRepos: 0,
    },
  );
}

export async function getGitHubDashboardData(username: string): Promise<GitHubDashboardData> {
  const [profile, repos, contributions] = await Promise.all([
    getGitHubProfile(username),
    getGitHubRepos(username, 100),
    getGitHubContributionCalendar(username),
  ]);

  const metrics = buildDashboardMetrics(repos);
  const languages = groupLanguages(
    repos.map((repo) => ({
      language: repo.language,
      size: repo.size,
      stars: repo.stargazers_count,
    })),
  ).slice(0, DASHBOARD_LIMITS.maxLanguageSlices);

  const contributionDays = flattenContributionDays(contributions).slice(
    -DASHBOARD_LIMITS.maxContributionDays,
  );

  const commitTrend = getCommitTrend(contributionDays, 7);

  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, DASHBOARD_LIMITS.maxPinnedRepos)
    .map((repo) => ({
      name: repo.name,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      language: repo.language,
      updatedAt: repo.updated_at,
      url: repo.html_url,
    }));

  return {
    profile,
    repos,
    contributions,
    metrics,
    languages,
    commitTrend,
    topRepos,
  };
}
