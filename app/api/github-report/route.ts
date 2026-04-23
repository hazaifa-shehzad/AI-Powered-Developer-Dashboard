import { NextRequest, NextResponse } from 'next/server';

interface GithubReportUser {
  login: string;
  name: string | null;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  location: string | null;
  company: string | null;
  blog: string | null;
}

interface GithubReportRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
}

interface GithubReportCommit {
  repoName: string;
  message: string;
  committedAt: string;
}

interface GithubReportPayload {
  user: GithubReportUser;
  repos: GithubReportRepo[];
  recentCommits: GithubReportCommit[];
  contributions: {
    totalContributions: number;
    activeDays: number;
  };
  languages: Array<{ name: string; value: number }>;
}

interface ReportSection {
  title: string;
  body: string;
}

interface HuggingFaceResponseItem {
  generated_text?: string;
}

interface HuggingFaceError {
  error?: string;
}

function getTopRepos(repos: GithubReportRepo[]) {
  return [...repos]
    .sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }

      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    })
    .slice(0, 3);
}

function getCommitRecencySummary(commits: GithubReportCommit[]) {
  if (!commits.length) {
    return 'Recent public commit activity is limited in the fetched repositories.';
  }

  const latestCommit = commits
    .map((commit) => new Date(commit.committedAt).getTime())
    .sort((a, b) => b - a)[0];

  const daysSinceLatest = Math.max(0, Math.round((Date.now() - latestCommit) / 86_400_000));

  if (daysSinceLatest <= 3) {
    return 'The profile shows very recent commit activity, which signals ongoing hands-on development.';
  }

  if (daysSinceLatest <= 14) {
    return 'The profile shows recent commit activity within the last two weeks.';
  }

  return 'The public repositories do not show very recent commit activity, so freshness is harder to judge from the current result set.';
}

function buildFallbackSections(payload: GithubReportPayload): ReportSection[] {
  const topLanguages = payload.languages.slice(0, 4);
  const topRepos = getTopRepos(payload.repos);
  const forkCount = payload.repos.filter((repo) => repo.forks_count > 0).length;
  const starredCount = payload.repos.filter((repo) => repo.stargazers_count > 0).length;

  return [
    {
      title: 'Overview',
      body:
        `${payload.user.name ?? payload.user.login} has ${payload.user.public_repos} public repositories, ` +
        `${payload.user.followers} followers, and ${payload.contributions.totalContributions} visible contributions in the current year. ` +
        `${payload.user.bio ?? 'The profile bio is concise, so the repositories carry most of the portfolio signal.'}`,
    },
    {
      title: 'Languages',
      body: topLanguages.length
        ? `The profile is centered around ${topLanguages.map((language) => `${language.name} (${language.value} repos)`).join(', ')}. This suggests the strongest visible experience is concentrated in those stacks rather than spread thin across many unrelated technologies.`
        : 'No dominant repository language stands out from the current result set.',
    },
    {
      title: 'Repository Signals',
      body:
        `${starredCount} repositories have stars and ${forkCount} repositories have forks in the fetched set. ` +
        (topRepos.length
          ? `The strongest showcase candidates are ${topRepos.map((repo) => `${repo.name}${repo.language ? ` (${repo.language})` : ''}`).join(', ')}.`
          : 'There are no obvious standout repositories by public engagement in the current result set.'),
    },
    {
      title: 'Activity',
      body:
        `${getCommitRecencySummary(payload.recentCommits)} ` +
        `${payload.contributions.activeDays} contribution days were visible in the current-year calendar, which helps indicate consistency rather than single-day spikes.`,
    },
    {
      title: 'Portfolio Summary',
      body:
        'Overall, the profile reads best when presented as a focused engineering portfolio: emphasize the strongest repositories, highlight the main language stack, and pair the public activity signal with short project case studies that explain outcomes and technical decisions.',
    },
  ];
}

function buildMarkdown(username: string, sections: ReportSection[]) {
  return [
    `# GitHub Report: ${username}`,
    '',
    ...sections.flatMap((section) => [`## ${section.title}`, section.body, '']),
  ].join('\n');
}

function cleanReportText(rawText: string) {
  return rawText
    .replace(/^```(?:markdown)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function parseAiReport(rawText: string): ReportSection[] | null {
  const normalized = cleanReportText(rawText);
  const blocks = normalized
    .split(/\n(?=##\s+)/)
    .map((block) => block.trim())
    .filter(Boolean);

  const sections = blocks
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      const heading = lines.shift();

      if (!heading?.startsWith('## ')) {
        return null;
      }

      return {
        title: heading.replace(/^##\s+/, ''),
        body: lines.join(' '),
      };
    })
    .filter((section): section is ReportSection => Boolean(section?.title && section.body));

  return sections.length ? sections : null;
}

async function generateAiSections(payload: GithubReportPayload) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HUGGINGFACE_MODEL ?? 'google/flan-t5-large';

  if (!apiKey) {
    return null;
  }

  const topRepos = getTopRepos(payload.repos).map((repo) => ({
    name: repo.name,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    description: repo.description,
  }));

  const prompt = [
    'Write a short GitHub profile report in markdown.',
    'Use exactly these sections and headings:',
    '## Overview',
    '## Languages',
    '## Repository Signals',
    '## Activity',
    '## Portfolio Summary',
    'Keep each section to 2 sentences max.',
    'Be specific and professional. Do not invent data.',
    `Profile data: ${JSON.stringify({
      user: payload.user,
      languages: payload.languages.slice(0, 5),
      topRepos,
      recentCommits: payload.recentCommits.slice(0, 5),
      contributions: payload.contributions,
    })}`,
  ].join('\n');

  const response = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 320,
        temperature: 0.6,
        return_full_text: false,
      },
    }),
    cache: 'no-store',
  });

  const payloadResponse = (await response.json()) as HuggingFaceResponseItem[] | HuggingFaceError;

  if (!response.ok || !Array.isArray(payloadResponse)) {
    return null;
  }

  const generatedText = payloadResponse[0]?.generated_text ?? '';
  return parseAiReport(generatedText);
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as GithubReportPayload;

    if (!payload?.user?.login) {
      return NextResponse.json({ error: 'A valid GitHub payload is required.' }, { status: 400 });
    }

    const aiSections = await generateAiSections(payload);
    const sections = aiSections ?? buildFallbackSections(payload);
    const markdown = buildMarkdown(payload.user.login, sections);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        provider: aiSections ? 'huggingface' : 'local',
        sections,
        markdown,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Unable to generate GitHub report.' }, { status: 500 });
  }
}
