import { API_ROUTES } from "../constants/app";
import { getApiUrl, isServer } from "../config/env";

export type AiTipPayload = {
  title: string;
  tip: string;
  topic?: string;
  source?: string;
};

export type AiTipRequest = {
  topic?: string;
  focus?: string;
};

function buildUrl(path: string) {
  return isServer ? getApiUrl(path) : path;
}

export async function getAiTip(payload?: AiTipRequest) {
  const response = await fetch(buildUrl(API_ROUTES.aiTip), {
    method: payload ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "Unknown error");
    throw new Error(`AI tip request failed (${response.status}): ${message}`);
  }

  return (await response.json()) as AiTipPayload;
}
