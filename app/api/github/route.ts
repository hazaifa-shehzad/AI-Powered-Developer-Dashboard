import { NextRequest, NextResponse } from 'next/server';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

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

interface GithubCommitAuthor {
  name: string;
  email: string;
  date: string;
}

interface GithubCommitResponse {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: GithubCommitAuthor;
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
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

function getGithubHeaders() {
  const token = process.env.GITHUB_TOKEN;

  return {
    Accept: 'application/vnd.github+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function fetchGithubJson<T>(url: string): Promise<{ data: T; response: Response }> {
  const response = await fetch(url, {
    headers: getGithubHeaders(),
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`${response.status}:${errorPayload}`);
  }

  const data = (await response.json()) as T;
  return { data, response };
}

function isValidGithubUsername(username: string) {
  return GITHUB_USERNAME_REGEX.test(username.trim());
}

function getErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected GitHub API error.';
  const [statusCode] = message.split(':');

  if (statusCode === '404') {
    return NextResponse.json({ error: 'GitHub user not found.' }, { status: 404 });
  }

  if (statusCode === '403') {
    return NextResponse.json(
      {
        error:
          'GitHub API rate limit reached. Add GITHUB_TOKEN in .env.local for a higher limit and try again shortly.',
      },
      { status: 403 },
    );
  }

  return NextResponse.json(
    { error: 'Unable to fetch GitHub data at the moment.' },
    { status: 500 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.trim() ?? '';
    const page = Number(searchParams.get('page') ?? '1');
    const perPage = Math.min(Number(searchParams.get('per_page') ?? '8'), 12);

    if (!username) {
      return NextResponse.json({ error: 'username query parameter is required.' }, { status: 400 });
    }

    if (!isValidGithubUsername(username)) {
      return NextResponse.json({ error: 'Invalid GitHub username format.' }, { status: 400 });
    }

    const userUrl = `${GITHUB_API_BASE}/users/${username}`;
    const reposUrl = `${GITHUB_API_BASE}/users/${username}/repos?sort=updated&per_page=${perPage}&page=${page}`;

    const [{ data: user }, { data: repos, response: reposResponse }] = await Promise.all([
      fetchGithubJson<GithubUser>(userUrl),
      fetchGithubJson<GithubRepo[]>(reposUrl),
    ]);

    const commitSourceRepos = repos
      .filter((repo) => !repo.fork && !repo.archived)
      .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
      .slice(0, 3);

    const commitGroups = await Promise.all(
      commitSourceRepos.map(async (repo) => {
        try {
          const commitsUrl = `${GITHUB_API_BASE}/repos/${repo.full_name}/commits?per_page=5`;
          const { data } = await fetchGithubJson<GithubCommitResponse[]>(commitsUrl);

          return data.map<RecentCommit>((commit) => ({
            sha: commit.sha,
            htmlUrl: commit.html_url,
            repoName: repo.name,
            message: commit.commit.message.split('\n')[0]?.trim() ?? 'No commit message',
            authorName: commit.commit.author.name,
            authorAvatar: commit.author?.avatar_url ?? null,
            committedAt: commit.commit.author.date,
          }));
        } catch {
          return [];
        }
      }),
    );

    const recentCommits = commitGroups
      .flat()
      .sort((a, b) => new Date(b.committedAt).getTime() - new Date(a.committedAt).getTime())
      .slice(0, 12);

    const linkHeader = reposResponse.headers.get('link');
    const hasNextPage = typeof linkHeader === 'string' && linkHeader.includes('rel="next"');

    return NextResponse.json(
      {
        user,
        repos,
        recentCommits,
        meta: {
          page,
          perPage,
          hasNextPage,
          rateLimitRemaining: reposResponse.headers.get('x-ratelimit-remaining'),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return getErrorResponse(error);
  }
}
