"use client";

import { usePathname } from "next/navigation";
import { Clock, ExternalLink, MapPin, Navigation, Phone } from "lucide-react";
import { useI18n, type Locale } from "@/lib/i18n";
import { useHospitalText } from "@/lib/hospitalContext";
import {
  MAP_FALLBACK,
  hasCoords,
  mapDirectionsHref,
  mapEmbedSrc,
  mapOpenHref,
} from "@/lib/mapConfig";

const TXT: Record<
  Locale,
  { title: string; open: string; directions: string; mapTitle: string; hours: string }
> = {
  ar: {
    title: "موقع المستشفى على الخريطة",
    open: "فتح في خرائط Google",
    directions: "الاتجاهات إلى المستشفى",
    mapTitle: "خريطة موقع المستشفى",
    hours: "الاستعجالات: على مدار الساعة",
  },
  fr: {
    title: "Localisation de l'hôpital",
    open: "Ouvrir dans Google Maps",
    directions: "Itinéraire vers l'hôpital",
    mapTitle: "Carte de localisation de l'hôpital",
    hours: "Urgences : 24h/24",
  },
  en: {
    title: "Hospital location",
    open: "Open in Google Maps",
    directions: "Directions to the hospital",
    mapTitle: "Hospital location map",
    hours: "Emergency: 24/7",
  },
};

/** Full-width map placed just above the footer. */
export default function LocationSection() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const txt = TXT[locale];
  const { h: hospital, text, plain } = useHospitalText();

  const branded = hasCoords();

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/doctor")) return null;

  const isHome = pathname === "/";
  const openHref = mapOpenHref();
  const dirHref = mapDirectionsHref();

  return (
    <section
      id="location"
      className={`loc-section ${isHome ? "loc-home" : ""}`}
      aria-label={txt.title}
    >
      <div className="loc-map">
        <iframe
          key={mapEmbedSrc(locale)}
          className="loc-iframe"
          src={mapEmbedSrc(locale)}
          title={txt.mapTitle}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Branded card (only when exact coordinates are configured) */}
        {branded && (
          <div className="loc-card">
            <div className="loc-card-text">
              <h3 className="loc-card-name">{text("name", t("about.title"))}</h3>
              <p className="loc-card-addr">{plain("address", t("footer.address"))}</p>
              <ul className="loc-card-meta">
                <li>
                  <Phone size={13} />
                  <span dir="ltr">{hospital?.phone || MAP_FALLBACK.phone}</span>
                </li>
                <li>
                  <Clock size={13} />
                  <span>{hospital?.opening_hours || txt.hours}</span>
                </li>
              </ul>
            </div>
            <div className="loc-actions">
              <a className="loc-iconbtn" href={openHref} target="_blank" rel="noopener noreferrer" aria-label={txt.open} title={txt.open}>
                <ExternalLink size={20} />
              </a>
              <a className="loc-iconbtn loc-iconbtn-primary" href={dirHref} target="_blank" rel="noopener noreferrer" aria-label={txt.directions} title={txt.directions}>
                <Navigation size={20} fill="currentColor" />
              </a>
            </div>
          </div>
        )}

        {/* Floating buttons, always available */}
        <div className="loc-float">
          <a className="loc-pill" href={openHref} target="_blank" rel="noopener noreferrer">
            <MapPin size={16} /> {txt.open}
            <ExternalLink size={14} className="loc-pill-ext" />
          </a>
          <a className="loc-pill loc-pill-primary" href={dirHref} target="_blank" rel="noopener noreferrer">
            <Navigation size={16} fill="currentColor" /> {txt.directions}
          </a>
        </div>
      </div>
    </section>
  );
}
