import { NextRequest, NextResponse } from 'next/server';

interface GithubChatUser {
  login: string;
  name: string | null;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  location: string | null;
  company: string | null;
}

interface GithubChatRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

interface GithubChatCommit {
  repoName: string;
  message: string;
  committedAt: string;
}

interface GithubChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GithubChatPayload {
  messages: GithubChatMessage[];
  context?: {
    user?: GithubChatUser | null;
    repos: GithubChatRepo[];
    recentCommits: GithubChatCommit[];
    languages: Array<{ name: string; value: number }>;
    totalContributions: number;
    activeContributionDays: number;
    reportSections?: Array<{ title: string; body: string }>;
  };
}

interface OpenAIResponsesApiPayload {
  output_text?: string;
  output?: Array<{
    type?: string;
    role?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
}

interface ChatCompletionPayload {
  choices?: Array<{
    message?: {
      content?: string;
      role?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

function hasUsableSecret(value?: string | null) {
  const normalized = value?.trim();

  if (!normalized) {
    return false;
  }

  const lowerCased = normalized.toLowerCase();
  return !lowerCased.includes('your_') && !lowerCased.endsWith('_here');
}

function buildDashboardInstructions() {
  return [
    'You are the dashboard assistant inside a GitHub developer dashboard.',
    'You can answer broad general questions like a normal chat assistant.',
    'When GitHub profile context is provided, use it for profile-specific questions.',
    'Do not invent GitHub facts that are not present in the provided context.',
    'If the user asks a non-GitHub question, answer normally and do not force the reply back to GitHub.',
    'Keep answers concise, direct, and professional.',
  ].join(' ');
}

function buildFallbackAnswer(payload: GithubChatPayload) {
  const latestUserMessage = payload.messages.filter((message) => message.role === 'user').at(-1)?.content.toLowerCase() ?? '';
  const user = payload.context?.user ?? null;
  const topLanguages = payload.context?.languages?.slice(0, 3) ?? [];
  const topRepos = [...(payload.context?.repos ?? [])]
    .sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }

      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    })
    .slice(0, 3);
  const displayName = user?.name ?? user?.login ?? 'The loaded profile';

  const isGreeting =
    ['hi', 'hello', 'hey', 'yo', 'salam', 'assalamualaikum'].some((token) =>
      latestUserMessage === token || latestUserMessage.startsWith(`${token} `),
    );
  const isGeneralQuestion =
    /\bhow are you\b/.test(latestUserMessage) ||
    /\bwho are you\b/.test(latestUserMessage) ||
    /\bwhat can you do\b/.test(latestUserMessage) ||
    /\bthank you\b/.test(latestUserMessage) ||
    /\bthanks\b/.test(latestUserMessage) ||
    /\bbye\b/.test(latestUserMessage) ||
    /\bgood morning\b/.test(latestUserMessage) ||
    /\bgood evening\b/.test(latestUserMessage) ||
    /\bgood night\b/.test(latestUserMessage) ||
    latestUserMessage.includes('what is') ||
    latestUserMessage.includes('how to') ||
    latestUserMessage.includes('how are') ||
    latestUserMessage.includes('why') ||
    latestUserMessage.includes('who are') ||
    latestUserMessage.includes('what can you') ||
    latestUserMessage.includes('explain') ||
    latestUserMessage.includes('tell me about') ||
    latestUserMessage.includes('can you help');

  if (isGreeting) {
    return 'Hello. I can analyze the loaded GitHub profile and answer questions about repositories, languages, activity, and portfolio positioning. For broader general AI chat, configure HUGGINGFACE_API_KEY or OPENAI_API_KEY in .env.local.';
  }

  if (/\bhow are you\b/.test(latestUserMessage)) {
    return 'I am working normally. In the current fallback mode, I can answer GitHub dashboard questions well, but full general conversation requires a configured AI provider key in .env.local.';
  }

  if (/\bwho are you\b/.test(latestUserMessage) || /\bwhat can you do\b/.test(latestUserMessage)) {
    return 'I am the dashboard assistant. I can analyze the loaded GitHub profile, repositories, languages, commits, contributions, and generated report; with HUGGINGFACE_API_KEY or OPENAI_API_KEY configured, I can also behave like a broader AI chatbot.';
  }

  if (/\bthank you\b/.test(latestUserMessage) || /\bthanks\b/.test(latestUserMessage)) {
    return 'You are welcome. Ask about the loaded GitHub profile, or enable an AI provider key for broader conversation.';
  }

  if (latestUserMessage.includes('language') || latestUserMessage.includes('stack') || latestUserMessage.includes('tech')) {
    return topLanguages.length
      ? `${displayName} is most visibly working with ${topLanguages.map((item) => `${item.name} (${item.value} repos)`).join(', ')} based on the repositories currently loaded in the dashboard.`
      : 'There is no strong language signal available from the currently loaded repositories.';
  }

  if (latestUserMessage.includes('repo') || latestUserMessage.includes('project') || latestUserMessage.includes('stand out')) {
    return topRepos.length
      ? `The strongest visible repositories right now are ${topRepos.map((repo) => `${repo.name}${repo.language ? ` (${repo.language})` : ''}`).join(', ')} based on public engagement and recent activity.`
      : 'There are no clear standout repositories in the current result set.';
  }

  if (latestUserMessage.includes('active') || latestUserMessage.includes('activity') || latestUserMessage.includes('commit') || latestUserMessage.includes('contribution')) {
    return `${displayName} has ${payload.context?.totalContributions ?? 0} visible contributions this year across ${payload.context?.activeContributionDays ?? 0} active contribution days, and the recent commit stream suggests how current the visible work is.`;
  }

  if (isGeneralQuestion) {
    return 'Right now this assistant is running in dashboard-only fallback mode, so it can answer profile-grounded questions from the loaded GitHub data. To make it behave like a full general chatbot as well, add HUGGINGFACE_API_KEY or OPENAI_API_KEY in .env.local and restart the app.';
  }

  const overview = payload.context?.reportSections?.find((section) => section.title.toLowerCase() === 'overview')?.body;
  if (overview) {
    return overview;
  }

  if (user) {
    return `${displayName} has ${user.public_repos} public repositories and the strongest visible signals in this dashboard are ${topLanguages.map((item) => item.name).join(', ') || 'their public repositories and activity'}.`;
  }

  return 'I can help with general questions, and if you load a GitHub profile I can also answer using the dashboard data.';
}

function extractOpenAIOutputText(payload: OpenAIResponsesApiPayload) {
  if (payload.output_text?.trim()) {
    return payload.output_text.trim();
  }

  const text = payload.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n')
    .trim();

  return text || null;
}

function extractChatCompletionText(payload: ChatCompletionPayload) {
  const text = payload.choices?.[0]?.message?.content?.trim();
  return text || null;
}

async function answerWithHuggingFace(payload: GithubChatPayload) {
  const apiKey = process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN;
  const model = process.env.HUGGINGFACE_CHAT_MODEL ?? 'google/gemma-2-2b-it';

  if (!hasUsableSecret(apiKey)) {
    return null;
  }

  const recentMessages = payload.messages.slice(-10);
  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `${buildDashboardInstructions()} Dashboard context: ${JSON.stringify({
            user: payload.context?.user ?? null,
            languages: payload.context?.languages?.slice(0, 6) ?? [],
            topRepos: payload.context?.repos?.slice(0, 12) ?? [],
            recentCommits: payload.context?.recentCommits?.slice(0, 8) ?? [],
            totalContributions: payload.context?.totalContributions ?? 0,
            activeContributionDays: payload.context?.activeContributionDays ?? 0,
            reportSections: payload.context?.reportSections ?? [],
          })}`,
        },
        ...recentMessages,
      ],
      max_tokens: 400,
      temperature: 0.5,
    }),
    cache: 'no-store',
  });

  const result = (await response.json()) as ChatCompletionPayload;

  if (!response.ok) {
    throw new Error(result.error?.message ?? 'Hugging Face could not answer the question.');
  }

  const answer = extractChatCompletionText(result);

  if (!answer) {
    throw new Error('Hugging Face returned an empty response. Try again.');
  }

  return {
    answer,
    provider: 'huggingface',
    model,
  };
}

async function answerWithOpenAI(payload: GithubChatPayload) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_CHAT_MODEL ?? 'gpt-5-mini';

  if (!hasUsableSecret(apiKey)) {
    return null;
  }

  const recentMessages = payload.messages.slice(-10);
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      instructions: buildDashboardInstructions(),
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text: `Dashboard context: ${JSON.stringify({
                user: payload.context?.user ?? null,
                languages: payload.context?.languages?.slice(0, 6) ?? [],
                topRepos: payload.context?.repos?.slice(0, 12) ?? [],
                recentCommits: payload.context?.recentCommits?.slice(0, 8) ?? [],
                totalContributions: payload.context?.totalContributions ?? 0,
                activeContributionDays: payload.context?.activeContributionDays ?? 0,
                reportSections: payload.context?.reportSections ?? [],
              })}`,
            },
          ],
        },
        ...recentMessages.map((message) => ({
          role: message.role,
          content: [
            {
              type: 'input_text',
              text: message.content,
            },
          ],
        })),
      ],
      max_output_tokens: 400,
      text: {
        format: {
          type: 'text',
        },
      },
    }),
    cache: 'no-store',
  });

  const result = (await response.json()) as OpenAIResponsesApiPayload;

  if (!response.ok) {
    throw new Error(result.error?.message ?? 'OpenAI could not answer the question.');
  }

  const answer = extractOpenAIOutputText(result);

  if (!answer) {
    throw new Error('OpenAI returned an empty response. Try again.');
  }

  return {
    answer,
    provider: 'openai',
    model,
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as GithubChatPayload;

    if (!payload.messages?.length) {
      return NextResponse.json({ error: 'Chat history is required.' }, { status: 400 });
    }

    try {
      const huggingFaceResult = await answerWithHuggingFace(payload);
      if (huggingFaceResult) {
        return NextResponse.json(huggingFaceResult, { status: 200 });
      }
    } catch (error) {
      if (hasUsableSecret(process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN)) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Hugging Face could not answer the question.' },
          { status: 502 },
        );
      }
    }

    try {
      const openAiResult = await answerWithOpenAI(payload);
      if (openAiResult) {
        return NextResponse.json(openAiResult, { status: 200 });
      }
    } catch (error) {
      if (hasUsableSecret(process.env.OPENAI_API_KEY)) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'OpenAI could not answer the question.' },
          { status: 502 },
        );
      }
    }

    return NextResponse.json(
      {
        answer: buildFallbackAnswer(payload),
        provider: 'local',
        model: 'dashboard-fallback',
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Unable to answer the question right now.' }, { status: 500 });
  }
}
