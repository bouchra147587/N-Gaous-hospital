import type { Locale } from "@/lib/i18n";

/** Day labels indexed by JS getDay() (0 = Sunday ... 6 = Saturday) - same convention as the backend. */
export const DAY_LABELS: Record<Locale, string[]> = {
  ar: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

/** "0,1,2" -> [0,1,2] */
export function parseWorkingDays(csv: string | null | undefined): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

/** Compact label: [0..4] -> "الأحد – الخميس", all 7 -> "كل الأيام". */
export function formatWorkingDays(days: number[], locale: Locale): string {
  if (days.length === 0) return "";
  if (days.length === 7) return locale === "ar" ? "كل الأيام" : locale === "fr" ? "Tous les jours" : "Every day";
  const sorted = [...days].sort((a, b) => a - b);
  const labels = DAY_LABELS[locale];
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (contiguous && sorted.length >= 3) return `${labels[sorted[0]]} – ${labels[sorted[sorted.length - 1]]}`;
  return sorted.map((d) => labels[d]).join(locale === "ar" ? "، " : ", ");
}

/** "08:00:00" -> "08:00" */
export function shortHour(t: string | null | undefined): string {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

/** Local date -> "YYYY-MM-DD" (not UTC, so it never shifts a day). */
export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Weekday (0 = Sunday) of a "YYYY-MM-DD" string, timezone-safe. */
export function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export const MAX_BOOKING_DAYS = 60;
