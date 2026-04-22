import { z } from "zod";

export const githubUsernameSchema = z
  .string()
  .trim()
  .min(1, "GitHub username is required.")
  .max(39, "GitHub usernames cannot be longer than 39 characters.")
  .regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d]))*$/i, "Enter a valid GitHub username.");

export const weatherSearchSchema = z.object({
  city: z.string().trim().min(1, "City is required.").max(120),
});

export const coordinatesSchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lon: z.coerce.number().gte(-180).lte(180),
});

export const repoCommitsSchema = z.object({
  owner: z.string().trim().min(1),
  repo: z.string().trim().min(1),
  branch: z.string().trim().optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
});

export const aiTipRequestSchema = z.object({
  topic: z.string().trim().max(80).optional(),
  focus: z.string().trim().max(160).optional(),
});

export const exportImageSchema = z.object({
  fileName: z.string().trim().min(1).max(80).optional(),
  format: z.enum(["png", "jpeg"]).default("png"),
  quality: z.number().min(0.1).max(1).default(0.95),
  pixelRatio: z.number().min(1).max(4).default(2),
});

export type GithubUsernameInput = z.infer<typeof githubUsernameSchema>;
export type WeatherSearchInput = z.infer<typeof weatherSearchSchema>;
export type CoordinatesInput = z.infer<typeof coordinatesSchema>;
export type RepoCommitsInput = z.infer<typeof repoCommitsSchema>;
export type AiTipRequestInput = z.infer<typeof aiTipRequestSchema>;
export type ExportImageInput = z.infer<typeof exportImageSchema>;
