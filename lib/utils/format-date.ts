import { DATE_FORMATS } from "../constants/app";

export function formatDate(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = DATE_FORMATS.long,
  locale = "en-US",
) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatShortDate(value: string | number | Date, locale = "en-US") {
  return formatDate(value, DATE_FORMATS.short, locale);
}

export function formatDateTime(value: string | number | Date, locale = "en-US") {
  return formatDate(value, DATE_FORMATS.full, locale);
}

export function formatRelativeTime(
  value: string | number | Date,
  now: number = Date.now(),
  locale = "en-US",
) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  const diffMs = date.getTime() - now;
  const diffSeconds = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const thresholds = [
    { unit: "year", seconds: 60 * 60 * 24 * 365 },
    { unit: "month", seconds: 60 * 60 * 24 * 30 },
    { unit: "week", seconds: 60 * 60 * 24 * 7 },
    { unit: "day", seconds: 60 * 60 * 24 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "minute", seconds: 60 },
  ] as const;

  for (const threshold of thresholds) {
    if (Math.abs(diffSeconds) >= threshold.seconds) {
      return rtf.format(
        Math.round(diffSeconds / threshold.seconds),
        threshold.unit,
      );
    }
  }

  return rtf.format(diffSeconds, "second");
}
