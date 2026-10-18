"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import AppointmentForm from "@/components/AppointmentForm";
import { getDepartments, Department } from "@/lib/api";
import { MEDIA } from "@/lib/media";
import { Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function AppointmentPage() {
  const { t } = useI18n();
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    getDepartments().then(setDepartments);
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow={t("appointment.eyebrow")}
        title={t("appointment.title")}
        description={t("appointment.desc")}
        image={MEDIA.doctorWomanStethoscope}
      />

      <section className="mx-auto max-w-2xl px-5 py-16">
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-[var(--brick)]/30 bg-[var(--brick)]/5 p-5">
          <Phone className="shrink-0 text-[var(--brick)]" size={22} />
          <p className="text-sm text-[var(--ink)]">
            <span className="font-bold text-[var(--brick)]">{t("appointment.emergencyLabel")}</span>{" "}
            {t("appointment.emergencyNote")}{" "}
            <span dir="ltr" className="font-bold">033 00 00 00</span>
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-8">
          <AppointmentForm departments={departments} />
        </div>
      </section>
    </div>
  );
}
