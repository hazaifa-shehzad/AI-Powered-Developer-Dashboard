'use client';

import { useQuery } from '@tanstack/react-query';
import { toPng } from 'html-to-image';
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
import {
  FiArrowRight,
  FiCloud,
  FiDownload,
  FiExternalLink,
  FiGitBranch,
  FiGithub,
  FiLoader,
  FiMoon,
  FiRefreshCcw,
  FiSearch,
  FiStar,
  FiSun,
  FiUsers,
} from 'react-icons/fi';
import { useTheme } from 'next-themes';

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
  recentCommits: RecentCommit[];
  meta: {
    page: number;
    perPage: number;
    hasNextPage: boolean;
    rateLimitRemaining: string | null;
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

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card-surface ${className}`}>{children}</section>;
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
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
    >
      {isDark ? <FiSun className="size-4" /> : <FiMoon className="size-4" />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}

function ContributionHeatmap({ weeks }: { weeks: ContributionWeek[] }) {
  const displayWeeks = weeks.slice(-24);

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1">
        {displayWeeks.map((week) => (
          <div key={week.firstDay} className="flex flex-col gap-1">
            {week.contributionDays.map((day) => (
              <div
                key={day.date}
                title={`${day.contributionCount} contributions on ${formatDate(day.date, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}`}
                className={`size-3 rounded-[4px] ${getContributionClass(day.contributionCount)}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [searchedUsername, setSearchedUsername] = useState('');
  const [weatherInput, setWeatherInput] = useState('');
  const [city, setCity] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const savedUsername = window.localStorage.getItem('developer-dashboard:last-username') ?? '';
    const savedCity = window.localStorage.getItem('developer-dashboard:last-city') ?? '';

    if (savedUsername) {
      setUsernameInput(savedUsername);
      setSearchedUsername(savedUsername);
    }

    if (savedCity) {
      setWeatherInput(savedCity);
      setCity(savedCity);
    }
  }, []);

  const githubQuery = useQuery({
    queryKey: ['github', searchedUsername],
    queryFn: () => fetchJson<GithubApiData>(`/api/github?username=${encodeURIComponent(searchedUsername)}`),
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
    queryKey: ['quote'],
    queryFn: () => fetchJson<QuoteData>('/api/quote'),
    staleTime: 1000 * 60 * 30,
  });

  const aiTipQuery = useQuery({
    queryKey: ['ai-tip'],
    queryFn: () => fetchJson<AiTipData>('/api/ai-tip'),
    staleTime: 1000 * 60 * 60,
  });

  const languageData = useMemo<ChartPoint[]>(() => {
    const repos = githubQuery.data?.repos ?? [];
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

  const handleUsernameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = usernameInput.trim();

    if (!value) {
      setUsernameError('Enter a GitHub username to continue.');
      return;
    }

    if (!githubUsernameRegex.test(value)) {
      setUsernameError('Please enter a valid GitHub username.');
      return;
    }

    setUsernameError('');
    setSearchedUsername(value);
    window.localStorage.setItem('developer-dashboard:last-username', value);
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
      const dataUrl = await toPng(dashboardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${searchedUsername || 'developer'}-dashboard.png`;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const user = githubQuery.data?.user;
  const repos = githubQuery.data?.repos ?? [];
  const commits = githubQuery.data?.recentCommits ?? [];
  const contributionWeeks = contributionsQuery.data?.weeks ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.08),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(250,250,250,1))] px-4 py-6 text-zinc-950 dark:bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_24%),linear-gradient(180deg,_rgba(9,9,11,1),_rgba(3,7,18,1))] dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_20px_80px_rgba(2,6,23,0.08)] backdrop-blur xl:block dark:border-white/10 dark:bg-zinc-950/60">
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
            {['Overview', 'Repositories', 'Activity', 'Insights', 'Utilities'].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-transparent px-4 py-3 transition hover:border-zinc-200 hover:bg-white/80 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/80"
              >
                {item}
              </div>
            ))}
          </nav>

          <div className="mt-10 rounded-3xl border border-zinc-200/70 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Portfolio-ready build
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Recharts analytics, animated stats, theme switching, export support, and API-driven modules.
            </p>
          </div>
        </aside>

        <div ref={dashboardRef} className="space-y-6">
          <header className="card-surface flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
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
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <SectionLabel
                  title="GitHub profile lookup"
                  subtitle="Fetch profile details, repositories, commits, and contribution activity."
                />
                <form onSubmit={handleUsernameSubmit} className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <FiSearch className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        value={usernameInput}
                        onChange={(event) => setUsernameInput(event.target.value)}
                        placeholder="Enter GitHub username"
                        className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-teal-700"
                    >
                      Analyze profile
                      <FiArrowRight className="size-4" />
                    </button>
                  </div>
                  {usernameError ? <p className="text-sm text-red-600 dark:text-red-400">{usernameError}</p> : null}
                </form>
              </div>

              <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/70">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  Included features
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                    GitHub REST
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                    GitHub GraphQL
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                    Weather API
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                    AI tip + quotes
                  </div>
                </div>
              </div>
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
                  <Card className="animate-enter p-6">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <img
                          crossOrigin="anonymous"
                          src={user.avatar_url}
                          alt={user.login}
                          className="size-20 rounded-3xl object-cover ring-4 ring-white dark:ring-zinc-900"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-semibold tracking-tight">{user.name ?? user.login}</h2>
                            <a
                              href={user.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-teal-700 transition hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
                            >
                              @{user.login}
                              <FiExternalLink className="size-4" />
                            </a>
                          </div>
                          <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                            {user.bio ?? 'No bio available for this profile.'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            {user.company ? <span className="tag-chip">{user.company}</span> : null}
                            {user.location ? <span className="tag-chip">{user.location}</span> : null}
                            {user.blog ? <span className="tag-chip">Portfolio available</span> : null}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:w-[260px]">
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

                  <Card className="animate-enter p-6">
                    <SectionLabel
                      title="Contribution activity"
                      subtitle="GitHub GraphQL contribution calendar for the current year."
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
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Showing latest 24 weeks</p>
                        </div>
                        <ContributionHeatmap weeks={contributionWeeks} />
                      </>
                    )}
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="animate-enter p-6">
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
                  </Card>

                  <Card className="animate-enter p-6">
                    <SectionLabel
                      title="Recent commits"
                      subtitle="Latest commit stream across the freshest repositories."
                    />
                    <div className="space-y-4">
                      {commits.length ? (
                        commits.map((commit) => (
                          <article
                            key={`${commit.repoName}-${commit.sha}`}
                            className="rounded-3xl border border-zinc-200 bg-white/80 p-4 transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950/60"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                                {commit.authorAvatar ? (
                                  <img
                                    crossOrigin="anonymous"
                                    src={commit.authorAvatar}
                                    alt={commit.authorName}
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

          <div className="grid gap-6 lg:grid-cols-3">
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
              {quoteQuery.isLoading ? (
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
                    onClick={() => quoteQuery.refetch()}
                    className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    <FiRefreshCcw className="size-4" />
                    Refresh quote
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
                    onClick={() => aiTipQuery.refetch()}
                    className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    <FiRefreshCcw className="size-4" />
                    Regenerate tip
                  </button>
                </>
              ) : null}
            </Card>
          </div>

          <Card className="animate-enter p-6">
            <SectionLabel
              title="Portfolio highlights"
              subtitle="This build is designed to read like a real SaaS product, not a generic practice dashboard."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                'Strict TypeScript-friendly API route separation',
                'React Query caching and graceful loading states',
                'Recharts-based visual analytics with clean styling',
                'Export-ready dashboard view with saved local state',
              ].map((item) => (
                <div key={item} className="rounded-3xl border border-zinc-200 bg-white/80 p-5 text-sm leading-7 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
