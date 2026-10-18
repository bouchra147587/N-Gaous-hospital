"use client";

import { useEffect, useState } from "react";
import { getDashboardStats, DashboardStats } from "@/lib/adminApi";
import { useAdminT } from "@/lib/adminI18n";

const CARD_DEFS: { key: keyof DashboardStats; label: string }[] = [
  { key: "departments", label: "dash.departments" },
  { key: "doctors", label: "dash.doctors" },
  { key: "services", label: "dash.services" },
  { key: "news", label: "dash.news" },
  { key: "pending_appointments", label: "dash.pending" },
  { key: "unread_messages", label: "dash.unread" },
];

export default function AdminDashboardPage() {
  const { t } = useAdminT();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{t("dash.title")}</h1>
          <p className="admin-page-subtitle">{t("dash.subtitle")}</p>
        </div>
      </div>

      {loading && <div className="admin-loading-state">{t("dash.loading")}</div>}
      {error && <div className="admin-error-state">{t("dash.error")}: {error}</div>}

      {stats && (
        <div className="admin-stat-grid">
          {CARD_DEFS.map((def) => (
            <div key={def.key} className="admin-stat-card">
              <div className="admin-stat-value">{stats[def.key]}</div>
              <div className="admin-stat-label">{t(def.label)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
