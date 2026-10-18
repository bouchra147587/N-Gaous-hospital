"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { getIcon } from "@/lib/icons";
import { getDepartments, Department } from "@/lib/api";
import { MEDIA } from "@/lib/media";
import { useI18n, pickField } from "@/lib/i18n";
import {
  Siren,
  CalendarCheck,
  Building2,
  Users,
  Info,
  ArrowRight,
} from "lucide-react";

/**
 * Static weekly consultation pattern applied round-robin to whichever
 * departments come back from the API, so the table always renders
 * something meaningful even before per-department schedule data exists
 * in the backend.
 */
const WEEKLY_PATTERNS: { days: string[]; hoursKey: string }[] = [
  { days: ["sat", "mon", "wed"], hoursKey: "schedules.hoursMorning" },
  { days: ["sun", "tue", "thu"], hoursKey: "schedules.hoursAfternoon" },
  { days: ["sat", "sun", "mon", "tue", "wed"], hoursKey: "schedules.hoursFull" },
  { days: ["mon", "wed", "thu"], hoursKey: "schedules.hoursMorning" },
];

const ALL_DAYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

export default function SchedulesPage() {
  const { t, locale } = useI18n();
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const generalHours = [
    {
      icon: Siren,
      emergency: true,
      title: t("schedules.emergencyTitle"),
      value: t("schedules.emergencyValue"),
    },
    {
      icon: CalendarCheck,
      title: t("schedules.receptionTitle"),
      value: t("schedules.receptionValue"),
    },
    {
      icon: Building2,
      title: t("schedules.adminTitle"),
      value: t("schedules.adminValue"),
    },
    {
      icon: Users,
      title: t("schedules.visitsTitle"),
      value: t("schedules.visitsValue"),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={t("schedules.eyebrow")}
        title={t("schedules.title")}
        description={t("schedules.desc")}
        image={MEDIA.doctorWomanStethoscope}
      />

      {/* General reception hours */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {generalHours.map((item, i) => (
            <Reveal key={item.title} variant="up" delay={i * 90}>
              <div className="schedule-hours-card h-full">
                <div className={`schedule-hours-icon ${item.emergency ? "is-emergency" : ""}`}>
                  <item.icon size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--ink)]">{item.title}</p>
                  <p className="mt-1 text-xs leading-6 text-[var(--ink-soft)]">{item.value}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Per-department consultation table */}
      <section className="border-t border-[var(--line)] bg-[var(--paper-raised)]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Reveal variant="up">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-xl font-extrabold text-[var(--green-deeper)] md:text-2xl">
                {t("schedules.tableTitle")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                {t("schedules.tableDesc")}
              </p>
            </div>
          </Reveal>

          {/* Column headers (desktop only) */}
          <div className="mt-10 hidden md:grid md:grid-cols-[2.1fr_1.6fr_1.3fr] md:gap-4 md:px-[1.3rem] md:pb-3 md:text-xs md:font-bold md:uppercase md:tracking-wide md:text-[var(--ink-soft)]">
            <span>{t("schedules.colDepartment")}</span>
            <span>{t("schedules.colDays")}</span>
            <span>{t("schedules.colHours")}</span>
          </div>

          <div className="flex flex-col gap-4">
            {(departments.length > 0
              ? departments
              : Array.from({ length: 4 }).map((_, i) => ({
                  id: i,
                  slug: "",
                  icon: null,
                  name_ar: t("schedules.colDepartment"),
                } as Department))
            ).map((d, i) => {
              const Icon = getIcon(d.icon);
              const pattern = WEEKLY_PATTERNS[i % WEEKLY_PATTERNS.length];
              const name = departments.length > 0 ? pickField(d, "name", locale) : d.name_ar;

              return (
                <Reveal key={d.id} variant="up" delay={i * 70}>
                  <div className="schedule-table-row">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--green-mist)]">
                        <Icon className="text-[var(--green-deep)]" size={20} />
                      </div>
                      <span className="text-sm font-bold text-[var(--ink)]">{name}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {ALL_DAYS.map((day) => (
                        <span
                          key={day}
                          className={`schedule-day-pill ${pattern.days.includes(day) ? "is-open" : ""}`}
                        >
                          {t(`schedules.days.${day}`)}
                        </span>
                      ))}
                    </div>

                    <span className="text-sm font-semibold text-[var(--green-deep)]">
                      {t(pattern.hoursKey)}
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal variant="up" delay={150}>
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold-soft)] p-5">
              <Info className="mt-0.5 shrink-0 text-[var(--gold)]" size={20} />
              <p className="text-sm leading-7 text-[var(--ink)]">
                <span className="font-bold">{t("schedules.noteTitle")}: </span>
                {t("schedules.note")}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <Reveal variant="scale">
          <Link href="/appointment" className="hero-primary-button inline-flex">
            <CalendarCheck size={19} />
            <span>{t("schedules.cta")}</span>
            <ArrowRight size={17} className="rtl:rotate-180" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
