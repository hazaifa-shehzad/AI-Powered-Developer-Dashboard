import { NextRequest, NextResponse } from 'next/server';

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

interface GraphqlContributionDay {
  contributionCount: number;
  date: string;
  weekday: number;
  color: string;
}

interface GraphqlContributionWeek {
  firstDay: string;
  contributionDays: GraphqlContributionDay[];
}

interface GraphqlResponse {
  data?: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: GraphqlContributionWeek[];
        };
      };
    } | null;
  };
  errors?: Array<{ message: string }>;
}

function buildEmptyContributionWeeks(weeksCount: number) {
  const weeks: GraphqlContributionWeek[] = [];
  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setUTCDate(today.getUTCDate() - today.getUTCDay());
  currentWeekStart.setUTCHours(0, 0, 0, 0);

  for (let weekIndex = weeksCount - 1; weekIndex >= 0; weekIndex -= 1) {
    const firstDay = new Date(currentWeekStart);
    firstDay.setUTCDate(currentWeekStart.getUTCDate() - weekIndex * 7);

    const contributionDays: GraphqlContributionDay[] = Array.from({ length: 7 }, (_, weekday) => {
      const date = new Date(firstDay);
      date.setUTCDate(firstDay.getUTCDate() + weekday);

      return {
        contributionCount: 0,
        date: date.toISOString().slice(0, 10),
        weekday,
        color: getContributionColor(0),
      };
    });

    weeks.push({
      firstDay: firstDay.toISOString().slice(0, 10),
      contributionDays,
    });
  }

  return weeks;
}

function getContributionColor(count: number) {
  if (count <= 0) return '#ebedf0';
  if (count <= 2) return '#9be9a8';
  if (count <= 4) return '#40c463';
  if (count <= 7) return '#30a14e';
  return '#216e39';
}

function buildWeeks(days: GraphqlContributionDay[]) {
  const weeks: GraphqlContributionWeek[] = [];

  for (let index = 0; index < days.length; index += 7) {
    const contributionDays = days.slice(index, index + 7);
    if (!contributionDays.length) continue;

    weeks.push({
      firstDay: contributionDays[0].date,
      contributionDays,
    });
  }

  return weeks;
}

async function fetchPublicContributionCalendar(username: string, from: string, to: string) {
  const response = await fetch(
    `https://github.com/users/${encodeURIComponent(username)}/contributions?from=${from}&to=${to}`,
    {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 300 },
    },
  );

  if (!response.ok) {
    return null;
  }

  const markup = await response.text();
  const matches = [...markup.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-count="(\d+)"/g)];

  if (!matches.length) {
    return null;
  }

  const days = matches.map((match) => {
    const date = match[1] ?? '';
    const contributionCount = Number(match[2] ?? '0');

    return {
      date,
      contributionCount,
      weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
      color: getContributionColor(contributionCount),
    };
  });

  return {
    totalContributions: days.reduce((sum, day) => sum + day.contributionCount, 0),
    weeks: buildWeeks(days),
    source: 'github-public',
  };
}

function isValidGithubUsername(username: string) {
  return GITHUB_USERNAME_REGEX.test(username.trim());
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.trim() ?? '';

    if (!username) {
      return NextResponse.json({ error: 'username query parameter is required.' }, { status: 400 });
    }

    if (!isValidGithubUsername(username)) {
      return NextResponse.json({ error: 'Invalid GitHub username format.' }, { status: 400 });
    }

    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
    const to = now.toISOString();
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      const publicCalendar = await fetchPublicContributionCalendar(username, from.slice(0, 10), to.slice(0, 10));

      if (publicCalendar) {
        return NextResponse.json(publicCalendar, { status: 200 });
      }

      return NextResponse.json(
        {
          totalContributions: 0,
          weeks: buildEmptyContributionWeeks(24),
          source: 'empty-fallback',
        },
        { status: 200 },
      );
    }

    const query = `
      query GetContributionCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks {
                firstDay
                contributionDays {
                  contributionCount
                  date
                  weekday
                  color
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          login: username,
          from,
          to,
        },
      }),
      next: { revalidate: 300 },
    });

    const payload = (await response.json()) as GraphqlResponse;

    if (!response.ok || payload.errors?.length) {
      const message = payload.errors?.[0]?.message ?? 'Unable to fetch contribution calendar.';
      return NextResponse.json({ error: message }, { status: response.status || 500 });
    }

    if (!payload.data?.user) {
      return NextResponse.json({ error: 'GitHub user not found.' }, { status: 404 });
    }

    const calendar = payload.data.user.contributionsCollection.contributionCalendar;

    return NextResponse.json(
      {
        totalContributions: calendar.totalContributions,
        weeks: calendar.weeks,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Unable to fetch GitHub contribution calendar.' },
      { status: 500 },
    );
  }
}
