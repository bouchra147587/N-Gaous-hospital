"use client";

import { useEffect, useState } from "react";
import { Activity, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { AdministrationData, AdminDirector } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function src(v?: string | null) {
  if (!v) return null;
  return v.startsWith("http") ? v : `${API_URL}${v}`;
}

// Pick "<base>_<locale>" and fall back to Arabic, then to any language available.
function pick(o: any, base: string, lang: string): string {
  return (o?.[`${base}_${lang}`] || o?.[`${base}_ar`] || o?.[`${base}_fr`] || o?.[`${base}_en`] || "") as string;
}

export default function HomeAdministration({ data }: { data: AdministrationData }) {
  const { locale } = useI18n();
  const lang = locale as string;
  const isRTL = lang === "ar";
  const { settings, offices, directors } = data;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || offices.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % offices.length), 5500);
    return () => clearInterval(id);
  }, [paused, offices.length]);

  if (settings && settings.is_visible === false) return null;
  if (!offices.length && !directors.length) return null;

  const current = offices[Math.min(idx, offices.length - 1)];
  const go = (d: number) => setIdx((i) => (i + d + offices.length) % offices.length);
  const Prev = isRTL ? ChevronRight : ChevronLeft;
  const Next = isRTL ? ChevronLeft : ChevronRight;

  const card = (d: AdminDirector) => {
    const img = src(d.image_url);
    return (
      <article key={d.id} className={`adm-card ${d.is_featured ? "is-featured" : ""}`}>
        <div className="adm-card-photo">
          {img ? <img src={img} alt={pick(d, "name", lang)} /> : <div className="adm-card-noimg"><User size={48} /></div>}
          {d.is_featured && pick(d, "badge", lang) && <span className="adm-badge-top">{pick(d, "badge", lang)}</span>}
        </div>
        {!d.is_featured && pick(d, "badge", lang) && <span className="adm-badge-pill">{pick(d, "badge", lang)}</span>}
        <h3 className="adm-card-name">{pick(d, "name", lang)}</h3>
        {pick(d, "position", lang) && <p className="adm-card-pos">{pick(d, "position", lang)}</p>}
        <p className="adm-card-desc">{pick(d, "description", lang)}</p>
        {!d.is_featured && <span className="adm-card-line" aria-hidden="true" />}
      </article>
    );
  };

  return (
    <section id="administration" className="section-anchor border-t border-[var(--line)]">
      <div className="adm-wrap" dir={isRTL ? "rtl" : "ltr"}>
        <div className="adm-top">
          <div
            className="adm-slider"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {current && (
              <>
                {offices.map((o, i) => (
                  <div key={o.id} className={`adm-slide ${i === idx ? "is-active" : ""}`} aria-hidden={i !== idx}>
                    {src(o.image_url) ? <img src={src(o.image_url)!} alt={pick(o, "title", lang)} /> : <div className="adm-slide-empty" />}
                  </div>
                ))}
                <div className="adm-slide-caption">
                  <h3>{pick(current, "title", lang)}</h3>
                  <p>{pick(current, "description", lang)}</p>
                </div>
                {offices.length > 1 && (
                  <>
                    <button type="button" className="adm-nav is-prev" onClick={() => go(-1)} aria-label="Previous"><Prev size={18} /></button>
                    <button type="button" className="adm-nav is-next" onClick={() => go(1)} aria-label="Next"><Next size={18} /></button>
                    <div className="adm-dots">
                      {offices.map((o, i) => (
                        <button key={o.id} type="button" className={i === idx ? "is-active" : ""} onClick={() => setIdx(i)} aria-label={pick(o, "title", lang)} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="adm-head">
            <div className="adm-eyebrow">
              <span>{pick(settings, "eyebrow", lang)}</span>
              <Activity size={64} strokeWidth={1.3} />
            </div>
            <h2>{pick(settings, "title", lang)}</h2>
            <p>{pick(settings, "subtitle", lang)}</p>
            <span className="adm-head-line" aria-hidden="true" />
          </div>
        </div>

        {directors.length > 0 && <div className="adm-grid">{directors.map(card)}</div>}
      </div>
    </section>
  );
}
