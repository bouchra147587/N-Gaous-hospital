"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  HeartPulse,
  Newspaper,
  Menu,
  X,
  Hospital,
  Mail,
  Landmark,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePanelOffset } from "@/lib/usePanelOffset";
import { useAdminT } from "@/lib/adminI18n";
import { getContactMessageStats, listDoctorAccounts } from "@/lib/adminApi";
import { useTr } from "@/lib/accountI18n";

const NAV_ITEMS = [
  { href: "/admin/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { href: "/admin/hospital-info", key: "nav.hospitalInfo", icon: Hospital },
  { href: "/admin/departments", key: "nav.departments", icon: Building2 },
  { href: "/admin/doctors", key: "nav.doctors", icon: Stethoscope },
  { href: "/admin/services", key: "nav.services", icon: HeartPulse },
  { href: "/admin/news", key: "nav.news", icon: Newspaper },
  { href: "/admin/administration", key: "nav.administration", icon: Landmark },
  { href: "/admin/doctor-accounts", key: "acc.nav", icon: UserCheck },
  { href: "/admin/contact-messages", key: "nav.messages", icon: Mail },
];

/**
 * The middleware already blocks unauthenticated/non-admin requests to
 * /admin/* at the edge (see middleware.ts). This client-side check is a
 * second layer so the UI doesn't flash admin content before redirecting.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  usePanelOffset();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const { t: tAdmin } = useAdminT();
  const { t: tAcc } = useTr();
  // "acc.*" keys live in the account dictionary, everything else in the admin one.
  const t = (key: string) => (key.startsWith("acc.") ? tAcc(key) : tAdmin(key));
  const [pendingDoctors, setPendingDoctors] = useState(0);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    getContactMessageStats().then((s) => setUnread(s.unread)).catch(() => {});
    listDoctorAccounts()
      .then((l) => setPendingDoctors(l.filter((x) => !x.is_active).length))
      .catch(() => {});
  }, [user, pathname]);

  if (loading || !user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="admin-shell">
      {/* Mobile top bar */}
      <div className="admin-mobile-bar">
        <button
          type="button"
          className="admin-drawer-toggle"
          onClick={() => setDrawerOpen((v) => !v)}
          aria-label={t("nav.toggleMenu")}
        >
          {drawerOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="admin-mobile-title">{t("nav.admin")}</span>
      </div>

      {drawerOpen && (
        <div className="admin-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
      )}

      <aside className={`admin-sidebar ${drawerOpen ? "is-open" : ""}`}>
        <div className="admin-sidebar-brand">
          <Hospital size={22} />
          <span>{t("nav.brand")}</span>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const badge = item.href.endsWith("contact-messages")
              ? unread
              : item.href.endsWith("doctor-accounts")
                ? pendingDoctors
                : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar-link ${active ? "is-active" : ""}`}
              >
                <Icon size={18} />
                <span>{t(item.key)}</span>
                {badge > 0 && <span className="admin-nav-badge">{badge}</span>}
              </Link>
            );
          })}
        </nav>

      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
