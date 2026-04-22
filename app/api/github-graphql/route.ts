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

function isValidGithubUsername(username: string) {
  return GITHUB_USERNAME_REGEX.test(username.trim());
}

export async function GET(request: NextRequest) {
  try {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          error:
            'GITHUB_TOKEN is missing. GitHub GraphQL contributions require a personal access token in .env.local.',
        },
        { status: 500 },
      );
    }

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
