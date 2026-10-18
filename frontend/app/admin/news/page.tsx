"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";
import GalleryUploadField from "@/components/GalleryUploadField";
import { LOCALES, type Locale } from "@/lib/i18n";
import { listAdminNews, createNews, updateNews, deleteNews, AdminNews } from "@/lib/adminApi";
import { useAdminT } from "@/lib/adminI18n";

const EMPTY: Partial<AdminNews> = {
  title_ar: "",
  title_fr: "",
  title_en: "",
  excerpt_ar: "",
  excerpt_fr: "",
  excerpt_en: "",
  content_ar: "",
  content_fr: "",
  content_en: "",
  image_url: "",
  gallery: [],
  published_at: null,
  category_ar: "",
  category_fr: "",
  category_en: "",
  is_published: false,
};

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewsAdminPage() {
  const { t, locale } = useAdminT();
  const [lang, setLang] = useState<Locale>("ar");
  const [items, setItems] = useState<AdminNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminNews | null>(null);
  const [form, setForm] = useState<Partial<AdminNews>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    listAdminNews(search)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setLang(locale);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(item: AdminNews) {
    setEditing(item);
    setForm({ ...item, gallery: item.gallery ?? [] });
    setLang(locale);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!String(form.title_ar || "").trim()) {
      setLang("ar");
      setFormError(t("anews.needArabicTitle"));
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = { ...form };
      if (payload.is_published && !payload.published_at) {
        payload.published_at = new Date().toISOString();
      }
      if (editing) {
        await updateNews(editing.id, payload);
        setBanner({ type: "success", message: t("Article updated.") });
      } else {
        await createNews(payload);
        setBanner({ type: "success", message: t("Article created.") });
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setFormError(message || t("Could not save article."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: AdminNews) {
    if (!confirm(t("Delete this item? This cannot be undone."))) return;
    try {
      await deleteNews(item.id);
      setBanner({ type: "success", message: t("Article deleted.") });
      load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setBanner({ type: "error", message });
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{t("News")}</h1>
          <p className="admin-page-subtitle">{t("Manage articles shown on the public news page.")}</p>
        </div>
      </div>

      {banner && <div className={`admin-banner is-${banner.type}`}>{banner.message}</div>}

      <div className="admin-toolbar">
        <input
          className="admin-search-input"
          placeholder={t("Search articles…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button type="button" className="admin-btn-primary" onClick={openCreate}>
          <Plus size={16} />
          {t("Add Article")}
        </button>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-loading-state">{t("Loading articles…")}</div>
        ) : error ? (
          <div className="admin-error-state">Could not load articles: {error}</div>
        ) : items.length === 0 ? (
          <div className="admin-empty-state">{t("No articles yet. Click \"Add Article\" to create one.")}</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("Title")}</th>
                <th>{t("Category")}</th>
                <th>{t("anews.publishedAt")}</th>
                <th>{t("Status")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title_ar}</td>
                  <td>{item.category_ar || "—"}</td>
                  <td>{item.published_at ? new Date(item.published_at).toLocaleDateString() : "—"}</td>
                  <td>
                    <span className={`admin-badge ${item.is_published ? "is-active" : "is-inactive"}`}>
                      {item.is_published ? t("Published") : t("Draft")}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="admin-btn-secondary" onClick={() => openEdit(item)}>
                        <Pencil size={13} /> {t("Edit")}
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary admin-btn-danger"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 size={13} /> {t("Delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">{editing ? t("Edit Article") : t("Add Article")}</h2>
            {formError && <div className="admin-banner is-error">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="admin-form-grid">
                <ImageUploadField
                  label={t("anews.cover")}
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                />
                <GalleryUploadField
                  label={t("anews.gallery")}
                  hint={t("anews.galleryHint")}
                  value={form.gallery ?? []}
                  onChange={(urls) => setForm({ ...form, gallery: urls })}
                />

                <div className="admin-form-field is-full">
                  <span className="admin-form-label">{t("anews.editLang")}</span>
                  <div className="admin-tabs" role="tablist">
                    {LOCALES.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        role="tab"
                        aria-selected={lang === l.code}
                        className={`admin-tab ${lang === l.code ? "is-active" : ""}`}
                        onClick={() => setLang(l.code)}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const dirAttr = LOCALES.find((l) => l.code === lang)!.dir;
                  const val = (base: string) => ((form as Record<string, unknown>)[`${base}_${lang}`] as string) || "";
                  const set = (base: string, v: string) => setForm({ ...form, [`${base}_${lang}`]: v });
                  return (
                    <>
                      <div className="admin-form-field is-full">
                        <label className="admin-form-label">
                          {t("Title")} {lang === "ar" && <span className="admin-required">*</span>}
                          <span className="admin-lang-chip">{lang.toUpperCase()}</span>
                        </label>
                        <input className="admin-form-input" dir={dirAttr} value={val("title")} onChange={(e) => set("title", e.target.value)} />
                      </div>
                      <div className="admin-form-field is-full">
                        <label className="admin-form-label">
                          {t("Category")}<span className="admin-lang-chip">{lang.toUpperCase()}</span>
                        </label>
                        <input className="admin-form-input" dir={dirAttr} value={val("category")} onChange={(e) => set("category", e.target.value)} />
                      </div>
                      <div className="admin-form-field is-full">
                        <label className="admin-form-label">
                          {t("anews.excerpt")}<span className="admin-lang-chip">{lang.toUpperCase()}</span>
                        </label>
                        <textarea className="admin-form-textarea" rows={3} dir={dirAttr} value={val("excerpt")} onChange={(e) => set("excerpt", e.target.value)} />
                      </div>
                      <div className="admin-form-field is-full">
                        <label className="admin-form-label">
                          {t("anews.content")}<span className="admin-lang-chip">{lang.toUpperCase()}</span>
                        </label>
                        <textarea className="admin-form-textarea" rows={9} dir={dirAttr} value={val("content")} onChange={(e) => set("content", e.target.value)} />
                        <p className="admin-form-hint">{t("anews.contentHint")}</p>
                      </div>
                    </>
                  );
                })()}

                <div className="admin-form-field">
                  <label className="admin-form-label">{t("anews.publishedAt")}</label>
                  <input
                    type="datetime-local"
                    className="admin-form-input"
                    dir="ltr"
                    value={toLocalInput(form.published_at)}
                    onChange={(e) =>
                      setForm({ ...form, published_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                    }
                  />
                  <p className="admin-form-hint">{t("anews.publishedAtHint")}</p>
                </div>

                <label className="admin-switch is-full">
                  <input
                    type="checkbox"
                    checked={form.is_published ?? false}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  />
                  <span className="admin-switch-track" aria-hidden="true" />
                  <span>{t("Published (visible on public site)")}</span>
                </label>
              </div>
              <div className="admin-form-actions">
                <button type="button" className="admin-btn-secondary" onClick={() => setModalOpen(false)}>
                  {t("Cancel")}
                </button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? t("Saving…") : editing ? t("Save changes") : t("Create article")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
