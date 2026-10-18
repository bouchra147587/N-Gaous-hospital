"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { translateText } from "@/lib/translate";

type Props = {
  obj: Record<string, unknown>;
  field: string;
  locale: Locale;
  className?: string;
  as?: "span" | "p";
};

/**
 * Renders `${field}_${locale}` from `obj`, matching pickField()'s behavior.
 * If that specific-language column is empty and the locale isn't Arabic,
 * it shows the Arabic text immediately (no blank flash) and then replaces
 * it with a live-translated version once the API call resolves. Results
 * are cached (see lib/translate.ts) so this only ever calls the API once
 * per unique piece of text per target language.
 */
export default function AutoText({ obj, field, locale, className, as = "span" }: Props) {
  const ar = ((obj[`${field}_ar`] as string) || "").trim();
  const fr = ((obj[`${field}_fr`] as string) || "").trim();
  const en = ((obj[`${field}_en`] as string) || "").trim();

  const direct = locale === "ar" ? ar : locale === "fr" ? fr : en;
  const [text, setText] = useState(direct || ar);

  useEffect(() => {
    const val = locale === "ar" ? ar : locale === "fr" ? fr : en;

    if (val) {
      setText(val);
      return;
    }
    if (!ar || locale === "ar") {
      setText(ar);
      return;
    }

    let cancelled = false;
    setText(ar); // show Arabic right away while the translation loads
    translateText(ar, locale).then((translated) => {
      if (!cancelled) setText(translated);
    });
    return () => {
      cancelled = true;
    };
  }, [ar, fr, en, locale]);

  const Tag = as;
  return <Tag className={className}>{text}</Tag>;
}
