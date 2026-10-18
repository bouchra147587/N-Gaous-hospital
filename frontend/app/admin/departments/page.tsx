"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, LayoutTemplate } from "lucide-react";
import DepartmentDetailsEditor from "@/components/DepartmentDetailsEditor";
import ImageUploadField from "@/components/ImageUploadField";
import {
  listAdminDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  AdminDepartment,
} from "@/lib/adminApi";
import { useAdminT } from "@/lib/adminI18n";

const EMPTY: Partial<AdminDepartment> = {
  name_ar: "",
  name_fr: "",
  name_en: "",
  slug: "",
  description_ar: "",
  description_fr: "",
  description_en: "",
  icon: "",
  image_url: "",
  capacity_beds: undefined,
  phone: "",
  location: "",
  opening_hours: "",
  is_active: true,
  display_order: 0,
};

export default function DepartmentsAdminPage() {
  const { t } = useAdminT();
  const [items, setItems] = useState<AdminDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [detailsFor, setDetailsFor] = useState<AdminDepartment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminDepartment | null>(null);
  const [form, setForm] = useState<Partial<AdminDepartment>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    listAdminDepartments(search)
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

  function openEdit(dep: AdminDepartment) {
    setEditing(dep);
    setForm(dep);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await updateDepartment(editing.id, form);
        setBanner({ type: "success", message: t("Department updated.") });
      } else {
        await createDepartment(form);
        setBanner({ type: "success", message: t("Department created.") });
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setFormError(message || t("Could not save department."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(dep: AdminDepartment) {
    if (!confirm(t("Delete this item? This cannot be undone."))) return;
    try {
      await deleteDepartment(dep.id);
      setBanner({ type: "success", message: t("Department deleted.") });
      load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // Backend returns 409 with a message about doctors still assigned.
      if (message.includes("doctor")) {
        if (confirm(t("Delete this item? This cannot be undone."))) {
          try {
            await deleteDepartment(dep.id, true);
            setBanner({ type: "success", message: t("Department deleted.") });
            load();
          } catch (err2: unknown) {
            setBanner({ type: "error", message: err2 instanceof Error ? err2.message : String(err2) });
          }
        }
      } else {
        setBanner({ type: "error", message });
      }
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{t("Departments")}</h1>
          <p className="admin-page-subtitle">{t("Manage the hospital's medical departments.")}</p>
        </div>
      </div>

      {banner && <div className={`admin-banner is-${banner.type}`}>{banner.message}</div>}

      <div className="admin-toolbar">
        <input
          className="admin-search-input"
          placeholder={t("Search departments…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button type="button" className="admin-btn-primary" onClick={openCreate}>
          <Plus size={16} />
          {t("Add Department")}
        </button>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-loading-state">{t("Loading departments…")}</div>
        ) : error ? (
          <div className="admin-error-state">Could not load departments: {error}</div>
        ) : items.length === 0 ? (
          <div className="admin-empty-state">{t("No departments yet. Click \"Add Department\" to create one.")}</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("Name")}</th>
                <th>{t("Slug")}</th>
                <th>{t("Status")}</th>
                <th>{t("Order")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((dep) => (
                <tr key={dep.id}>
                  <td>{dep.name_ar}</td>
                  <td>{dep.slug}</td>
                  <td>
                    <span className={`admin-badge ${dep.is_active ? "is-active" : "is-inactive"}`}>
                      {dep.is_active ? t("Active") : t("Inactive")}
                    </span>
                  </td>
                  <td>{dep.display_order}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="admin-btn-secondary" onClick={() => setDetailsFor(dep)}>
                        <LayoutTemplate size={13} /> {t("Details page")}
                      </button>
                      <button type="button" className="admin-btn-secondary" onClick={() => openEdit(dep)}>
                        <Pencil size={13} /> {t("Edit")}
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary admin-btn-danger"
                        onClick={() => handleDelete(dep)}
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

      {detailsFor && (
        <DepartmentDetailsEditor
          departmentId={detailsFor.id}
          departmentName={detailsFor.name_ar}
          onClose={() => setDetailsFor(null)}
          onSaved={(message) => setBanner({ type: "success", message })}
        />
      )}

      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">{editing ? t("Edit Department") : t("Add Department")}</h2>
            {formError && <div className="admin-banner is-error">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="admin-form-grid">
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Name (Arabic) *")}</label>
                  <input
                    required
                    className="admin-form-input"
                    value={form.name_ar || ""}
                    onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Name (French)")}</label>
                  <input
                    className="admin-form-input"
                    value={form.name_fr || ""}
                    onChange={(e) => setForm({ ...form, name_fr: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Name (English)")}</label>
                  <input
                    className="admin-form-input"
                    value={form.name_en || ""}
                    onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Slug *")}</label>
                  <input
                    required
                    className="admin-form-input"
                    placeholder={t("e.g. emergency")}
                    value={form.slug || ""}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
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
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Icon")}</label>
                  <input
                    className="admin-form-input"
                    value={form.icon || ""}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  />
                </div>
                <ImageUploadField
                  label={t("Department image")}
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                />
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Capacity (beds)")}</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={form.capacity_beds ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, capacity_beds: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Phone")}</label>
                  <input
                    className="admin-form-input"
                    value={form.phone || ""}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Location")}</label>
                  <input
                    className="admin-form-input"
                    value={form.location || ""}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Opening hours")}</label>
                  <input
                    className="admin-form-input"
                    value={form.opening_hours || ""}
                    onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
                  />
                </div>
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
                  {saving ? t("Saving…") : editing ? t("Save changes") : t("Create department")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
