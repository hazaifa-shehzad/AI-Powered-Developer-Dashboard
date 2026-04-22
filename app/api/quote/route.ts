import { NextResponse } from 'next/server';

interface QuoteApiResponse {
  _id: string;
  content: string;
  author: string;
  tags: string[];
}

export async function GET() {
  try {
    const response = await fetch('https://api.quotable.io/random?maxLength=140', {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Unable to fetch quote.' }, { status: 502 });
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
    return NextResponse.json({ error: 'Unable to fetch quote.' }, { status: 500 });
  }
}
