"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getIcon } from "@/lib/icons";
import { imageForIcon, MEDIA, resolveMediaUrl } from "@/lib/media";
import { ArrowLeft, BedDouble } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import AutoText from "@/components/AutoText";
import type { Department } from "@/lib/api";

export default function DepartmentsView({ departments }: { departments: Department[] }) {
  const { t, locale } = useI18n();

  return (
    <div>
      <PageHeader
        eyebrow={t("departments.eyebrow")}
        title={t("departments.title")}
        description={t("departments.desc")}
        image={MEDIA.hospitalCorridorBed}
      />

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => {
            const Icon = getIcon(d.icon);
            const img = resolveMediaUrl(d.image_url) || imageForIcon(d.icon);
            return (
              <Link
                key={d.id}
                href={`/departments/${d.slug}`}
                className="group photo-card flex flex-col bg-[var(--paper)] transition-colors hover:border-[var(--green-deep)]"
              >
                <div className="relative h-36 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                  <div className="absolute bottom-3 start-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                    <Icon className="text-[var(--green-deep)]" size={20} />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <h3 className="text-base font-bold leading-6 text-[var(--ink)]">
                    <AutoText obj={d} field="name" locale={locale} />
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-7 text-[var(--ink-soft)]">
                    <AutoText obj={d} field="description" locale={locale} />
                  </p>
                  {d.capacity_beds && (
                    <p className="mt-4 flex items-center gap-2 text-xs text-[var(--ink-soft)]">
                      <BedDouble size={14} className="text-[var(--gold)]" />
                      {d.capacity_beds} {t("departments.beds")}
                    </p>
                  )}
                  <span className="mt-4 flex items-center gap-1 text-xs font-semibold text-[var(--green-deep)] opacity-0 transition-opacity group-hover:opacity-100">
                    {t("home.details")}
                    <ArrowLeft size={14} className="rtl:rotate-180" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
