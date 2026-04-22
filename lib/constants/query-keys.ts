export const queryKeys = {
  github: {
    all: ["github"] as const,
    profile: (username: string) => ["github", "profile", username] as const,
    repos: (username: string) => ["github", "repos", username] as const,
    commits: (owner: string, repo: string) =>
      ["github", "commits", owner, repo] as const,
    contributions: (username: string) =>
      ["github", "contributions", username] as const,
    dashboard: (username: string) =>
      ["github", "dashboard", username] as const,
  },
  weather: {
    all: ["weather"] as const,
    city: (city: string) => ["weather", "city", city] as const,
    coordinates: (lat: number, lon: number) =>
      ["weather", "coordinates", lat, lon] as const,
  },
  quote: {
    daily: ["quote", "daily"] as const,
  },
  ai: {
    tip: (topic?: string) => ["ai", "tip", topic ?? "general"] as const,
  },
} as const;
