"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Newspaper } from "lucide-react";
import { imageForIcon, resolveMediaUrl } from "@/lib/media";
import { useI18n, pickField, formatDate } from "@/lib/i18n";
import type { NewsItem } from "@/lib/api";

export function newsCover(n: NewsItem) {
  return resolveMediaUrl(n.image_url) || imageForIcon(undefined);
}
export function newsCategory(n: NewsItem, locale: "ar" | "fr" | "en") {
  return pickField(n, "category", locale) || n.category || "";
}

function ReadMore({ id }: { id: number }) {
  const { t, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  return (
    <Link href={`/news/${id}`} className="news-readmore">
      <Arrow size={16} />
      {t("news.readMore")}
    </Link>
  );
}

/** variant="featured": big image on top. variant="compact": image beside text. */
export default function NewsCard({ item, variant = "compact" }: { item: NewsItem; variant?: "featured" | "compact" }) {
  const { locale, dir } = useI18n();
  const cat = newsCategory(item, locale);
  const badge = cat && (
    <span className="news-badge">
      <Newspaper size={12} />
      {cat}
    </span>
  );
  const date = item.published_at && (
    <span className="news-date">
      <CalendarDays size={14} />
      {formatDate(item.published_at, locale)}
    </span>
  );

  if (variant === "featured") {
    return (
      <article className="news-card news-card-featured" dir={dir}>
        <Link href={`/news/${item.id}`} className="news-card-media" aria-label={pickField(item, "title", locale)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={newsCover(item)} alt="" loading="lazy" />
          {badge}
        </Link>
        <div className="news-card-body">
          {date}
          <h3 className="news-card-title">{pickField(item, "title", locale)}</h3>
          <p className="news-card-excerpt">{pickField(item, "excerpt", locale)}</p>
          <ReadMore id={item.id} />
        </div>
        <span className="news-card-accent" aria-hidden="true" />
      </article>
    );
  }

  return (
    <article className="news-card news-card-compact" dir={dir}>
      <div className="news-card-body">
        {badge}
        {date}
        <h3 className="news-card-title">{pickField(item, "title", locale)}</h3>
        <p className="news-card-excerpt">{pickField(item, "excerpt", locale)}</p>
        <ReadMore id={item.id} />
      </div>
      <Link href={`/news/${item.id}`} className="news-card-thumb" aria-label={pickField(item, "title", locale)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={newsCover(item)} alt="" loading="lazy" />
      </Link>
    </article>
  );
}
