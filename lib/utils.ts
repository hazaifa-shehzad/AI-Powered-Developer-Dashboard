export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(value: string | number | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(value));
}

export function formatRelativeTime(value: string | number | Date) {
  const date = new Date(value).getTime();
  const diff = date - Date.now();
  const abs = Math.abs(diff);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["week", 1000 * 60 * 60 * 24 * 7],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const [unit, unitMs] of units) {
    if (abs >= unitMs || unit === "minute") {
      return rtf.format(Math.round(diff / unitMs), unit);
    }
  }

  return "just now";
}

export function getInitials(name?: string | null) {
  if (!name) return "NA";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getLanguageColor(language?: string | null) {
  const map: Record<string, string> = {
    TypeScript: "bg-sky-500",
    JavaScript: "bg-amber-400",
    Python: "bg-emerald-500",
    Go: "bg-cyan-500",
    Rust: "bg-orange-500",
    Java: "bg-red-500",
    HTML: "bg-orange-400",
    CSS: "bg-blue-500",
    Shell: "bg-zinc-500",
  };

  return map[language ?? ""] ?? "bg-violet-500";
}
