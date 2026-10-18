"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, BedDouble, Home, Stethoscope, User, Users, HeartPulse, Activity,
  GraduationCap,
} from "lucide-react";
import { useI18n, pickField } from "@/lib/i18n";
import { imageForIcon, portraitForDoctor, resolveMediaUrl } from "@/lib/media";
import { DEPARTMENT_UNITS, parseDays, formatDays, shortTime, isPresentNow } from "@/components/HomeView";
import type { Department, Doctor, DepartmentDetail } from "@/lib/api";
import BookDoctorButton from "@/components/BookDoctorButton";

type L = "ar" | "fr" | "en";

const T: Record<L, Record<string, string>> = {
  ar: { home: "الرئيسية", depts: "المصالح", tag: "مصلحة طبية", about: "نبذة عن المصلحة", services: "أهم الخدمات التي نقدمها",
    more: "معلومات إضافية", capacity: "الطاقة الاستيعابية", beds: "سرير", head: "رئيس المصلحة", floor: "الموقع", contact: "اتصل بالمصلحة",
    hours: "أوقات العمل", location: "الموقع", phone: "هاتف المصلحة", doctors: "أطباء المصلحة", available: "متوفر الآن", away: "غير متوفر", schedule: "أوقات الحضور", noDoctors: "لا يوجد أطباء مسجلون في هذه المصلحة حالياً." },
  fr: { home: "Accueil", depts: "Services", tag: "Service médical", about: "À propos du service", services: "Principaux services proposés",
    more: "Informations complémentaires", capacity: "Capacité d'accueil", beds: "lits", head: "Chef de service", floor: "Emplacement", contact: "Contacter le service",
    hours: "Horaires", location: "Emplacement", phone: "Téléphone du service", doctors: "Médecins du service", available: "Disponible maintenant", away: "Non disponible", schedule: "Horaires de présence", noDoctors: "Aucun médecin enregistré dans ce service pour le moment." },
  en: { home: "Home", depts: "Departments", tag: "Medical Department", about: "About the department", services: "Key services we offer",
    more: "Additional information", capacity: "Bed capacity", beds: "beds", head: "Head of department", floor: "Location", contact: "Contact the department",
    hours: "Opening hours", location: "Location", phone: "Department phone", doctors: "Department doctors", available: "Available now", away: "Not available", schedule: "Working hours", noDoctors: "No doctors are registered in this department yet." },
};

export default function DepartmentDetailView({ department, doctors, detail }: { department: Department; doctors: Doctor[]; detail?: DepartmentDetail | null }) {
  const { locale, dir } = useI18n();
  const lang = locale as L;
  const t = T[lang];
  const Chevron = dir === "rtl" ? ArrowLeft : ArrowRight;
  const d = department;

  // Live clock so the "available now" badge is correct and refreshes every minute.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const name = pickField(d as any, "name", locale);
  const description = pickField(d as any, "description", locale);
  const baseImage = resolveMediaUrl(d.image_url) || imageForIcon(d.icon);
  const heroImage = resolveMediaUrl(detail?.hero_image_url) || baseImage;
  const sideImage = resolveMediaUrl(detail?.side_image_url) || baseImage;
  const aboutImage = resolveMediaUrl(detail?.about_image_url) || baseImage;
  const dd = (base: string) => (detail ? pickField(detail as any, base, locale) : "");
  const tag = dd("tag") || t.tag;
  const heroSubtitle = dd("hero_subtitle") || description;
  const aboutText = dd("about") || description;
  const customServices = (detail?.services ?? []).map((sv) => pickField(sv as any, "title", locale)).filter(Boolean);
  const units = customServices.length ? customServices : (DEPARTMENT_UNITS[d.slug] ?? []).map((u) => u[lang]);
  const head = doctors.find((x) => /رئيس|chef|head/i.test(`${x.title_ar ?? ""} ${x.title_fr ?? ""} ${x.title_en ?? ""}`));
  const docName = (x: Doctor) => pickField(x as any, "full_name", locale);
  const docTitle = (x: Doctor) => pickField(x as any, "title", locale);

  return (
    <div className="dpd" dir={dir}>
      <header className="dpd-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="dpd-hero-img" src={heroImage} alt="" />
        <div className="dpd-hero-in">
          <nav className="dpd-crumbs" aria-label="breadcrumb">
            <Link href="/"><Home size={14} /> {t.home}</Link>
            <Chevron size={12} />
            <Link href="/#departments">{t.depts}</Link>
            <Chevron size={12} />
            <span>{name}</span>
          </nav>
          <span className="dpd-pill">{tag}</span>
          <h1>{name}</h1>
          <p>{heroSubtitle}</p>
        </div>
      </header>

      <div className="dpd-grid">
        {/* ---------- sidebar (start side) ---------- */}
        <aside className="dpd-card">
          <div className="dpd-side-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sideImage} alt={name} />
            <span className="dpd-pill">{tag}</span>
          </div>
          {typeof d.capacity_beds === "number" && (
            <div className="dpd-fact">
              <span className="dpd-ico"><BedDouble size={18} /></span>
              <div><b>{t.capacity}</b><small>{d.capacity_beds} {t.beds}</small></div>
            </div>
          )}
          {(dd("head_name") || head) && (
            <div className="dpd-fact">
              <span className="dpd-ico"><User size={18} /></span>
              <div><b>{t.head}</b><small>{dd("head_name") || (head ? docName(head) : "")}</small></div>
            </div>
          )}
        </aside>

        {/* ---------- main ---------- */}
        <div className="dpd-main">
          <section className="dpd-card">
            <h2 className="dpd-h"><HeartPulse size={20} /> {t.about}</h2>
            <div className="dpd-about">
              <p>{aboutText}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={aboutImage} alt={name} />
            </div>
          </section>

          {units.length > 0 && (
            <section className="dpd-card">
              <h2 className="dpd-h"><Activity size={20} /> {t.services}</h2>
              <div className="dpd-svcs">
                {units.map((u) => (
                  <div key={u} className="dpd-svc">
                    <span className="dpd-ico"><Stethoscope size={20} /></span>
                    <span>{u}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="dpd-card">
            <h2 className="dpd-h"><Users size={20} /> {t.doctors}</h2>
            {doctors.length === 0 ? (
              <p className="dpd-empty">{t.noDoctors}</p>
            ) : (
              <div className="dpd-docs">
                {doctors.map((x) => {
                  const present = now ? isPresentNow(x, now) : null;
                  const days = parseDays(x.schedule_days);
                  const structured = days.length > 0 && !!x.schedule_start && !!x.schedule_end;
                  const legacy =
                    lang === "fr" ? x.schedule_fr || x.schedule : lang === "en" ? x.schedule_en || x.schedule : x.schedule;
                  return (
                    <article key={x.id} className="dpd-doc">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={present === true ? "is-available" : present === false ? "is-away" : ""}
                        src={resolveMediaUrl(x.image_url) || portraitForDoctor(x.id)}
                        alt={docName(x)}
                      />
                      <div className="dpd-doc-info">
                        <b>{docName(x)}</b>
                        <small>{docTitle(x)}</small>
                        {pickField(x as any, "grade", locale) && (
                          <small className="dpd-doc-grade" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--gold)", fontWeight: 600 }}>
                            <GraduationCap size={12} /> {pickField(x as any, "grade", locale)}
                          </small>
                        )}
                        {present !== null && (
                          <span className={`doctor-status ${present ? "is-available" : "is-away"}`}>
                            <span className="doctor-status-dot" aria-hidden="true" />
                            {present ? t.available : t.away}
                          </span>
                        )}
                        {(structured || legacy) && (
                          <div className="dpd-doc-sched">
                            <em>{t.schedule}</em>
                            {structured ? (
                              <>
                                <span>{formatDays(days, lang)}</span>
                                <span dir="ltr">{shortTime(x.schedule_start)} – {shortTime(x.schedule_end)}</span>
                              </>
                            ) : (
                              <span>{legacy}</span>
                            )}
                          </div>
                        )}
                        <BookDoctorButton doctor={x} />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
