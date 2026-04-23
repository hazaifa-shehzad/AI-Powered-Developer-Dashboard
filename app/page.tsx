'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Pagination from '@/components/ui/pagination';
import {
  FiArrowRight,
  FiCloud,
  FiDownload,
  FiExternalLink,
  FiGitBranch,
  FiGithub,
  FiLoader,
  FiMessageSquare,
  FiMoon,
  FiRefreshCcw,
  FiSearch,
  FiStar,
  FiSun,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import Image from 'next/image';
import { useTheme } from '../hooks/useTheme';

interface GithubUser {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  location: string | null;
  blog: string | null;
  company: string | null;
}

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  updated_at: string;
  pushed_at: string;
  created_at: string;
  archived: boolean;
  fork: boolean;
}

interface RecentCommit {
  sha: string;
  htmlUrl: string;
  repoName: string;
  message: string;
  authorName: string;
  authorAvatar: string | null;
  committedAt: string;
}

interface GithubApiData {
  user: GithubUser;
  repos: GithubRepo[];
  allRepos?: GithubRepo[];
  recentCommits: RecentCommit[];
  meta: {
    page: number;
    perPage: number;
    hasNextPage: boolean;
    rateLimitRemaining: string | null;
    totalRepos?: number;
  };
}

interface ContributionDay {
  contributionCount: number;
  date: string;
  weekday: number;
  color: string;
}

interface ContributionWeek {
  firstDay: string;
  contributionDays: ContributionDay[];
}

interface ContributionsData {
  totalContributions: number;
  weeks: ContributionWeek[];
}

interface WeatherData {
  city: string;
  state: string | null;
  country: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  units: 'metric' | 'imperial';
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  sunrise: number;
  sunset: number;
  condition: string;
  description: string;
  icon: string;
  iconUrl: string;
}

interface QuoteData {
  id: string;
  content: string;
  author: string;
  tags: string[];
}

interface AiTipData {
  tip: string;
  provider: string;
  model: string;
}

interface GithubReportSection {
  title: string;
  body: string;
}

interface GithubReportData {
  generatedAt: string;
  provider: string;
  sections: GithubReportSection[];
  markdown: string;
}

interface GithubChatResponse {
  answer: string;
  provider: string;
  model?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ApiError {
  error?: string;
}

interface ChartPoint {
  name: string;
  value: number;
}

const githubUsernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const chartPalette = ['#0f766e', '#2563eb', '#7c3aed', '#ea580c', '#0891b2', '#be123c'];

async function fetchJson<T>(input: RequestInfo | URL) {
  const response = await fetch(input, { cache: 'no-store' });
  const payload = (await response.json()) as T | ApiError;

  if (!response.ok) {
    throw new Error((payload as ApiError).error ?? 'Something went wrong.');
  }

  return payload as T;
}

async function postJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json()) as T | ApiError;

  if (!response.ok) {
    throw new Error((payload as ApiError).error ?? 'Something went wrong.');
  }

  return payload as T;
}

function downloadTextFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(dateString));
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / (1000 * 60));

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function getContributionClass(count: number) {
  if (count <= 0) return 'bg-zinc-200 dark:bg-zinc-800';
  if (count <= 2) return 'bg-emerald-200 dark:bg-emerald-900/70';
  if (count <= 4) return 'bg-emerald-300 dark:bg-emerald-800/80';
  if (count <= 7) return 'bg-emerald-500/80 dark:bg-emerald-600/80';
  return 'bg-emerald-600 dark:bg-emerald-500';
}

function formatMonthLabel(dateString: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(dateString));
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const duration = 900;
    const startTime = performance.now();
    const startValue = 0;

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(startValue + (value - startValue) * eased);
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  return <span>{new Intl.NumberFormat('en-US').format(displayValue)}</span>;
}

function Card({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`card-surface ${className}`}>{children}</section>;
}

function SectionLabel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      </div>
    </div>
  );
}

function LoadingBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80 ${className}`} />;
}

function ErrorBlock({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 opacity-90">{message}</p>
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => mounted && setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
      aria-label="Toggle theme"
    >
      {!mounted ? <FiMoon className="size-4" /> : isDark ? <FiSun className="size-4" /> : <FiMoon className="size-4" />}
      {!mounted ? 'Theme' : isDark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}

function ContributionHeatmap({ weeks }: { weeks: ContributionWeek[] }) {
  const displayWeeks = weeks.slice(-53);
  const monthLabels = displayWeeks.map((week, index) => {
    const currentMonth = new Date(week.firstDay).getMonth();
    const previousMonth = index > 0 ? new Date(displayWeeks[index - 1]?.firstDay ?? week.firstDay).getMonth() : null;

    return previousMonth === currentMonth && index !== 0 ? '' : formatMonthLabel(week.firstDay);
  });
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const legendLevels = [0, 1, 3, 6, 9];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max rounded-[24px] border border-zinc-200/80 bg-white/75 p-3 dark:border-zinc-800 dark:bg-zinc-950/55 sm:p-4">
        <div
          className="mb-3 grid items-end gap-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 sm:gap-1 sm:text-[11px]"
          style={{ gridTemplateColumns: `24px repeat(${displayWeeks.length}, minmax(0, 10px))` }}
        >
          <span />
          {monthLabels.map((label, index) => (
            <span key={`${displayWeeks[index]?.firstDay}-month`} className="truncate">
              {label}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="grid w-6 grid-rows-7 gap-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 sm:w-8 sm:gap-1 sm:text-[11px]">
            {weekdayLabels.map((label, index) => (
              <span key={label} className="flex h-[10px] items-center sm:h-3">
                {index === 1 || index === 3 || index === 5 ? label : ''}
              </span>
            ))}
          </div>

          <div className="inline-flex gap-0.5 sm:gap-1">
            {displayWeeks.map((week) => (
              <div key={week.firstDay} className="flex flex-col gap-0.5 sm:gap-1">
                {week.contributionDays.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.contributionCount} contributions on ${formatDate(day.date, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}`}
                    className={`size-[10px] rounded-[2px] sm:size-3 sm:rounded-[3px] ${getContributionClass(day.contributionCount)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-xs text-zinc-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[18rem] sm:max-w-none">Review the visible contribution pattern across the current year.</p>
          <div className="inline-flex items-center gap-2 whitespace-nowrap">
            <span>Less</span>
            <div className="inline-flex gap-1">
              {legendLevels.map((value) => (
                <span key={value} className={`size-[10px] rounded-[2px] sm:size-3 sm:rounded-[3px] ${getContributionClass(value)}`} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const reportCardRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const usernameFieldRef = useRef<HTMLDivElement>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [searchedUsername, setSearchedUsername] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [repoPage, setRepoPage] = useState(1);
  const reposPerPage = 6;
  const [commitsPage, setCommitsPage] = useState(1);
  const commitsPerPage = 5;
  const [weatherInput, setWeatherInput] = useState('');
  const [city, setCity] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);
  const [quoteRefreshKey, setQuoteRefreshKey] = useState(0);
  const [aiRefreshKey, setAiRefreshKey] = useState(0);
  const [reportSeed, setReportSeed] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      content: 'Ask about the loaded GitHub profile or any broader software question. When a profile is loaded, the assistant will use the dashboard context in its answers.',
    },
  ]);
  const [chatting, setChatting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const savedUsername = window.localStorage.getItem('developer-dashboard:last-username') ?? '';
    const savedRecentSearches = window.localStorage.getItem('developer-dashboard:recent-usernames');
    const savedCity = window.localStorage.getItem('developer-dashboard:last-city') ?? '';

    if (savedUsername) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsernameInput(savedUsername);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchedUsername(savedUsername);
    }

    if (savedRecentSearches) {
      try {
        const parsedRecentSearches = JSON.parse(savedRecentSearches) as string[];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecentSearches(parsedRecentSearches.filter(Boolean).slice(0, 6));
      } catch {}
    }

    if (savedCity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWeatherInput(savedCity);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCity(savedCity);
    }
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!usernameFieldRef.current?.contains(event.target as Node)) {
        setIsSuggestionOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const githubQuery = useQuery({
    queryKey: ['github', searchedUsername, repoPage, reposPerPage],
    queryFn: () =>
      fetchJson<GithubApiData>(
        `/api/github?username=${encodeURIComponent(searchedUsername)}&page=${repoPage}&per_page=${reposPerPage}`,
      ),
    enabled: Boolean(searchedUsername),
  });

  const contributionsQuery = useQuery({
    queryKey: ['github-contributions', searchedUsername],
    queryFn: () =>
      fetchJson<ContributionsData>(`/api/github-graphql?username=${encodeURIComponent(searchedUsername)}`),
    enabled: Boolean(searchedUsername),
  });

  const weatherQuery = useQuery({
    queryKey: ['weather', city],
    queryFn: () => fetchJson<WeatherData>(`/api/weather?city=${encodeURIComponent(city)}`),
    enabled: Boolean(city),
  });

  const quoteQuery = useQuery({
    queryKey: ['quote', quoteRefreshKey],
    queryFn: () => fetchJson<QuoteData>(`/api/quote?seed=${quoteRefreshKey}`),
    staleTime: 1000 * 60 * 30,
    placeholderData: (previousData) => previousData,
  });

  const aiTipQuery = useQuery({
    queryKey: ['ai-tip', aiRefreshKey],
    queryFn: () => fetchJson<AiTipData>(`/api/ai-tip?seed=${aiRefreshKey}`),
    staleTime: 1000 * 60 * 60,
  });

  const languageData = useMemo<ChartPoint[]>(() => {
    const repos = githubQuery.data?.allRepos ?? githubQuery.data?.repos ?? [];
    const map = new Map<string, number>();

    repos.forEach((repo) => {
      const language = repo.language ?? 'Other';
      map.set(language, (map.get(language) ?? 0) + 1);
    });

    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [githubQuery.data?.repos]);

  const commitTrendData = useMemo<ChartPoint[]>(() => {
    const commits = githubQuery.data?.recentCommits ?? [];
    const dayMap = new Map<string, number>();

    commits.forEach((commit) => {
      const day = new Date(commit.committedAt).toISOString().slice(0, 10);
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    });

    return [...dayMap.entries()]
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, value]) => ({ name: formatDate(date), value }));
  }, [githubQuery.data?.recentCommits]);

  const totalContributionDays = useMemo(
    () =>
      (contributionsQuery.data?.weeks ?? []).reduce(
        (sum, week) => sum + week.contributionDays.filter((day) => day.contributionCount > 0).length,
        0,
      ),
    [contributionsQuery.data?.weeks],
  );

  const reportQuery = useQuery({
    queryKey: ['github-report', searchedUsername, reportSeed],
    enabled: Boolean(githubQuery.data?.user) && reportSeed > 0,
    queryFn: () =>
      postJson<GithubReportData>('/api/github-report', {
        method: 'POST',
        body: JSON.stringify({
          user: githubQuery.data?.user,
          repos: githubQuery.data?.allRepos ?? githubQuery.data?.repos ?? [],
          recentCommits: githubQuery.data?.recentCommits ?? [],
          contributions: {
            totalContributions: contributionsQuery.data?.totalContributions ?? 0,
            activeDays: totalContributionDays,
          },
          languages: languageData,
        }),
      }),
  });

  const usernameSuggestions = useMemo(() => {
    const query = usernameInput.trim().toLowerCase();

    if (!recentSearches.length) {
      return [];
    }

    if (!query) {
      return recentSearches.slice(0, 6);
    }

    return recentSearches
      .filter((username) => username.toLowerCase().includes(query))
      .slice(0, 6);
  }, [recentSearches, usernameInput]);

  const persistRecentSearch = (username: string) => {
    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
      return;
    }

    const nextRecentSearches = [
      normalizedUsername,
      ...recentSearches.filter((item) => item.toLowerCase() !== normalizedUsername.toLowerCase()),
    ].slice(0, 6);

    setRecentSearches(nextRecentSearches);
    window.localStorage.setItem('developer-dashboard:recent-usernames', JSON.stringify(nextRecentSearches));
  };

  const submitUsername = (username: string) => {
    const value = username.trim();

    if (!value) {
      setUsernameError('Enter a GitHub username to continue.');
      return;
    }

    if (!githubUsernameRegex.test(value)) {
      setUsernameError('Please enter a valid GitHub username.');
      return;
    }

    setUsernameError('');
    setUsernameInput(value);
    setSearchedUsername(value);
    setRepoPage(1);
    setCommitsPage(1);
    setIsSuggestionOpen(false);
    window.localStorage.setItem('developer-dashboard:last-username', value);
    persistRecentSearch(value);
  };

  const handleUsernameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitUsername(usernameInput);
  };

  const handleWeatherSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = weatherInput.trim();

    if (!value) {
      return;
    }

    setCity(value);
    window.localStorage.setItem('developer-dashboard:last-city', value);
  };

  const handleExport = async () => {
    if (!dashboardRef.current) {
      return;
    }

    try {
      setExporting(true);
      const { exportElementAsImage } = await import('../lib/utils/export-image');
      await exportElementAsImage(dashboardRef.current, {
        fileName: `${searchedUsername || 'developer'}-dashboard`,
        format: 'png',
        pixelRatio: 2,
      });
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    setReportSeed(Date.now());
  };

  const handleExportReportPdf = async () => {
    if (!reportQuery.data || !user) {
      return;
    }

    try {
      setExportingReport(true);
      const { exportGithubReportPdf } = await import('../lib/utils/export-report-pdf');
      await exportGithubReportPdf({
        fileName: `${searchedUsername || 'developer'}-github-report`,
        user,
        sections: reportQuery.data.sections,
        generatedAt: reportQuery.data.generatedAt,
        provider: reportQuery.data.provider,
        languageData,
        commitTrendData,
        totalContributions: contributionsQuery.data?.totalContributions ?? 0,
        totalContributionDays,
      });
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportReportImage = async () => {
    if (!reportCardRef.current) {
      return;
    }

    try {
      setExportingReport(true);
      const { exportElementAsImage } = await import('../lib/utils/export-image');
      await exportElementAsImage(reportCardRef.current, {
        fileName: `${searchedUsername || 'developer'}-github-report`,
        format: 'png',
        pixelRatio: 2,
      });
    } finally {
      setExportingReport(false);
    }
  };

  const handleChatSubmit = async (question?: string) => {
    const nextQuestion = (question ?? chatInput).trim();

    if (!nextQuestion) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: nextQuestion,
    };
    const nextMessages = [...chatMessages, userMessage].map(({ role, content }) => ({ role, content }));

    setChatMessages((current) => [...current, userMessage]);
    setChatInput('');
    setChatting(true);

    try {
      const response = await postJson<GithubChatResponse>('/api/github-chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: nextMessages,
          context: {
            user: user ?? null,
            repos: githubQuery.data?.allRepos ?? repos,
            recentCommits: commits,
            languages: languageData,
            totalContributions: contributionsQuery.data?.totalContributions ?? 0,
            activeContributionDays: totalContributionDays,
            reportSections: reportQuery.data?.sections ?? [],
          },
        }),
      });

      setChatMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
        },
      ]);
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content:
            error instanceof Error
              ? error.message
              : 'I could not answer that question right now.',
        },
      ]);
    } finally {
      setChatting(false);
    }
  };

  const user = githubQuery.data?.user;
  const repos = githubQuery.data?.repos ?? [];
  const commits = githubQuery.data?.recentCommits ?? [];
  const reposMeta = githubQuery.data?.meta;
  const pagedCommits = useMemo(() => {
    return commits.slice((commitsPage - 1) * commitsPerPage, commitsPage * commitsPerPage);
  }, [commits, commitsPage]);
  const contributionWeeks = contributionsQuery.data?.weeks ?? [];
  const navigationItems = [
    { label: 'Overview', href: '#overview' },
    { label: 'Repositories', href: '#repositories' },
    { label: 'Activity', href: '#activity' },
    { label: 'Insights', href: '#insights' },
    { label: 'Utilities', href: '#utilities' },
  ];
  const reportPreviewSections = reportQuery.data?.sections.slice(0, 2) ?? [];

  useEffect(() => {
    if (!chatScrollRef.current) {
      return;
    }

    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatMessages, chatting, isChatOpen]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,1),rgba(250,250,250,1))] text-zinc-950 dark:bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_24%),linear-gradient(180deg,rgba(9,9,11,1),rgba(3,7,18,1))] dark:text-white">
      <div className="grid min-h-screen w-full grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden xl:block xl:p-4 xl:pr-0">
          <div className="sticky top-4 h-[calc(100vh-2rem)] rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_20px_80px_rgba(2,6,23,0.08)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <FiGithub className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">AI-powered</p>
              <p className="text-base font-semibold">Developer Dashboard</p>
            </div>
          </div>

          <nav className="mt-8 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            {navigationItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block rounded-2xl border border-transparent px-4 py-3 transition hover:-translate-y-0.5 hover:border-zinc-200 hover:bg-white/80 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/80"
              >
                {item.label}
              </a>
            ))}
          </nav>

          </div>
        </aside>

        <section className="min-w-0 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 xl:px-6 2xl:px-8">
          <div ref={dashboardRef} className="w-full space-y-6">
          <header id="overview" className="section-anchor card-surface flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                Premium SaaS developer view
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Track GitHub activity, developer insights, and daily utilities in one dashboard.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                Search a GitHub profile, inspect repositories and commits, review contribution activity, and pair it with real-time weather, motivational quotes, and an AI coding tip.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-zinc-950"
              >
                {exporting ? <FiLoader className="size-4 animate-spin" /> : <FiDownload className="size-4" />}
                Export image
              </button>
            </div>
          </header>

          <Card className="animate-enter p-6">
              <div>
                <SectionLabel
                  title="GitHub profile lookup"
                  subtitle="Fetch profile details, repositories, commits, and contribution activity."
                />
                <form onSubmit={handleUsernameSubmit} className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div ref={usernameFieldRef} className="relative flex-1">
                      <FiSearch className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        value={usernameInput}
                        onChange={(event) => {
                          setUsernameInput(event.target.value);
                          setIsSuggestionOpen(true);
                        }}
                        onFocus={() => setIsSuggestionOpen(true)}
                        placeholder="Enter GitHub username"
                        className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                      />
                      {isSuggestionOpen && usernameSuggestions.length ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)] dark:border-zinc-800 dark:bg-zinc-950">
                          <div className="border-b border-zinc-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                            Recent searches
                          </div>
                          <div className="p-2">
                            {usernameSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => submitUsername(suggestion)}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                              >
                                <span className="truncate">{suggestion}</span>
                                {suggestion.toLowerCase() === searchedUsername.toLowerCase() ? (
                                  <span className="ml-3 text-xs text-zinc-400 dark:text-zinc-500">Current</span>
                                ) : null}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="submit"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-teal-700"
                    >
                      Analyze profile
                      <FiArrowRight className="size-4" />
                    </button>
                  </div>
                  <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                          Report Actions
                        </p>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          Generate a polished GitHub summary and export it as PDF or image.
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={() => void handleGenerateReport()}
                          disabled={reportQuery.isFetching || !user}
                          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {reportQuery.isFetching ? <FiLoader className="size-4 animate-spin" /> : <FiArrowRight className="size-4" />}
                          {reportQuery.data ? 'Regenerate report' : 'Generate report'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleExportReportPdf()}
                          disabled={!reportQuery.data || exportingReport}
                          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                        >
                          {exportingReport ? <FiLoader className="size-4 animate-spin" /> : <FiDownload className="size-4" />}
                          Export PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleExportReportImage()}
                          disabled={!reportQuery.data || exportingReport}
                          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                        >
                          {exportingReport ? <FiLoader className="size-4 animate-spin" /> : <FiDownload className="size-4" />}
                          Export image
                        </button>
                      </div>
                    </div>
                  </div>
                  {reportQuery.data ? (
                    <div className="report-preview-surface mt-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                            Report Ready
                          </p>
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                            Generated {formatDate(reportQuery.data.generatedAt, { month: 'short', day: 'numeric', year: 'numeric' })} from the current GitHub profile data.
                          </p>
                        </div>
                        <span className="tag-chip whitespace-nowrap">{reportQuery.data.provider} summary</span>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {reportPreviewSections.map((section) => (
                          <article
                            key={section.title}
                            className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60"
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                              {section.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                              {section.body}
                            </p>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-zinc-200/80 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      Generate a report to preview the summary directly in this panel before exporting.
                    </div>
                  )}
                  {usernameError ? <p className="text-sm text-red-600 dark:text-red-400">{usernameError}</p> : null}
                </form>
              </div>
          </Card>

          {searchedUsername ? (
            githubQuery.isLoading ? (
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="p-6">
                  <LoadingBlock className="h-40 w-full" />
                </Card>
                <Card className="p-6">
                  <LoadingBlock className="h-40 w-full" />
                </Card>
              </div>
            ) : githubQuery.error ? (
              <ErrorBlock title="GitHub request failed" message={githubQuery.error.message} />
            ) : user ? (
              <>
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <Card id="activity" className="section-anchor animate-enter p-6">
                    <div className="flex flex-col gap-8">
                      <a
                        href={user.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="profile-link-card"
                        aria-label={`Open ${user.login} GitHub profile`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          <Image
                            src={user.avatar_url}
                            alt={user.login}
                            width={88}
                            height={88}
                            unoptimized
                            className="size-20 rounded-[1.5rem] object-cover ring-4 ring-white shadow-lg dark:ring-zinc-900 sm:size-22 sm:rounded-[1.75rem]"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                              <h2 className="max-w-full text-xl font-semibold tracking-tight break-words sm:text-2xl">{user.name ?? user.login}</h2>
                              <span className="inline-flex max-w-full items-center gap-2 text-sm font-medium text-teal-700 transition break-all dark:text-teal-300">
                                @{user.login}
                                <FiExternalLink className="size-4" />
                              </span>
                            </div>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:leading-7">
                              {user.bio ?? 'No bio available for this profile.'}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                              {user.company ? <span className="tag-chip">{user.company}</span> : null}
                              {user.location ? <span className="tag-chip">{user.location}</span> : null}
                              {user.blog ? <span className="tag-chip">Portfolio available</span> : null}
                            </div>
                          </div>
                        </div>
                      </a>

                      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        <div className="metric-tile">
                          <p className="metric-label">Followers</p>
                          <p className="metric-value">
                            <AnimatedNumber value={user.followers} />
                          </p>
                        </div>
                        <div className="metric-tile">
                          <p className="metric-label">Following</p>
                          <p className="metric-value">
                            <AnimatedNumber value={user.following} />
                          </p>
                        </div>
                        <div className="metric-tile">
                          <p className="metric-label">Public repos</p>
                          <p className="metric-value">
                            <AnimatedNumber value={user.public_repos} />
                          </p>
                        </div>
                        <div className="metric-tile">
                          <p className="metric-label">Remaining calls</p>
                          <p className="metric-value text-xl">
                            {githubQuery.data?.meta.rateLimitRemaining ?? '--'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card id="insights" className="section-anchor animate-enter p-6">
                    <SectionLabel
                      title="Contribution activity"
                      subtitle="GitHub-style contribution calendar across the current year."
                    />
                    {contributionsQuery.isLoading ? (
                      <LoadingBlock className="h-36 w-full" />
                    ) : contributionsQuery.error ? (
                      <ErrorBlock
                        title="Contribution data failed"
                        message={contributionsQuery.error.message}
                      />
                    ) : (
                      <>
                        <div className="mb-5 flex items-end justify-between gap-4">
                          <div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Total contributions</p>
                            <p className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                              <AnimatedNumber value={contributionsQuery.data?.totalContributions ?? 0} />
                            </p>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Showing the current year</p>
                        </div>
                        <ContributionHeatmap weeks={contributionWeeks} />
                      </>
                    )}
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card id="repositories" className="section-anchor animate-enter p-6">
                    <SectionLabel
                      title="Language distribution"
                      subtitle="Repository languages across the current result set."
                    />
                    {languageData.length ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={languageData} dataKey="value" nameKey="name" innerRadius={72} outerRadius={110} paddingAngle={3}>
                              {languageData.map((entry, index) => (
                                <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                borderRadius: 16,
                                border: '1px solid rgba(113,113,122,0.2)',
                                background: 'rgba(24,24,27,0.92)',
                                color: '#fff',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">No repositories available yet.</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {languageData.map((item, index) => (
                        <span key={item.name} className="tag-chip" style={{ borderColor: chartPalette[index % chartPalette.length] }}>
                          {item.name} · {item.value}
                        </span>
                      ))}
                    </div>
                  </Card>

                  <Card className="animate-enter p-6">
                    <SectionLabel
                      title="Commit trend"
                      subtitle="Recent commits grouped by date from the freshest repositories."
                    />
                    {commitTrendData.length ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={commitTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(113,113,122,0.22)" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{
                                borderRadius: 16,
                                border: '1px solid rgba(113,113,122,0.2)',
                                background: 'rgba(24,24,27,0.92)',
                                color: '#fff',
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#0f766e"
                              strokeWidth={3}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">No commit activity available.</p>
                    )}
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <Card className="animate-enter p-6">
                    <SectionLabel
                      title="Top repositories"
                      subtitle="Repository metadata with stars, forks, language, and freshness."
                    />
                    <div className="space-y-4">
                      {repos.map((repo) => (
                        <article
                          key={repo.id}
                          className="rounded-3xl border border-zinc-200 bg-white/80 p-5 transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950/60"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <a
                                href={repo.html_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-base font-semibold text-zinc-950 transition hover:text-teal-700 dark:text-white dark:hover:text-teal-300"
                              >
                                {repo.name}
                              </a>
                              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                {repo.description ?? 'No repository description provided.'}
                              </p>
                            </div>
                            <span className="tag-chip whitespace-nowrap">{repo.language ?? 'Other'}</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-2">
                              <FiStar className="size-4" />
                              {repo.stargazers_count}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <FiGitBranch className="size-4" />
                              {repo.forks_count}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <FiUsers className="size-4" />
                              {repo.watchers_count} watchers
                            </span>
                            <span>Updated {formatRelativeDate(repo.updated_at)}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                    <Pagination
                      page={repoPage}
                      perPage={reposPerPage}
                      total={reposMeta?.totalRepos}
                      onPageChange={(p) => {
                        setRepoPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  </Card>

                  <Card className="animate-enter p-6">
                    <SectionLabel
                      title="Recent commits"
                      subtitle="Latest commit stream across the freshest repositories."
                    />
                    <div className="space-y-4">
                      {commits.length ? (
                        pagedCommits.map((commit) => (
                          <article
                            key={`${commit.repoName}-${commit.sha}`}
                            className="rounded-3xl border border-zinc-200 bg-white/80 p-4 transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950/60"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                                {commit.authorAvatar ? (
                                  <Image
                                    src={commit.authorAvatar}
                                    alt={commit.authorName}
                                    width={44}
                                    height={44}
                                    unoptimized
                                    className="size-11 rounded-2xl object-cover"
                                  />
                                ) : (
                                  <FiGithub className="size-5 text-zinc-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="tag-chip">{commit.repoName}</span>
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {formatRelativeDate(commit.committedAt)}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  {commit.message}
                                </p>
                                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                                  <span>{commit.authorName}</span>
                                  <a href={commit.htmlUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-300">
                                    View commit
                                    <FiExternalLink className="size-3.5" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">No recent commits available.</p>
                      )}
                    </div>
                    <Pagination
                      page={commitsPage}
                      perPage={commitsPerPage}
                      total={commits.length}
                      onPageChange={(p) => {
                        setCommitsPage(p);
                      }}
                    />
                  </Card>
                </div>
              </>
            ) : null
          ) : (
            <Card className="animate-enter p-10 text-center">
              <div className="mx-auto max-w-2xl">
                <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                  <FiGithub className="size-7" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight">Start with a GitHub username</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  The dashboard will load profile information, repositories, commit activity, and contribution insights once you submit a valid username.
                </p>
              </div>
            </Card>
          )}

          <div id="utilities" className="section-anchor grid gap-6 lg:grid-cols-3">
            <Card className="animate-enter p-6">
              <SectionLabel
                title="Weather"
                subtitle="Current city conditions for context while you work."
              />
              <form onSubmit={handleWeatherSubmit} className="mb-5 flex gap-3">
                <input
                  value={weatherInput}
                  onChange={(event) => setWeatherInput(event.target.value)}
                  placeholder="Enter city"
                  className="h-11 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
                >
                  Search
                </button>
              </form>

              {weatherQuery.isLoading ? (
                <LoadingBlock className="h-40 w-full" />
              ) : weatherQuery.error ? (
                <ErrorBlock title="Weather unavailable" message={weatherQuery.error.message} />
              ) : weatherQuery.data ? (
                <div className="rounded-3xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {weatherQuery.data.city}, {weatherQuery.data.country}
                      </p>
                      <p className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                        {Math.round(weatherQuery.data.temperature)}°
                      </p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 capitalize">
                        {weatherQuery.data.description}
                      </p>
                    </div>
                    <div className="flex size-16 items-center justify-center rounded-3xl bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                      <FiCloud className="size-8" />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                      <p className="text-zinc-500 dark:text-zinc-400">Feels</p>
                      <p className="mt-1 font-semibold">{Math.round(weatherQuery.data.feelsLike)}°</p>
                    </div>
                    <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                      <p className="text-zinc-500 dark:text-zinc-400">Humidity</p>
                      <p className="mt-1 font-semibold">{weatherQuery.data.humidity}%</p>
                    </div>
                    <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                      <p className="text-zinc-500 dark:text-zinc-400">Wind</p>
                      <p className="mt-1 font-semibold">{Math.round(weatherQuery.data.windSpeed)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Search a city to view current weather.</p>
              )}
            </Card>

            <Card className="animate-enter p-6">
              <SectionLabel title="Motivational quote" subtitle="A small reset for the workday." />
              {quoteQuery.isLoading && !quoteQuery.data ? (
                <LoadingBlock className="h-40 w-full" />
              ) : quoteQuery.error ? (
                <ErrorBlock title="Quote unavailable" message={quoteQuery.error.message} />
              ) : quoteQuery.data ? (
                <>
                  <div className="rounded-3xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <p className="text-lg leading-8 text-zinc-900 dark:text-zinc-100">“{quoteQuery.data.content}”</p>
                    <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">— {quoteQuery.data.author}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuoteRefreshKey(Date.now())}
                    disabled={quoteQuery.isFetching}
                    className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    <FiRefreshCcw className={`size-4 ${quoteQuery.isFetching ? 'animate-spin' : ''}`} />
                    {quoteQuery.isFetching ? 'Refreshing...' : 'Refresh quote'}
                  </button>
                </>
              ) : null}
            </Card>

            <Card className="animate-enter p-6">
              <SectionLabel
                title="AI coding tip"
                subtitle="A short practical tip generated for frontend developers."
              />
              {aiTipQuery.isLoading ? (
                <LoadingBlock className="h-40 w-full" />
              ) : aiTipQuery.error ? (
                <ErrorBlock title="AI tip unavailable" message={aiTipQuery.error.message} />
              ) : aiTipQuery.data ? (
                <>
                  <div className="rounded-3xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <p className="text-lg leading-8 text-zinc-900 dark:text-zinc-100">{aiTipQuery.data.tip}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                      {aiTipQuery.data.provider} · {aiTipQuery.data.model}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiRefreshKey(Date.now())}
                    className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    <FiRefreshCcw className="size-4" />
                    Regenerate tip
                  </button>
                </>
              ) : null}
            </Card>
          </div>

          </div>
        </section>
      </div>
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {isChatOpen ? (
          <div className="w-[calc(100vw-2rem)] max-w-[24rem] rounded-[28px] border border-white/10 bg-zinc-950/95 p-4 shadow-[0_28px_80px_rgba(2,6,23,0.45)] backdrop-blur">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">Dashboard AI chat</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Ask about the loaded profile or any broader question.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Close chat"
              >
                <FiX className="size-4" />
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {[
                'What is this developer strongest at?',
                'Which repositories stand out the most?',
                'Summarize the language stack.',
                'How active does this profile look?',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void handleChatSubmit(prompt)}
                  disabled={chatting}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div
              ref={chatScrollRef}
              className="max-h-[24rem] space-y-3 overflow-y-auto rounded-3xl border border-white/10 bg-black/20 p-3"
            >
              {chatMessages.map((message) => (
                <article
                  key={message.id}
                  className={`max-w-[88%] rounded-3xl p-4 text-sm leading-7 ${
                    message.role === 'assistant'
                      ? 'border border-white/10 bg-white/5 text-zinc-100'
                      : 'ml-auto bg-teal-600 text-white'
                  }`}
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
                    {message.role}
                  </p>
                  <p>{message.content}</p>
                </article>
              ))}
              {chatting ? (
                <div className="max-w-[88%] rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                  <div className="inline-flex items-center gap-2">
                    <FiLoader className="size-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              ) : null}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleChatSubmit();
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask anything..."
                disabled={chatting}
                className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={chatting || !chatInput.trim()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-zinc-950 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {chatting ? <FiLoader className="size-4 animate-spin" /> : <FiArrowRight className="size-4" />}
              </button>
            </form>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setIsChatOpen((current) => !current)}
          className="inline-flex size-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-[0_20px_50px_rgba(20,184,166,0.35)] transition hover:-translate-y-1 hover:bg-teal-500"
          aria-label="Open chat"
        >
          <FiMessageSquare className="size-6" />
        </button>
      </div>
    </main>
  );
}
