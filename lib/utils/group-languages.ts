export type LanguageSource = {
  language?: string | null;
  size?: number | null;
  stars?: number | null;
};

export type LanguageStat = {
  name: string;
  value: number;
  repoCount: number;
  stars: number;
};

export function groupLanguages(items: LanguageSource[]) {
  const map = new Map<string, LanguageStat>();

  for (const item of items) {
    const name = item.language?.trim() || "Other";
    const current = map.get(name) ?? {
      name,
      value: 0,
      repoCount: 0,
      stars: 0,
    };

    current.value += item.size ?? 0;
    current.repoCount += 1;
    current.stars += item.stars ?? 0;

    map.set(name, current);
  }

  return [...map.values()].sort((a, b) => b.value - a.value);
}
