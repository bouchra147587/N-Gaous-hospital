"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";
import {
  listAdminServices,
  createService,
  updateService,
  deleteService,
  AdminService,
} from "@/lib/adminApi";
import { useAdminT } from "@/lib/adminI18n";

const EMPTY: Partial<AdminService> = {
  title_ar: "",
  title_fr: "",
  title_en: "",
  description_ar: "",
  description_fr: "",
  description_en: "",
  icon: "",
  image_url: "",
  available_24_7: false,
  is_active: true,
  display_order: 0,
};

export default function ServicesAdminPage() {
  const { t } = useAdminT();
  const [items, setItems] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [form, setForm] = useState<Partial<AdminService>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    listAdminServices(search)
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
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(svc: AdminService) {
    setEditing(svc);
    setForm(svc);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await updateService(editing.id, form);
        setBanner({ type: "success", message: t("Service updated.") });
      } else {
        await createService(form);
        setBanner({ type: "success", message: t("Service created.") });
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setFormError(message || t("Could not save service."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(svc: AdminService) {
    if (!confirm(t("Delete this item? This cannot be undone."))) return;
    try {
      await deleteService(svc.id);
      setBanner({ type: "success", message: t("Service deleted.") });
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
          <h1 className="admin-page-title">{t("Services")}</h1>
          <p className="admin-page-subtitle">{t("Manage the hospital's public-facing services.")}</p>
        </div>
      </div>

      {banner && <div className={`admin-banner is-${banner.type}`}>{banner.message}</div>}

      <div className="admin-toolbar">
        <input
          className="admin-search-input"
          placeholder={t("Search services…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button type="button" className="admin-btn-primary" onClick={openCreate}>
          <Plus size={16} />
          {t("Add Service")}
        </button>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-loading-state">{t("Loading services…")}</div>
        ) : error ? (
          <div className="admin-error-state">Could not load services: {error}</div>
        ) : items.length === 0 ? (
          <div className="admin-empty-state">{t("No services yet. Click \"Add Service\" to create one.")}</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("Title")}</th>
                <th>24/7</th>
                <th>{t("Status")}</th>
                <th>{t("Order")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((svc) => (
                <tr key={svc.id}>
                  <td>{svc.title_ar}</td>
                  <td>{svc.available_24_7 ? t("Yes") : t("No")}</td>
                  <td>
                    <span className={`admin-badge ${svc.is_active ? "is-active" : "is-inactive"}`}>
                      {svc.is_active ? t("Active") : t("Inactive")}
                    </span>
                  </td>
                  <td>{svc.display_order}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="admin-btn-secondary" onClick={() => openEdit(svc)}>
                        <Pencil size={13} /> {t("Edit")}
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary admin-btn-danger"
                        onClick={() => handleDelete(svc)}
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
            <h2 className="admin-modal-title">{editing ? t("Edit Service") : t("Add Service")}</h2>
            {formError && <div className="admin-banner is-error">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="admin-form-grid">
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Title (Arabic) *")}</label>
                  <input
                    required
                    className="admin-form-input"
                    value={form.title_ar || ""}
                    onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Title (French)")}</label>
                  <input
                    className="admin-form-input"
                    value={form.title_fr || ""}
                    onChange={(e) => setForm({ ...form, title_fr: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Title (English)")}</label>
                  <input
                    className="admin-form-input"
                    value={form.title_en || ""}
                    onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Icon")}</label>
                  <input
                    className="admin-form-input"
                    value={form.icon || ""}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  />
                </div>
                <div className="admin-form-field is-full">
                  <label className="admin-form-label">{t("Description (Arabic)")}</label>
                  <textarea
                    className="admin-form-textarea"
                    value={form.description_ar || ""}
                    onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Description (French)")}</label>
                  <textarea
                    className="admin-form-textarea"
                    value={form.description_fr || ""}
                    onChange={(e) => setForm({ ...form, description_fr: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Description (English)")}</label>
                  <textarea
                    className="admin-form-textarea"
                    value={form.description_en || ""}
                    onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                  />
                </div>
                <ImageUploadField
                  label={t("Service image")}
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                />
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Display order")}</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={form.display_order ?? 0}
                    onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-checkbox">
                    <input
                      type="checkbox"
                      checked={form.available_24_7 ?? false}
                      onChange={(e) => setForm({ ...form, available_24_7: e.target.checked })}
                    />
                    {t("Available 24/7")}
                  </label>
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-checkbox">
                    <input
                      type="checkbox"
                      checked={form.is_active ?? true}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />
                    {t("Active (visible on public site)")}
                  </label>
                </div>
              </div>
              <div className="admin-form-actions">
                <button type="button" className="admin-btn-secondary" onClick={() => setModalOpen(false)}>
                  {t("Cancel")}
                </button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? t("Saving…") : editing ? t("Save changes") : t("Create service")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
