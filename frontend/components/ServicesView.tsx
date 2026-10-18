"use client";

import PageHeader from "@/components/PageHeader";
import { getIcon } from "@/lib/icons";
import { imageForIcon, MEDIA, resolveMediaUrl } from "@/lib/media";
import { useI18n, pickField } from "@/lib/i18n";
import type { Service } from "@/lib/api";

export default function ServicesView({ services }: { services: Service[] }) {
  const { t, locale } = useI18n();

  return (
    <div>
      <PageHeader
        eyebrow={t("services.eyebrow")}
        title={t("services.title")}
        description={t("services.desc")}
        image={MEDIA.medicalTeamWorking}
      />

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {services.map((s) => {
            const Icon = getIcon(s.icon);
            const img = resolveMediaUrl(s.image_url) || imageForIcon(s.icon);
            return (
              <div key={s.id} className="photo-card flex flex-col bg-[var(--paper)]">
                <div className="relative h-40 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {s.available_24_7 && (
                    <span className="absolute end-3 top-3 rounded-full bg-[var(--brick)] px-3 py-1 text-xs font-semibold text-white">
                      {t("home.available247")}
                    </span>
                  )}
                  <div className="absolute bottom-3 start-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                    <Icon className="text-[var(--green-deep)]" size={20} />
                  </div>
                </div>
                <div className="p-7">
                  <h3 className="text-lg font-bold text-[var(--ink)]">{pickField(s, "title", locale)}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                    {pickField(s, "description", locale)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
