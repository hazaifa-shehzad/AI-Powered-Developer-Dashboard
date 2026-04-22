"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface GithubProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  html_url: string;
  company?: string | null;
  location?: string | null;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  pushed_at: string;
  updated_at: string;
}

export interface GithubCommit {
  sha: string;
  html_url: string;
  repoName: string;
  message: string;
  authorName: string | null;
  date: string;
}

export interface GithubContributionDay {
  date: string;
  contributionCount: number;
}

export interface GithubStats {
  totalStars: number;
  totalForks: number;
  languages: Record<string, number>;
  mostUsedLanguage: string | null;
}

export interface GithubData {
  profile: GithubProfile | null;
  repos: GithubRepo[];
  recentCommits: GithubCommit[];
  contributions: GithubContributionDay[];
  totalContributions: number;
  stats: GithubStats;
}

interface GithubRestResponse {
  profile?: GithubProfile | null;
  repos?: GithubRepo[];
  recentCommits?: GithubCommit[];
}

interface GithubGraphQLResponse {
  contributions?: GithubContributionDay[];
  totalContributions?: number;
}

interface UseGithubOptions {
  username?: string;
  enabled?: boolean;
}

interface UseGithubResult {
  data: GithubData;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasData: boolean;
  refetch: () => Promise<void>;
}

const defaultData: GithubData = {
  profile: null,
  repos: [],
  recentCommits: [],
  contributions: [],
  totalContributions: 0,
  stats: {
    totalStars: 0,
    totalForks: 0,
    languages: {},
    mostUsedLanguage: null,
  },
};

function buildStats(repos: GithubRepo[]): GithubStats {
  const languages = repos.reduce<Record<string, number>>((acc, repo) => {
    if (!repo.language) return acc;
    acc[repo.language] = (acc[repo.language] ?? 0) + 1;
    return acc;
  }, {});

  const mostUsedLanguage =
    Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    totalStars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    totalForks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
    languages,
    mostUsedLanguage,
  };
}

export function useGithub(options: UseGithubOptions = {}): UseGithubResult {
  const { username, enabled = true } = options;
  const [data, setData] = useState<GithubData>(defaultData);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchGithubData = useCallback(async () => {
    if (!enabled || !username?.trim()) {
      hasLoadedRef.current = false;
      setData(defaultData);
      setError(null);
      return;
    }

    const isFirstLoad = !hasLoadedRef.current;
    setError(null);
    setIsLoading(isFirstLoad);
    setIsRefreshing(!isFirstLoad);

    const restUrl = `/api/github?username=${encodeURIComponent(username)}`;
    const graphUrl = `/api/github-graphql?username=${encodeURIComponent(username)}`;

    try {
      const [restResponse, graphResponse] = await Promise.allSettled([
        fetch(restUrl, { cache: "no-store" }),
        fetch(graphUrl, { cache: "no-store" }),
      ]);

      let restData: GithubRestResponse = {};
      let graphData: GithubGraphQLResponse = {};

      if (restResponse.status === "rejected") {
        throw new Error("Failed to reach the GitHub REST endpoint.");
      }

      if (!restResponse.value.ok) {
        const message = await restResponse.value.text();
        throw new Error(message || "Failed to fetch GitHub profile data.");
      }

      restData = (await restResponse.value.json()) as GithubRestResponse;

      if (graphResponse.status === "fulfilled" && graphResponse.value.ok) {
        graphData = (await graphResponse.value.json()) as GithubGraphQLResponse;
      }

      const repos = restData.repos ?? [];
      setData({
        profile: restData.profile ?? null,
        repos,
        recentCommits: restData.recentCommits ?? [],
        contributions: graphData.contributions ?? [],
        totalContributions: graphData.totalContributions ?? 0,
        stats: buildStats(repos),
      });
      hasLoadedRef.current = true;
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Something went wrong while loading GitHub data.";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [enabled, username]);

  useEffect(() => {
    void fetchGithubData();
  }, [fetchGithubData]);

  const hasData = useMemo(
    () => Boolean(data.profile || data.repos.length || data.contributions.length),
    [data],
  );

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    hasData,
    refetch: fetchGithubData,
  };
}

export default useGithub;
