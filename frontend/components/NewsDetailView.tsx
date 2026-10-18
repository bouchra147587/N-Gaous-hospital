"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Facebook, Home, Linkedin,
  Link2, MessageCircle, Share2, Tag, Twitter, X,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";
import { useI18n, pickField, formatDate } from "@/lib/i18n";
import type { NewsItem } from "@/lib/api";
import { newsCategory, newsCover } from "@/components/NewsCard";

export default function NewsDetailView({ item }: { item: NewsItem }) {
  const { t, locale, dir } = useI18n();
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft; // points "back" in reading direction
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  const title = pickField(item, "title", locale);
  const excerpt = pickField(item, "excerpt", locale);
  const content = pickField(item, "content", locale);
  const category = newsCategory(item, locale);
  const paragraphs = content.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const gallery = (item.gallery || []).map(resolveMediaUrl).filter(Boolean);

  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  useEffect(() => setUrl(window.location.href), []);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % gallery.length));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, gallery.length]);

  const enc = encodeURIComponent;
  const shares = [
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "X", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}` },
    { label: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${enc(title + " " + url)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  }

  function scrollGallery(dirSign: 1 | -1) {
    document.getElementById("news-gallery-strip")?.scrollBy({ left: dirSign * 260, behavior: "smooth" });
  }

  return (
    <div className="news-page">
      <header className="news-page-header">
        <nav className="news-crumbs" aria-label="breadcrumb">
          <Link href="/"><Home size={14} /> {t("news.home")}</Link>
          <Chevron size={12} />
          <Link href="/news">{t("nav.news")}</Link>
          <Chevron size={12} />
          <span className="news-crumb-current">{title}</span>
        </nav>
        <h1>{t("news.latestTitle")}</h1>
        <p>{t("news.latestDesc")}</p>
      </header>

      <div className="news-detail">
        <div className="news-detail-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={newsCover(item)} alt={title} />
        </div>

        <div className="news-detail-layout">
          <aside className="news-detail-aside">
            {item.published_at && (
              <div className="news-side-row">
                <CalendarDays size={22} />
                <div><small>{t("news.publishDate")}</small><strong>{formatDate(item.published_at, locale)}</strong></div>
              </div>
            )}
            {category && (
              <div className="news-side-row">
                <Tag size={22} />
                <div><small>{t("news.category")}</small><strong>{category}</strong></div>
              </div>
            )}
            <div className="news-side-row">
              <Share2 size={22} />
              <div>
                <small>{t("news.share")}</small>
                <div className="news-share">
                  {shares.map(({ label, icon: Icon, href }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
                      <Icon size={15} />
                    </a>
                  ))}
                  <button type="button" onClick={copy} aria-label={t("news.copyLink")} title={t("news.copyLink")}>
                    <Link2 size={15} />
                  </button>
                </div>
                {copied && <span className="news-copied">{t("news.copied")}</span>}
              </div>
            </div>
          </aside>

          <article className="news-detail-article">
            <div className="news-detail-meta">
              {category && <span className="news-badge is-solid">{category}</span>}
              {item.published_at && <span className="news-date">{formatDate(item.published_at, locale)}</span>}
            </div>
            <h2 className="news-detail-title">{title}</h2>
            {excerpt && <p className="news-detail-lead">{excerpt}</p>}
            <div className="news-detail-content">
              {paragraphs.map((p, i) => (<p key={i}>{p}</p>))}
            </div>

            {gallery.length > 0 && (
              <div className="news-gallery" aria-label={t("news.gallery")}>
                <div id="news-gallery-strip" className="news-gallery-strip">
                  {gallery.map((src, i) => (
                    <button key={src + i} type="button" onClick={() => setLightbox(i)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
                {gallery.length > 2 && (
                  <button type="button" className="news-gallery-next" onClick={() => scrollGallery(dir === "rtl" ? -1 : 1)} aria-label={t("news.next")}>
                    <Chevron size={18} />
                  </button>
                )}
              </div>
            )}

            <Link href="/news" className="news-back">
              <Back size={15} />
              {t("news.backToNews")}
            </Link>
          </article>
        </div>
      </div>

      {lightbox !== null && (
        <div className="news-lightbox" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <button type="button" className="news-lightbox-close" onClick={() => setLightbox(null)} aria-label="close"><X size={22} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gallery[lightbox]} alt="" onClick={(e) => e.stopPropagation()} />
          {gallery.length > 1 && (
            <>
              <button type="button" className="news-lightbox-nav is-prev" aria-label={t("news.prev")}
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length); }}><ChevronLeft size={26} /></button>
              <button type="button" className="news-lightbox-nav is-next" aria-label={t("news.next")}
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % gallery.length); }}><ChevronRight size={26} /></button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
