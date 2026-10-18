"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Power, Trash2, Clock, UserCheck, Inbox, KeyRound } from "lucide-react";
import { useTr } from "@/lib/accountI18n";
import { formatDate, pickField } from "@/lib/i18n";
import {
  DoctorAccount, deleteDoctorAccount, listDoctorAccounts, setDoctorAccountActive, resetDoctorPassword,
} from "@/lib/adminApi";

/**
 * Administrator-only. A doctor's sign-up stays "pending" until it is approved
 * here; only doctors with an ACTIVE account can be booked on the website.
 */
export default function DoctorAccountsPage() {
  const { t, locale } = useTr();
  const [items, setItems] = useState<DoctorAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [resetInfo, setResetInfo] = useState<{ email: string; pw: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listDoctorAccounts());
      setError("");
    } catch {
      setError(t("acc.error"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(a: DoctorAccount, active: boolean) {
    setBusyId(a.id);
    try {
      await setDoctorAccountActive(a.id, active);
      setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_active: active } : x)));
    } catch {
      setError(t("acc.error"));
    } finally {
      setBusyId(null);
    }
  }

  async function resetPw(a: DoctorAccount) {
    if (!window.confirm(t("acc.confirmReset"))) return;
    setBusyId(a.id);
    try {
      const r = await resetDoctorPassword(a.id);
      setResetInfo({ email: r.email, pw: r.temporary_password });
    } catch {
      setError(t("acc.error"));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(a: DoctorAccount) {
    if (!window.confirm(t("acc.confirmDelete"))) return;
    setBusyId(a.id);
    try {
      await deleteDoctorAccount(a.id);
      setItems((prev) => prev.filter((x) => x.id !== a.id));
    } catch {
      setError(t("acc.error"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{t("acc.title")}</h1>
          <p className="admin-page-subtitle">{t("acc.subtitle")}</p>
        </div>
      </div>

      {error && <div className="admin-banner is-error" role="alert">{error}</div>}

      {resetInfo && (
        <div className="admin-banner" role="status" style={{ display: "grid", gap: 6 }}>
          <b>{t("acc.resetDone")}</b>
          <span dir="ltr">{resetInfo.email}</span>
          <code dir="ltr" style={{ fontSize: 18, fontWeight: 800, userSelect: "all" }}>{resetInfo.pw}</code>
          <small>{t("acc.resetHint")}</small>
          <button type="button" className="admin-btn-secondary" style={{ width: "fit-content" }} onClick={() => setResetInfo(null)}>OK</button>
        </div>
      )}

      {loading ? (
        <div className="admin-loading-state">{t("doc.loading")}</div>
      ) : items.length === 0 ? (
        <div className="admin-empty-state"><Inbox size={28} /><p>{t("acc.empty")}</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("acc.col.doctor")}</th>
                <th>{t("acc.col.email")}</th>
                <th>{t("acc.col.created")}</th>
                <th>{t("acc.col.status")}</th>
                <th>{t("acc.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => {
                const name = pickField(
                  { name_ar: a.doctor_name_ar, name_fr: a.doctor_name_fr, name_en: a.doctor_name_en } as any,
                  "name",
                  locale
                );
                return (
                  <tr key={a.id}>
                    <td><b>{name || "—"}</b></td>
                    <td dir="ltr">{a.email}</td>
                    <td>{formatDate(a.created_at, locale)}</td>
                    <td>
                      {a.email_verified === false ? (
                        <span className="dp-badge is-rejected"><Clock size={13} /> {t("acc.unverified")}</span>
                      ) : a.is_active ? (
                        <span className="dp-badge is-confirmed"><UserCheck size={13} /> {t("acc.active")}</span>
                      ) : (
                        <span className="dp-badge is-pending"><Clock size={13} /> {t("acc.pending")}</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        {a.is_active ? (
                          <button type="button" className="admin-btn-secondary" disabled={busyId === a.id} onClick={() => toggle(a, false)}>
                            <Power size={14} /> {t("acc.deactivate")}
                          </button>
                        ) : (
                          <button type="button" className="admin-btn-primary" disabled={busyId === a.id || a.email_verified === false} onClick={() => toggle(a, true)}>
                            <Check size={14} /> {t("acc.approve")}
                          </button>
                        )}
                        <button type="button" className="admin-btn-secondary" disabled={busyId === a.id} onClick={() => resetPw(a)}>
                          <KeyRound size={14} /> {t("acc.resetPw")}
                        </button>
                        <button type="button" className="admin-btn-secondary admin-btn-danger" disabled={busyId === a.id} onClick={() => remove(a)}>
                          <Trash2 size={14} /> {t("acc.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
