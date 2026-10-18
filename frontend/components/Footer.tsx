"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Clock, LogIn } from "lucide-react";
import { useTr } from "@/lib/accountI18n";
import { useI18n } from "@/lib/i18n";
import { usePathname } from "next/navigation";
import { useHospitalText } from "@/lib/hospitalContext";
import LocationSection from "@/components/LocationSection";

export default function Footer() {
  const { t } = useI18n();
  const { t: ta } = useTr();
  const pathname = usePathname();
  const { h, text, plain } = useHospitalText();
  const name = text("about_title", "") || text("name", t("about.title"));
  const tagline = text("description", t("footer.tagline"));
  const address = [plain("address", t("footer.address")), plain("wilaya", "")].filter(Boolean).join(" - ");
  const phone = plain("phone", "033 00 00 00");
  const email = plain("email", "contact@eph-ngaous.dz");
  const hours = plain("opening_hours", "");
  const socials = [
    { url: h?.facebook_url, label: "Facebook" },
    { url: h?.instagram_url, label: "Instagram" },
    { url: h?.twitter_url, label: "X / Twitter" },
  ].filter((x) => x.url);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/doctor")) return null;

  return (
    <>
    <LocationSection />
    <footer className="mt-0 border-t border-[var(--line)] bg-[var(--paper-raised)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="nav-logo-circle h-11 w-11 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt={name} className="h-full w-full object-contain" />
            </span>
            <p className="text-sm font-bold text-[var(--green-deeper)]">{name}</p>
          </div>
          <p className="mt-4 line-clamp-4 text-sm leading-7 text-[var(--ink-soft)]">{tagline}</p>
          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
              {socials.map((x) => (
                <a key={x.label} href={x.url as string} target="_blank" rel="noopener noreferrer" className="text-[var(--green-deep)] hover:underline">{x.label}</a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-[var(--ink)]">{t("footer.quickLinks")}</h3>
          <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
            <li><Link href="/#about" className="hover:text-[var(--green-deep)]">{t("nav.about")}</Link></li>
            <li><Link href="/#services" className="hover:text-[var(--green-deep)]">{t("nav.services")}</Link></li>
            <li><Link href="/#departments" className="hover:text-[var(--green-deep)]">{t("nav.departments")}</Link></li>
            <li><Link href="/#doctors" className="hover:text-[var(--green-deep)]">{t("nav.doctors")}</Link></li>
            <li><Link href="/news" className="hover:text-[var(--green-deep)]">{t("nav.news")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-[var(--ink)]">{t("footer.contactUs")}</h3>
          <ul className="space-y-3 text-sm text-[var(--ink-soft)]">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--green-deep)]" />
              {address}
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-[var(--green-deep)]" />
              <span dir="ltr">{phone}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0 text-[var(--green-deep)]" />
              <span dir="ltr">{email}</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-[var(--ink)]">{t("footer.hours")}</h3>
          <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
            <li className="flex items-center gap-2">
              <Clock size={16} className="shrink-0 text-[var(--green-deep)]" />
              {t("footer.emergencyHours")}
            </li>
            <li>{hours || t("footer.consultHours")}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--line)] py-5 text-center text-xs text-[var(--ink-soft)]">
        © {new Date().getFullYear()} {name} — {t("footer.rights")}
      
      </div>
    </footer>
    </>
  );
}
