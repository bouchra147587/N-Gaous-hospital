"use client";

import PageHeader from "@/components/PageHeader";
import { GraduationCap, CalendarClock, Stethoscope, Clock, CheckCircle2, XCircle } from "lucide-react";
import { MEDIA, portraitForDoctor, resolveMediaUrl } from "@/lib/media";
import { useI18n, pickField } from "@/lib/i18n";
import type { Doctor, Department } from "@/lib/api";
import BookDoctorButton from "@/components/BookDoctorButton";

/* ============================================================
   Schedule helpers
   ============================================================ */

/** Day labels, indexed by JS getDay() (0 = Sunday … 6 = Saturday). */
const DAY_LABELS: Record<"ar" | "fr" | "en", string[]> = {
  ar: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

/** Parse "0,1,2,3,4" (or "0, 1, 2") into [0,1,2,3,4]. */
function parseDays(csv: string | null | undefined): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

/**
 * Convert a list of days into a compact human label.
 * ["0","1","2","3","4"]  → "الأحد – الخميس"
 * ["0","1","2","3","4","5","6"] → "كل الأيام"
 * ["1","3","5"]          → "الإثنين، الأربعاء، الجمعة"
 */
function formatDays(days: number[], locale: "ar" | "fr" | "en"): string {
  if (days.length === 0) return "";
  if (days.length === 7) {
    return locale === "ar" ? "كل الأيام" : locale === "fr" ? "Tous les jours" : "Every day";
  }

  const sorted = [...days].sort((a, b) => a - b);
  const labels = DAY_LABELS[locale];

  // Detect a contiguous run
  const isContiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);

  if (isContiguous && sorted.length >= 3) {
    return `${labels[sorted[0]]} – ${labels[sorted[sorted.length - 1]]}`;
  }

  return sorted.map((d) => labels[d]).join(locale === "ar" ? "، " : ", ");
}

/** Trim "08:00:00" → "08:00". */
function shortTime(t: string | null | undefined): string {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

/**
 * Compute whether a doctor is present right now.
 * Returns null when schedule data is missing (can't decide).
 */
function isPresentNow(doc: Doctor, now: Date = new Date()): boolean | null {
  const days = parseDays(doc.schedule_days);
  if (days.length === 0 || !doc.schedule_start || !doc.schedule_end) return null;

  // Today in JS getDay() convention
  const today = now.getDay();
  if (!days.includes(today)) return false;

  // Compare time strings directly (works because both are "HH:MM" / "HH:MM:SS")
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  const start = shortTime(doc.schedule_start);
  const end = shortTime(doc.schedule_end);

  return hhmm >= start && hhmm <= end;
}

/* ============================================================
   Component
   ============================================================ */

export default function DoctorsView({
  doctors,
  departments,
}: {
  doctors: Doctor[];
  departments: Department[];
}) {
  const { t, locale } = useI18n();
  const lang = locale as "ar" | "fr" | "en";

  const deptName = (id?: number | null) => {
    const d = departments.find((dep) => dep.id === id);
    return d ? pickField(d, "name", locale) : "";
  };

  const labels = {
    ar: {
      available: "متوفر الآن",
      away: "غير متوفر",
      schedule: "أوقات الحضور",
    },
    fr: {
      available: "Disponible maintenant",
      away: "Non disponible",
      schedule: "Horaires de présence",
    },
    en: {
      available: "Available now",
      away: "Not available",
      schedule: "Working hours",
    },
  }[lang];

  return (
    <div>
      <PageHeader
        eyebrow={t("doctors.eyebrow")}
        title={t("doctors.title")}
        description={t("doctors.desc")}
        image={MEDIA.doctorLaptopStethoscope}
      />

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc) => {
            const present = isPresentNow(doc);

            const days = parseDays(doc.schedule_days);
            const hasStructuredSchedule =
              days.length > 0 && !!doc.schedule_start && !!doc.schedule_end;

            const daysLabel = hasStructuredSchedule ? formatDays(days, lang) : "";
            const timeLabel = hasStructuredSchedule
              ? `${shortTime(doc.schedule_start)} – ${shortTime(doc.schedule_end)}`
              : "";

            // Fallback text schedule (legacy)
            const legacySchedule =
              locale === "fr"
                ? doc.schedule_fr || doc.schedule
                : locale === "en"
                ? doc.schedule_en || doc.schedule
                : doc.schedule;

            return (
              <article
                key={doc.id}
                className="doctor-card group relative flex flex-col items-center rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--green-deep)] hover:shadow-xl"
              >
                {/* ---- Circular avatar ---- */}
                <div className="relative -mt-2 mb-3">
                  <div
                    className={`doctor-avatar-ring ${
                      present === true
                        ? "is-available"
                        : present === false
                        ? "is-away"
                        : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveMediaUrl(doc.image_url) || portraitForDoctor(doc.id)}
                      alt={pickField(doc, "full_name", locale)}
                      className="doctor-avatar"
                    />
                  </div>

                  {/* Icon badge */}
                  <span className="absolute -bottom-1 -end-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-[var(--paper)]">
                    <Stethoscope size={15} className="text-[var(--green-deep)]" />
                  </span>
                </div>

                {/* ---- Live status badge ---- */}
                {present !== null && (
                  <span
                    className={`doctor-status ${
                      present ? "is-available" : "is-away"
                    }`}
                  >
                    <span className="doctor-status-dot" aria-hidden="true" />
                    {present ? labels.available : labels.away}
                  </span>
                )}

                {/* ---- Name + title ---- */}
                <h3 className="mt-3 text-base font-extrabold leading-6 text-[var(--ink)]">
                  {pickField(doc, "full_name", locale)}
                </h3>

                <p className="mt-1 text-sm font-medium text-[var(--green-deep)]">
                  {pickField(doc, "title", locale)}
                </p>
        {pickField(doc, "grade", locale) && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gold)]">
            <GraduationCap size={13} />
            {pickField(doc, "grade", locale)}
          </p>
        )}

                {doc.department_id && (
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {deptName(doc.department_id)}
                  </p>
                )}

                {/* ---- Schedule block ---- */}
                {(hasStructuredSchedule || legacySchedule) && (
                  <div className="mt-5 w-full border-t border-[var(--line)] pt-4 text-start">
                    <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                      <CalendarClock size={12} className="text-[var(--gold)]" />
                      {labels.schedule}
                    </p>

                    {hasStructuredSchedule ? (
                      <div className="flex flex-col gap-1 text-xs text-[var(--ink-soft)]">
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-[var(--green-deep)]" />
                          {daysLabel}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Clock size={13} className="text-[var(--gold)]" />
                          <span dir="ltr">{timeLabel}</span>
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs leading-6 text-[var(--ink-soft)]">
                        {legacySchedule}
                      </p>
                    )}
                  </div>
                )}

                <BookDoctorButton doctor={doc} />
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}