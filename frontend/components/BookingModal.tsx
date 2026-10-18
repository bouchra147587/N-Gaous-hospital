"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Stethoscope } from "lucide-react";
import { useTr } from "@/lib/accountI18n";
import { pickField } from "@/lib/i18n";
import { portraitForDoctor, resolveMediaUrl } from "@/lib/media";
import type { Doctor } from "@/lib/api";
import BookingForm from "@/components/BookingForm";

/** Pop-up with the booking form for ONE doctor. Rendered in <body> (portal) so
 *  card hover transforms can't break its fixed positioning. */
export default function BookingModal({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  const { t, locale, dir } = useTr();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const name = pickField(doctor as any, "full_name", locale);
  const title = pickField(doctor as any, "title", locale);

  return createPortal(
    <div className="bk-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bk-modal" role="dialog" aria-modal="true" aria-label={t("book.title")} dir={dir}>
        <button type="button" className="bk-close" onClick={onClose} aria-label={t("book.close")} title={t("book.close")}>
          <X size={20} />
        </button>

        <header className="bk-modal-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolveMediaUrl(doctor.image_url) || portraitForDoctor(doctor.id)} alt="" />
          <div>
            <span className="bk-eyebrow"><Stethoscope size={14} /> {t("book.title")}</span>
            <h2>{t("book.with")} {name}</h2>
            {title && <p>{title}</p>}
          </div>
        </header>

        <BookingForm doctor={doctor} />
      </div>
    </div>,
    document.body
  );
}
