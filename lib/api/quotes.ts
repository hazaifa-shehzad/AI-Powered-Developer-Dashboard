import { API_ROUTES } from "../constants/app";
import { getApiUrl, isServer } from "../config/env";

export type QuotePayload = {
  content: string;
  author: string;
  tags?: string[];
};

function buildUrl(path: string) {
  return isServer ? getApiUrl(path) : path;
}

type NextFetchOptions = {
  revalidate?: number;
  tags?: string[];
};

export async function getDailyQuote(next?: NextFetchOptions) {
  const response = await fetch(buildUrl(API_ROUTES.quote), {
    headers: {
      Accept: "application/json",
    },
    next: next ?? { revalidate: 3600 },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "Unknown error");
    throw new Error(`Quote request failed (${response.status}): ${message}`);
  }

  return (await response.json()) as QuotePayload;
}
