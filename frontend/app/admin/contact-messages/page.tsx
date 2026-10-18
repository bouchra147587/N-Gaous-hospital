"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, ArchiveRestore, ArrowLeft, Mail, MailOpen, MailCheck, Trash2, Inbox } from "lucide-react";
import {
  AdminContactMessage,
  ContactMessageStats,
  MessageStatus,
  deleteContactMessage,
  getContactMessageStats,
  listContactMessages,
  updateContactMessageStatus,
} from "@/lib/adminApi";
import { formatDate } from "@/lib/i18n";
import { useAdminT } from "@/lib/adminI18n";

const FILTERS: ("" | MessageStatus)[] = ["", "unread", "read", "archived"];

export default function ContactMessagesPage() {
  const { t, locale } = useAdminT();
  const [items, setItems] = useState<AdminContactMessage[]>([]);
  const [stats, setStats] = useState<ContactMessageStats | null>(null);
  const [filter, setFilter] = useState<"" | MessageStatus>("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const refreshStats = useCallback(() => {
    getContactMessageStats().then(setStats).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listContactMessages({ status: filter, search: debounced }));
    } catch (err) {
      setBanner({ type: "error", message: err instanceof Error ? err.message : t("msg.loadError") });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, debounced]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { refreshStats(); }, [refreshStats]);

  const selected = useMemo(() => items.find((m) => m.id === selectedId) || null, [items, selectedId]);

  async function setStatus(m: AdminContactMessage, status: MessageStatus) {
    try {
      const updated = await updateContactMessageStatus(m.id, status);
      setItems((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
      refreshStats();
    } catch (err) {
      setBanner({ type: "error", message: err instanceof Error ? err.message : t("msg.updateError") });
    }
  }

  async function openMessage(m: AdminContactMessage) {
    setSelectedId(m.id);
    if (m.status === "unread") await setStatus(m, "read"); // auto-mark as read
  }

  async function remove(m: AdminContactMessage) {
    if (!window.confirm(t("common.confirmDelete"))) return;
    try {
      await deleteContactMessage(m.id);
      setItems((prev) => prev.filter((x) => x.id !== m.id));
      setSelectedId(null);
      refreshStats();
      setBanner({ type: "success", message: t("msg.deleted") });
    } catch (err) {
      setBanner({ type: "error", message: err instanceof Error ? err.message : t("msg.updateError") });
    }
  }

  const dt = (s: string) =>
    `${formatDate(s, locale)} · ${new Date(s).toLocaleTimeString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-GB", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{t("msg.title")}</h1>
          <p className="admin-page-subtitle">{t("msg.subtitle")}</p>
        </div>
      </div>

      {stats && (
        <div className="admin-stat-grid">
          <div className="admin-stat-card"><div className="admin-stat-value">{stats.total}</div><div className="admin-stat-label">{t("msg.total")}</div></div>
          <div className="admin-stat-card"><div className="admin-stat-value">{stats.unread}</div><div className="admin-stat-label">{t("msg.unread")}</div></div>
          <div className="admin-stat-card"><div className="admin-stat-value">{stats.archived}</div><div className="admin-stat-label">{t("msg.archived")}</div></div>
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
              onClick={() => { setFilter(f); setSelectedId(null); }}
            >
              {t(`msg.filter.${f || "all"}`)}
            </button>
          ))}
        </div>
        <input
          className="admin-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("msg.searchPlaceholder")}
          aria-label={t("common.search")}
        />
      </div>

      <div className={`admin-inbox ${selected ? "has-selection" : ""}`}>
        <div className="admin-inbox-list">
          {loading && <div className="admin-loading-state">{t("common.loading")}</div>}
          {!loading && items.length === 0 && (
            <div className="admin-empty-state"><Inbox size={28} /><p>{t("msg.empty")}</p></div>
          )}
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`admin-inbox-item ${m.id === selectedId ? "is-selected" : ""} ${m.status === "unread" ? "is-unread" : ""}`}
              onClick={() => openMessage(m)}
            >
              <span className="admin-inbox-dot" aria-hidden="true" />
              <span className="admin-inbox-body">
                <span className="admin-inbox-top">
                  <strong>{m.name}</strong>
                  <time>{formatDate(m.created_at, locale)}</time>
                </span>
                <span className="admin-inbox-subject">{m.subject || t("msg.noSubject")}</span>
                <span className="admin-inbox-preview">{m.message}</span>
              </span>
            </button>
          ))}
        </div>

        <article className="admin-inbox-detail">
          {!selected ? (
            <div className="admin-empty-state"><MailOpen size={28} /><p>{t("msg.selectHint")}</p></div>
          ) : (
            <>
              <button type="button" className="admin-btn-secondary admin-inbox-back" onClick={() => setSelectedId(null)}>
                <ArrowLeft size={14} className="admin-flip-rtl" /> {t("msg.back")}
              </button>
              <div className="admin-detail-head">
                <h2>{selected.subject || t("msg.noSubject")}</h2>
                <span className={`admin-badge is-msg-${selected.status}`}>{t(`msg.status.${selected.status}`)}</span>
              </div>

              <dl className="admin-detail-meta">
                <div><dt>{t("msg.from")}</dt><dd>{selected.name}</dd></div>
                {selected.email && <div><dt>{t("msg.email")}</dt><dd dir="ltr">{selected.email}</dd></div>}
                {selected.phone && <div><dt>{t("msg.phone")}</dt><dd dir="ltr">{selected.phone}</dd></div>}
                <div><dt>{t("msg.received")}</dt><dd>{dt(selected.created_at)}</dd></div>
              </dl>

              <p className="admin-detail-message" dir="auto">{selected.message}</p>

              <div className="admin-detail-actions">
                {selected.status !== "unread" && (
                  <button type="button" className="admin-btn-secondary" onClick={() => setStatus(selected, "unread")}>
                    <MailCheck size={14} /> {t("msg.markUnread")}
                  </button>
                )}
                {selected.status === "unread" && (
                  <button type="button" className="admin-btn-secondary" onClick={() => setStatus(selected, "read")}>
                    <MailOpen size={14} /> {t("msg.markRead")}
                  </button>
                )}
                {selected.status !== "archived" ? (
                  <button type="button" className="admin-btn-secondary" onClick={() => setStatus(selected, "archived")}>
                    <Archive size={14} /> {t("msg.archive")}
                  </button>
                ) : (
                  <button type="button" className="admin-btn-secondary" onClick={() => setStatus(selected, "read")}>
                    <ArchiveRestore size={14} /> {t("msg.unarchive")}
                  </button>
                )}
                <button type="button" className="admin-btn-secondary admin-btn-danger" onClick={() => remove(selected)}>
                  <Trash2 size={14} /> {t("common.delete")}
                </button>
              </div>
            </>
          )}
        </article>
      </div>
    </div>
  );
}
