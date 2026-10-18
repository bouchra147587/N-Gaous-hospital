"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Check, X, CheckCheck, Ban, Phone, CalendarClock, Info, Inbox } from "lucide-react";
import { useTr } from "@/lib/accountI18n";
import { formatDate, pickField } from "@/lib/i18n";
import { formatWorkingDays, parseWorkingDays, shortHour } from "@/lib/schedule";
import type { Doctor } from "@/lib/api";
import {
  answerAppointment, getMyProfile, getMyStats, listMyAppointments,
  type AppointmentStatus, type DoctorAppointment, type DoctorStats,
} from "@/lib/doctorApi";

const FILTERS: ("" | AppointmentStatus)[] = ["", "pending", "confirmed", "completed", "rejected", "cancelled"];

const BADGE: Record<AppointmentStatus, string> = {
  pending: "dp-badge is-pending",
  confirmed: "dp-badge is-confirmed",
  completed: "dp-badge is-completed",
  rejected: "dp-badge is-rejected",
  cancelled: "dp-badge is-cancelled",
};

export default function DoctorAppointmentsPage() {
  const { t, locale } = useTr();
  const [me, setMe] = useState<Doctor | null>(null);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [items, setItems] = useState<DoctorAppointment[]>([]);
  const [filter, setFilter] = useState<"" | AppointmentStatus>("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const refreshStats = useCallback(() => {
    getMyStats().then(setStats).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listMyAppointments(filter));
    } catch {
      setBanner({ type: "error", message: t("doc.loadError") });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => { getMyProfile().then(setMe).catch(() => {}); refreshStats(); }, [refreshStats]);
  useEffect(() => { load(); }, [load]);

  async function answer(a: DoctorAppointment, status: AppointmentStatus) {
    setBusyId(a.id);
    try {
      const updated = await answerAppointment(a.id, status);
      setItems((prev) =>
        filter && updated.status !== filter
          ? prev.filter((x) => x.id !== a.id)
          : prev.map((x) => (x.id === a.id ? updated : x))
      );
      refreshStats();
      setBanner({ type: "success", message: t("doc.updated") });
    } catch {
      setBanner({ type: "error", message: t("doc.updateError") });
    } finally {
      setBusyId(null);
    }
  }

  const days = me ? parseWorkingDays(me.schedule_days) : [];
  const hasHours = !!(me && days.length && me.schedule_start && me.schedule_end);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{t("doc.title")}</h1>
          <p className="admin-page-subtitle">
            {me ? `${pickField(me as any, "full_name", locale)} — ` : ""}{t("doc.subtitle")}
          </p>
        </div>
      </div>

      {/* Working hours: read-only, set by the administration */}
      <div className={`dp-hours ${hasHours ? "" : "is-missing"}`}>
        <CalendarClock size={22} />
        <div>
          <b>{t("doc.hoursTitle")}</b>
          {hasHours ? (
            <span>{formatWorkingDays(days, locale)} · <bdi dir="ltr">{shortHour(me!.schedule_start)} – {shortHour(me!.schedule_end)}</bdi></span>
          ) : (
            <span>{t("doc.noHours")}</span>
          )}
          <small><Info size={13} /> {t("doc.hoursNote")}</small>
        </div>
      </div>

      {stats && (
        <div className="admin-stat-grid">
          <div className="admin-stat-card"><div className="admin-stat-value">{stats.pending}</div><div className="admin-stat-label">{t("doc.stat.pending")}</div></div>
          <div className="admin-stat-card"><div className="admin-stat-value">{stats.confirmed}</div><div className="admin-stat-label">{t("doc.stat.confirmed")}</div></div>
          <div className="admin-stat-card"><div className="admin-stat-value">{stats.total}</div><div className="admin-stat-label">{t("doc.stat.total")}</div></div>
        </div>
      )}

      {banner && <div className={`admin-banner is-${banner.type}`} role="status">{banner.message}</div>}

      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f || "all"}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={`admin-tab ${filter === f ? "is-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f ? t(`doc.status.${f}`) : t("doc.status.all")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-state">{t("doc.loading")}</div>
      ) : items.length === 0 ? (
        <div className="admin-empty-state"><Inbox size={28} /><p>{t("doc.empty")}</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("doc.col.date")}</th>
                <th>{t("doc.col.time")}</th>
                <th>{t("doc.col.patient")}</th>
                <th>{t("doc.col.phone")}</th>
                <th>{t("doc.col.notes")}</th>
                <th>{t("doc.col.status")}</th>
                <th>{t("doc.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.preferred_date ? formatDate(a.preferred_date, locale) : "—"}</td>
                  <td dir="ltr">{shortHour(a.preferred_time) || "—"}</td>
                  <td><b>{a.full_name}</b></td>
                  <td>
                    <a className="dp-phone" href={`tel:${a.phone}`} dir="ltr"><Phone size={14} /> {a.phone}</a>
                  </td>
                  <td className="dp-notes" dir="auto">{a.notes || "—"}</td>
                  <td><span className={BADGE[a.status]}>{t(`doc.status.${a.status}`)}</span></td>
                  <td>
                    <div className="admin-row-actions">
                      {a.status === "pending" && (
                        <>
                          <button type="button" className="admin-btn-primary" disabled={busyId === a.id} onClick={() => answer(a, "confirmed")}>
                            <Check size={14} /> {t("doc.act.confirm")}
                          </button>
                          <button type="button" className="admin-btn-secondary admin-btn-danger" disabled={busyId === a.id} onClick={() => answer(a, "rejected")}>
                            <X size={14} /> {t("doc.act.reject")}
                          </button>
                        </>
                      )}
                      {a.status === "confirmed" && (
                        <>
                          <button type="button" className="admin-btn-primary" disabled={busyId === a.id} onClick={() => answer(a, "completed")}>
                            <CheckCheck size={14} /> {t("doc.act.complete")}
                          </button>
                          <button type="button" className="admin-btn-secondary admin-btn-danger" disabled={busyId === a.id} onClick={() => answer(a, "cancelled")}>
                            <Ban size={14} /> {t("doc.act.cancel")}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
