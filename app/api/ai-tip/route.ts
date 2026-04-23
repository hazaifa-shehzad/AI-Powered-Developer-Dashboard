import { NextRequest, NextResponse } from 'next/server';

interface HuggingFaceResponseItem {
  generated_text?: string;
}

interface HuggingFaceError {
  error?: string;
}

const fallbackTips = [
  'Move derived UI state out of effects when you can compute it during render. Fewer effects means fewer stale-sync bugs.',
  'When rendering lists, keep keys stable across refreshes. Index keys are fine for static content, but they break stateful rows.',
  'Validate API input at the route boundary, not inside components. It keeps client code lean and makes failures easier to reason about.',
  'Prefer returning shaped fallback data from server routes over surfacing provider configuration errors directly in the UI.',
];

function cleanTip(rawText: string) {
  return rawText
    .replace(/^\s*(tip|answer)\s*[:\-]\s*/i, '')
    .replace(/^"|"$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getFallbackTip(topic?: string | null, seed?: string | null) {
  const key = `${topic ?? ''}-${seed ?? `${Date.now()}-${Math.random()}`}`;
  const hash = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return fallbackTips[hash % fallbackTips.length];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic')?.trim() ?? null;
  const seed = searchParams.get('seed');

  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const model = process.env.HUGGINGFACE_MODEL ?? 'google/flan-t5-large';
    const fallbackTip = getFallbackTip(topic, seed);

    if (!apiKey) {
      return NextResponse.json(
        {
          tip: fallbackTip,
          provider: 'local',
          model: 'curated-fallback',
        },
        { status: 200 },
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
        {
          tip: errorMessage ? cleanTip(errorMessage) || fallbackTip : fallbackTip,
          provider: 'local',
          model: 'curated-fallback',
        },
        { status: 200 },
      );
    }

    const rawTip = Array.isArray(payload) ? payload[0]?.generated_text ?? '' : '';
    const generatedTip = cleanTip(rawTip);

    if (!generatedTip) {
      return NextResponse.json(
        {
          tip: fallbackTip,
          provider: 'local',
          model: 'curated-fallback',
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        tip: generatedTip,
        provider: 'huggingface',
        model,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        tip: getFallbackTip(topic, seed),
        provider: 'local',
        model: 'curated-fallback',
      },
      { status: 200 },
    );
  }
}
