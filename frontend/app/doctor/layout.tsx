"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarCheck, KeyRound, Menu, X, Stethoscope, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePanelOffset } from "@/lib/usePanelOffset";
import { useTr } from "@/lib/accountI18n";

/**
 * Doctor space shell. Same look as the administration panel, but with a single
 * job: answering the doctor's own appointments. Nothing here can edit website
 * content; the backend also refuses every admin endpoint for doctor accounts.
 */
export default function DoctorLayout({ children }: { children: ReactNode }) {
  usePanelOffset();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t, locale } = useTr();

  useEffect(() => {
    if (!loading && (!user || user.role !== "doctor")) {
      router.push("/login?type=doctor");
    }
  }, [loading, user, router]);

  useEffect(() => setDrawerOpen(false), [pathname]);

  if (loading || !user || user.role !== "doctor") return null;

  return (
    <div className="admin-shell">
      <div className="admin-mobile-bar">
        <button
          type="button"
          className="admin-drawer-toggle"
          onClick={() => setDrawerOpen((v) => !v)}
          aria-label={t("doc.menu")}
        >
          {drawerOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="admin-mobile-title">{t("doc.brand")}</span>
      </div>

      {drawerOpen && <div className="admin-drawer-backdrop" onClick={() => setDrawerOpen(false)} />}

      <aside className={`admin-sidebar ${drawerOpen ? "is-open" : ""}`}>
        <div className="admin-sidebar-brand">
          <Stethoscope size={22} />
          <span>{t("doc.brand")}</span>
        </div>

        <nav className="admin-sidebar-nav">
          <Link
            href="/doctor/appointments"
            className={`admin-sidebar-link ${pathname.startsWith("/doctor/appointments") ? "is-active" : ""}`}
          >
            <CalendarCheck size={18} />
            <span>{t("doc.nav.appointments")}</span>
          </Link>
          <Link
            href="/doctor/password"
            className={`admin-sidebar-link ${pathname.startsWith("/doctor/password") ? "is-active" : ""}`}
          >
            <KeyRound size={18} />
            <span>{{ ar: "كلمة المرور", fr: "Mot de passe", en: "Password" }[locale as "ar" | "fr" | "en"]}</span>
          </Link>
          <Link href="/" className="admin-sidebar-link">
            <Home size={18} />
            <span>{t("doc.nav.website")}</span>
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <p className="admin-sidebar-user-name">{user.full_name}</p>
            <p className="admin-sidebar-user-role">{t("doc.role")}</p>
          </div>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
