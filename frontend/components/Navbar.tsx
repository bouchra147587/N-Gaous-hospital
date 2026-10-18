"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

import {
  Menu,
  X,
  Globe,
  ChevronDown,
  Sun,
  Moon,
  House,
  Users,
  Clock3,
  BriefcaseMedical,
  FileText,
  Phone,
  LogOut,
  UserCircle,
  Landmark,
} from "lucide-react";

import { useI18n, LOCALES } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  // Route-dependent classes are applied only after hydration so the server HTML
  // and the first client render are identical (fixes the hydration warning).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState("");
  const clickLockUntil = useRef(0);

  const { locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const isRTL = locale === "ar";

  /* ---------------------------------------------------------
     TRANSPARENT-OVER-HERO STATE
     --------------------------------------------------------- */

  const pathname = usePathname();
  const isHome = mounted && pathname === "/";
  const isTransparent = isHome && !isScrolled && !isMobileViewport;

  /* ---------------------------------------------------------
     LANGUAGE DISPLAY
     --------------------------------------------------------- */

  const getLocaleDisplay = (code: string) => {
    const map: Record<string, string> = {
      en: "English",
      fr: "Français",
      ar: "العربية",
    };

    return map[code] || code;
  };

  const currentLocaleLabel = getLocaleDisplay(locale);

  /* ---------------------------------------------------------
     SCROLL-SPY: highlight the link of the section in view
     --------------------------------------------------------- */

  const SECTION_IDS = [
    "home",
    "about",
    "departments",
    "services",
    "doctors",
    "administration",
    "news",
    "contact",
    "location",
  ];

  const updateActive = useCallback(() => {
    if (Date.now() < clickLockUntil.current) return;

    const offset = 160;
    let current = "";

    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= offset) current = id;
    }

    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4;
    if (atBottom) current = "contact";

    if (current === "location") current = "contact";
    setActiveId(current || "home");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/news")) {
      setActiveId("news");
      return;
    }
    if (!isHome) {
      setActiveId("");
      return;
    }

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [pathname, isHome, updateActive]);

  const isActive = (href: string) => {
    const id = href.split("#")[1];
    return !!id && id === activeId;
  };

  const handleLinkClick = (href: string) => {
    const id = href.split("#")[1];
    if (id && isHome) {
      setActiveId(id);
      clickLockUntil.current = Date.now() + 900;
      setTimeout(updateActive, 950);
    }
    setOpen(false);
  };

  /* ---------------------------------------------------------
     NAVIGATION LINKS
     --------------------------------------------------------- */

  const LINKS = [
    { href: "/#home", label: "Home", icon: House },
    { href: "/#about", label: "About Us", icon: Users },
    { href: "/#departments", label: "Departments", icon: Clock3 },
    { href: "/#services", label: "Services", icon: BriefcaseMedical },
    { href: "/#doctors", label: "Doctors", icon: FileText },
    { href: "/#administration", label: "Administration", icon: Landmark },
    { href: "/#news", label: "News", icon: FileText },
    { href: "/#contact", label: "Contact", icon: Phone },
  ];

  const FR_LINKS = [
    { href: "/#home", label: "Accueil", icon: House },
    { href: "/#about", label: "À propos", icon: Users },
    { href: "/#departments", label: "Départements", icon: Clock3 },
    { href: "/#services", label: "Services", icon: BriefcaseMedical },
    { href: "/#doctors", label: "Médecins", icon: FileText },
    { href: "/#administration", label: "Administration", icon: Landmark },
    { href: "/#news", label: "Actualités", icon: FileText },
    { href: "/#contact", label: "Contact", icon: Phone },
  ];

  const AR_LINKS = [
    { href: "/#home", label: "الرئيسية", icon: House },
    { href: "/#about", label: "من نحن", icon: Users },
    { href: "/#departments", label: "المصالح الطبية", icon: Clock3 },
    { href: "/#services", label: "الخدمات", icon: BriefcaseMedical },
    { href: "/#doctors", label: "الأطباء", icon: FileText },
    { href: "/#administration", label: "الإدارة", icon: Landmark },
    { href: "/#news", label: "الأخبار", icon: FileText },
    { href: "/#contact", label: "تواصل معنا", icon: Phone },
  ];

  const navLinks =
    locale === "ar"
      ? AR_LINKS
      : locale === "fr"
        ? FR_LINKS
        : LINKS;

  /* ---------------------------------------------------------
     CLOSE LANGUAGE DROPDOWN WHEN CLICKING OUTSIDE
     --------------------------------------------------------- */

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        langRef.current &&
        !langRef.current.contains(event.target as Node)
      ) {
        setLangOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ---------------------------------------------------------
     SCROLL EFFECT
     --------------------------------------------------------- */

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobileViewport(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---------------------------------------------------------
     PAGE LOAD ANIMATION
     --------------------------------------------------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  /* ---------------------------------------------------------
     LOGO SUBTITLE
     --------------------------------------------------------- */

  const hospitalSubtitle =
    locale === "ar"
      ? "المؤسسة العمومية الاستشفائية نقاوس"
      : locale === "fr"
        ? "ÉTABLISSEMENT HOSPITALIER PUBLIC N'GAOUS"
        : "PUBLIC HOSPITAL INSTITUTION N'GAOUS";

  /* ---------------------------------------------------------
     RENDER
     --------------------------------------------------------- */

  return (
    <header
      className={`hospital-navbar lang-${locale} ${isRTL ? "is-rtl" : "is-ltr"} ${isScrolled ? "scrolled" : ""} ${isLoaded ? "loaded" : ""} ${isHome ? "is-home" : ""} ${isTransparent ? "nav-transparent" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="hospital-navbar-wrapper">
        <div className="hospital-navbar-inner">
          {/* =================================================
              LOGO
              ================================================= */}

          <Link
            href="/"
            className={`hospital-brand ${
              isRTL ? "brand-rtl" : "brand-ltr"
            }`}
            onClick={() => setOpen(false)}
          >
            <div className="hospital-logo-wrapper">
              <div className="hospital-logo-ring"></div>
              <div className="hospital-logo-glow"></div>
              <div className="hospital-logo">
                <Image
                  src="/logo.png"
                  alt="Hôpital Bendrihem Farhat"
                  width={118}
                  height={118}
                  priority
                  className="hospital-logo-image"
                />
              </div>
            </div>

            <div className="hospital-logo-divider" />

            <div
              className="hospital-brand-text"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {locale === "ar" ? (
                <>
                  <span className="hospital-brand-title-ar">
                    مستشفى
                  </span>

                  <span className="hospital-brand-name-ar">
                    بن دريهم فرحات
                  </span>
                </>
              ) : (
                <>
                  <span className="hospital-brand-title">
                    {locale === "fr" ? "HÔPITAL" : "HOSPITAL"}
                  </span>

                  <span className="hospital-brand-name">
                    BENDRIHEM FARHAT
                  </span>
                </>
              )}

              <span className="hospital-brand-subtitle">
                {hospitalSubtitle}
              </span>
            </div>
          </Link>

          {/* =================================================
              DESKTOP CONTENT
              ================================================= */}

          <div className="hospital-desktop-content">
            <nav
              className="hospital-navigation"
              aria-label={
                isRTL
                  ? "التنقل الرئيسي"
                  : locale === "fr"
                    ? "Navigation principale"
                    : "Main navigation"
              }
            >
              {navLinks.map((link, index) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`hospital-nav-link ${isActive(link.href) ? "active" : ""}`}
                    aria-current={isActive(link.href) ? "true" : undefined}
                    style={{
                      animationDelay: `${index * 80}ms`,
                    }}
                    onClick={() => handleLinkClick(link.href)}
                  >
                    <Icon size={17} strokeWidth={1.8} />

                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Controls: theme → language → login */}
            <div className="hospital-controls">
              <button
                type="button"
                onClick={toggleTheme}
                className="theme-toggle"
                aria-label={
                  isRTL
                    ? "تغيير المظهر"
                    : locale === "fr"
                      ? "Changer le thème"
                      : "Toggle theme"
                }
              >
                <span
                  className={
                    theme === "light"
                      ? "theme-icon active"
                      : "theme-icon"
                  }
                >
                  <Sun size={17} />
                </span>

                <span
                  className={
                    theme === "dark"
                      ? "theme-icon active dark-active"
                      : "theme-icon"
                  }
                >
                  <Moon size={17} />
                </span>
              </button>

              <div className="language-wrapper" ref={langRef}>
                <button
                  type="button"
                  onClick={() =>
                    setLangOpen((value) => !value)
                  }
                  className="language-button"
                  aria-label={
                    isRTL
                      ? "اختيار اللغة"
                      : locale === "fr"
                        ? "Choisir la langue"
                        : "Select language"
                  }
                  aria-expanded={langOpen}
                >
                  <Globe size={16} />

                  <span>{currentLocaleLabel}</span>

                  <ChevronDown
                    size={14}
                    className={
                      langOpen
                        ? "language-chevron open"
                        : "language-chevron"
                    }
                  />
                </button>

                {langOpen && (
                  <div className="language-dropdown" dir="ltr">
                    {LOCALES.map((language) => (
                      <button
                        type="button"
                        key={language.code}
                        onClick={() => {
                          setLocale(language.code);
                          setLangOpen(false);
                        }}
                        className={
                          language.code === locale
                            ? "language-option active"
                            : "language-option"
                        }
                      >
                        <span>
                          {getLocaleDisplay(language.code)}
                        </span>

                        {language.code === locale && (
                          <span className="language-active-dot" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {user && (
                <div className="hospital-user">
                  <Link
                    href={
                      user.role === "admin"
                        ? "/admin/dashboard"
                        : user.role === "doctor"
                          ? "/doctor/appointments"
                          : "/"
                    }
                    className="language-button"
                  >
                    <UserCircle size={16} />
                    <span>{user.full_name.split(" ")[0]}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="theme-toggle"
                    aria-label="Log out"
                    title="Log out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              MOBILE CONTROLS
              ================================================= */}

          <div className="hospital-mobile-controls">
            <button
              type="button"
              onClick={toggleTheme}
              className="mobile-icon-button"
              aria-label={
                isRTL
                  ? "تغيير المظهر"
                  : locale === "fr"
                    ? "Changer le thème"
                    : "Toggle theme"
              }
            >
              {theme === "dark" ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}
            </button>

            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setOpen((value) => !value)}
              aria-label={
                open
                  ? isRTL                    ? "إغلاق القائمة"
                    : locale === "fr"
                      ? "Fermer le menu"
                      : "Close menu"
                  : isRTL
                    ? "فتح القائمة"
                    : locale === "fr"
                      ? "Ouvrir le menu"
                      : "Open menu"
              }
              aria-expanded={open}
            >
              {open ? <X size={25} /> : <Menu size={25} />}
            </button>
          </div>
        </div>

        {open && (
          <div
            className="hospital-mobile-menu"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <nav
              className="mobile-navigation"
              aria-label={
                isRTL
                  ? "التنقل الرئيسي"
                  : locale === "fr"
                    ? "Navigation principale"
                    : "Main navigation"
              }
            >
              {navLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => handleLinkClick(link.href)}
                    className={`mobile-nav-link ${isActive(link.href) ? "active" : ""}`}
                    aria-current={isActive(link.href) ? "true" : undefined}
                  >
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mobile-language-section">
              <span className="mobile-language-label">
                {isRTL
                  ? "اللغة"
                  : locale === "fr"
                    ? "Langue"
                    : "Language"}
              </span>

              <div className="mobile-language-options" dir="ltr">
                {LOCALES.map((language) => (
                  <button
                    type="button"
                    key={language.code}
                    onClick={() => {
                      setLocale(language.code);
                      setOpen(false);
                    }}
                    className={
                      language.code === locale
                        ? "mobile-language-option active"
                        : "mobile-language-option"
                    }
                  >
                    {getLocaleDisplay(language.code)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mobile-language-section">
              {user && (
                <>
                  <Link
                    href={
                      user.role === "admin"
                        ? "/admin/dashboard"
                        : user.role === "doctor"
                          ? "/doctor/appointments"
                          : "/"
                    }
                    onClick={() => setOpen(false)}
                    className="mobile-nav-link"
                  >
                    <UserCircle size={18} />
                    <span>{user.full_name}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="mobile-nav-link"
                  >
                    <LogOut size={18} />
                    <span>
                      {isRTL
                        ? "تسجيل الخروج"
                        : locale === "fr"
                          ? "Déconnexion"
                          : "Log out"}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}