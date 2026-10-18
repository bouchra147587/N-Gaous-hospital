"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { NewsItem } from "@/lib/api";
import NewsCard from "@/components/NewsCard";

/** "View all" page: every published article as a card grid. */
export default function NewsView({ news }: { news: NewsItem[] }) {
  const { t, dir } = useI18n();
  const Chevron = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="news-page">
      <header className="news-page-header">
        <nav className="news-crumbs" aria-label="breadcrumb">
          <Link href="/"><Home size={14} /> {t("news.home")}</Link>
          <Chevron size={12} />
          <span>{t("nav.news")}</span>
        </nav>
        <h1>{t("news.latestTitle")}</h1>
        <p>{t("news.latestDesc")}</p>
      </header>

      <section className="news-page-body">
        {news.length === 0 ? (
          <p className="news-empty">{t("news.empty")}</p>
        ) : (
          <div className="news-list-grid">
            {news.map((n) => (
              <NewsCard key={n.id} item={n} variant="featured" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
