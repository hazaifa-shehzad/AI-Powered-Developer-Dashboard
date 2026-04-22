import { NextResponse } from 'next/server';

interface HuggingFaceResponseItem {
  generated_text?: string;
}

interface HuggingFaceError {
  error?: string;
}

function cleanTip(rawText: string) {
  return rawText
    .replace(/^\s*(tip|answer)\s*[:\-]\s*/i, '')
    .replace(/^"|"$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET() {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const model = process.env.HUGGINGFACE_MODEL ?? 'google/flan-t5-large';

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'HUGGINGFACE_API_KEY is missing in .env.local. Add it to enable AI-generated coding tips.',
        },
        { status: 500 },
      );
    }

    const prompt =
      'Give one short, practical coding tip for React developers. Keep it under 35 words and make it immediately actionable.';

    const response = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 60,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
      cache: 'no-store',
    });

    const payload = (await response.json()) as HuggingFaceResponseItem[] | HuggingFaceError;

    if (!response.ok) {
      const errorMessage = !Array.isArray(payload) ? payload.error : undefined;
      return NextResponse.json(
        { error: errorMessage ?? 'Unable to generate AI coding tip.' },
        { status: response.status },
      );
    }

    const rawTip = Array.isArray(payload) ? payload[0]?.generated_text ?? '' : '';
    const tip = cleanTip(rawTip);

    if (!tip) {
      return NextResponse.json(
        { error: 'AI provider returned an empty tip. Try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        tip,
        provider: 'huggingface',
        model,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Unable to generate AI coding tip.' }, { status: 500 });
  }
}
