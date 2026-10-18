"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { MEDIA } from "@/lib/media";
import { useI18n } from "@/lib/i18n";
import {
  ShieldCheck,
  Landmark,
  Briefcase,
  Building2,
  HeartHandshake,
  FileCheck2,
  Phone,
  ArrowRight,
} from "lucide-react";

export default function ConventionsPage() {
  const { t } = useI18n();

  const partners = [
    {
      icon: Landmark,
      name: t("conventions.cnasName"),
      desc: t("conventions.cnasDesc"),
    },
    {
      icon: Briefcase,
      name: t("conventions.casnasName"),
      desc: t("conventions.casnasDesc"),
    },
    {
      icon: Building2,
      name: t("conventions.armyName"),
      desc: t("conventions.armyDesc"),
    },
    {
      icon: HeartHandshake,
      name: t("conventions.mutualName"),
      desc: t("conventions.mutualDesc"),
    },
  ];

  const steps = [
    { title: t("conventions.step1Title"), desc: t("conventions.step1Desc") },
    { title: t("conventions.step2Title"), desc: t("conventions.step2Desc") },
    { title: t("conventions.step3Title"), desc: t("conventions.step3Desc") },
  ];

  const docs = [
    t("conventions.doc1"),
    t("conventions.doc2"),
    t("conventions.doc3"),
    t("conventions.doc4"),
  ];

  return (
    <div>
      <PageHeader
        eyebrow={t("conventions.eyebrow")}
        title={t("conventions.title")}
        description={t("conventions.desc")}
        image={MEDIA.hospitalLobby}
      />

      {/* Partner organizations */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal variant="up">
          <div className="mx-auto max-w-2xl text-center">
            <span className="convention-badge">
              <ShieldCheck size={14} />
              {t("conventions.partnersTitle")}
            </span>
            <p className="mx-auto mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              {t("conventions.partnersDesc")}
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {partners.map((p, i) => (
            <Reveal key={p.name} variant={i % 2 === 0 ? "left" : "right"} delay={i * 80}>
              <div className="convention-card h-full">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--green-mist)]">
                  <p.icon className="text-[var(--green-deep)]" size={24} />
                </div>
                <h3 className="text-base font-bold leading-6 text-[var(--ink)]">{p.name}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[var(--line)] bg-[var(--paper-raised)]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Reveal variant="up">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-xl font-extrabold text-[var(--green-deeper)] md:text-2xl">
                {t("conventions.howTitle")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                {t("conventions.howDesc")}
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.title} variant="scale" delay={i * 100}>
                <div className="convention-step h-full">
                  <span className="convention-step-number">{i + 1}</span>
                  <h3 className="text-base font-bold text-[var(--ink)]">{s.title}</h3>
                  <p className="text-sm leading-7 text-[var(--ink-soft)]">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Required documents + CTA */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2">
        <Reveal variant="left">
          <div className="photo-card p-8">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--gold-soft)]">
              <FileCheck2 className="text-[var(--gold)]" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[var(--ink)]">{t("conventions.docsTitle")}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {docs.map((doc) => (
                <li key={doc} className="flex items-start gap-2 text-sm leading-7 text-[var(--ink-soft)]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--green-deep)]" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal variant="right">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-8 text-center">
            <Phone className="mx-auto text-[var(--green-deep)]" size={28} />
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              {t("conventions.contactCta")}
            </p>
            <Link href="/contact" className="hero-primary-button mt-6 inline-flex">
              <span>{t("menu.contact.title")}</span>
              <ArrowRight size={17} className="rtl:rotate-180" />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
