import { NextRequest, NextResponse } from 'next/server';

interface QuoteApiResponse {
  _id: string;
  content: string;
  author: string;
  tags: string[];
}

const fallbackQuotes = [
  {
    id: 'fallback-01',
    content: 'Make it work, make it right, make it fast.',
    author: 'Kent Beck',
    tags: ['engineering', 'craft'],
  },
  {
    id: 'fallback-02',
    content: 'Simplicity is prerequisite for reliability.',
    author: 'Edsger W. Dijkstra',
    tags: ['software', 'simplicity'],
  },
  {
    id: 'fallback-03',
    content: 'First, solve the problem. Then, write the code.',
    author: 'John Johnson',
    tags: ['problem-solving', 'coding'],
  },
];

function getFallbackQuote(seed?: string | null) {
  const source = seed?.trim() || `${Date.now()}-${Math.random()}`;
  const hash = [...source].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return fallbackQuotes[hash % fallbackQuotes.length];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seed = searchParams.get('seed');

  try {
    const response = await fetch('https://api.quotable.io/random?maxLength=140', {
      cache: 'no-store',
      signal: AbortSignal.timeout(1800),
    });

    if (!response.ok) {
      return NextResponse.json(getFallbackQuote(seed), { status: 200 });
    }

    const quote = (await response.json()) as QuoteApiResponse;

    return NextResponse.json(
      {
        id: quote._id,
        content: quote.content,
        author: quote.author,
        tags: quote.tags,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(getFallbackQuote(seed), { status: 200 });
  }
}
