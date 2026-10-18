"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { NewsItem } from "@/lib/api";
import NewsCard from "@/components/NewsCard";

/** Homepage "Latest news": newest article featured + the next two beside it. */
export default function HomeNews({ news }: { news: NewsItem[] }) {
  const { t, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const [featured, ...rest] = news;
  const side = rest.slice(0, 2);
  if (!featured) return null;

  return (
    <section id="news" className="section-anchor home-news">
      <div className="home-news-inner">
        <div className="home-news-head">
          <div className="home-news-titles">
            <h2>{t("news.latestTitle")}</h2>
            <p>{t("news.latestDesc")}</p>
          </div>
          <Link href="/news" className="home-news-all">
            <Arrow size={16} />
            {t("news.viewAll")}
          </Link>
        </div>

        {/* dir="ltr" keeps the featured card on the visual left in every language;
            each card sets its own text direction. */}
        <div className="home-news-grid" dir="ltr">
          <NewsCard item={featured} variant="featured" />
          {side.length > 0 && (
            <div className="home-news-side">
              {side.map((n) => (
                <NewsCard key={n.id} item={n} variant="compact" />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
