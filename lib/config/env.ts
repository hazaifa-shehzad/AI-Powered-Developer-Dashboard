import { z } from "zod";

const clientEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Developer Dashboard"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEFAULT_GITHUB_USERNAME: z.string().min(1).default("octocat"),
  NEXT_PUBLIC_DEFAULT_WEATHER_CITY: z.string().min(1).default("Islamabad"),
});

const serverEnvSchema = z.object({
  GITHUB_TOKEN: z.string().min(1).optional(),
  GITHUB_GRAPHQL_TOKEN: z.string().min(1).optional(),
  OPENWEATHER_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  QUOTES_API_URL: z.string().url().optional(),
  QUOTES_API_KEY: z.string().min(1).optional(),
  VERCEL_URL: z.string().optional(),
});

const clientInput = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_DEFAULT_GITHUB_USERNAME: process.env.NEXT_PUBLIC_DEFAULT_GITHUB_USERNAME,
  NEXT_PUBLIC_DEFAULT_WEATHER_CITY: process.env.NEXT_PUBLIC_DEFAULT_WEATHER_CITY,
};

const serverInput = {
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_GRAPHQL_TOKEN: process.env.GITHUB_GRAPHQL_TOKEN,
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  QUOTES_API_URL: process.env.QUOTES_API_URL,
  QUOTES_API_KEY: process.env.QUOTES_API_KEY,
  VERCEL_URL: process.env.VERCEL_URL,
};

export const clientEnv = clientEnvSchema.parse(clientInput);

export const serverEnv =
  typeof window === "undefined" ? serverEnvSchema.parse(serverInput) : null;

export const env = {
  ...clientEnv,
  ...(serverEnv ?? {}),
};

export const isServer = typeof window === "undefined";
export const isProduction = clientEnv.NODE_ENV === "production";

export function getBaseUrl() {
  if (!isServer) return "";

  if (serverEnv?.VERCEL_URL) {
    return `https://${serverEnv.VERCEL_URL}`;
  }

  return clientEnv.NEXT_PUBLIC_APP_URL;
}

export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = getBaseUrl();

  return `${baseUrl}${normalizedPath}`;
}
