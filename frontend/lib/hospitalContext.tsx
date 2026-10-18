"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useI18n, type Locale } from "@/lib/i18n";
import type { Hospital } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const Ctx = createContext<Hospital | null>(null);

/** Loads the hospital info edited in the admin panel (Hospital Info page) once for the whole site. */
export function HospitalProvider({ children }: { children: ReactNode }) {
  const [hospital, setHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/api/hospital`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((h) => alive && setHospital(h))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return <Ctx.Provider value={hospital}>{children}</Ctx.Provider>;
}

export function useHospital(): Hospital | null {
  return useContext(Ctx);
}

/** Language-aware helper: admin value for the current language, else the built-in default text. */
export function useHospitalText() {
  const h = useHospital();
  const { locale } = useI18n();
  const clean = (v?: string | null) => (v && v.trim() ? v.trim() : "");

  /** base = "name" | "description" | "about_title" | "about_content" | "mission" | "vision" | "values" | "history" */
  const text = (base: string, fallback: string): string => {
    if (!h) return fallback;
    const rec = h as unknown as Record<string, string | null | undefined>;
    return clean(rec[`${base}_${locale as Locale}`]) || fallback;
  };
  /** language-independent field (phone, email, address...) */
  const plain = (key: keyof Hospital, fallback: string): string => {
    if (!h) return fallback;
    return clean(h[key] as string | null | undefined) || fallback;
  };
  return { h, text, plain };
}
