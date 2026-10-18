"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Clock, CalendarDays } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";
import {
  listAdminDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  listAdminDepartments,
  AdminDoctor,
  AdminDepartment,
} from "@/lib/adminApi";
import { useAdminT } from "@/lib/adminI18n";

/* ----------------------------------------------------------------
   Constants
   ---------------------------------------------------------------- */

const DAYS = [
  { idx: 0, label: "Sun" },
  { idx: 1, label: "Mon" },
  { idx: 2, label: "Tue" },
  { idx: 3, label: "Wed" },
  { idx: 4, label: "Thu" },
  { idx: 5, label: "Fri" },
  { idx: 6, label: "Sat" },
];

const EMPTY: Partial<AdminDoctor> = {
  full_name_ar: "",
  full_name_fr: "",
  full_name_en: "",
  title_ar: "",
  title_fr: "",
  title_en: "",
  specialty: "",
  grade_ar: "",
  grade_fr: "",
  grade_en: "",
  department_id: undefined,
  bio_ar: "",
  bio_fr: "",
  bio_en: "",
  phone: "",
  email: "",
  image_url: "",

  schedule_ar: "",
  schedule_fr: "",
  schedule_en: "",

  schedule_days: "",
  schedule_start: "",
  schedule_end: "",

  is_active: true,
  display_order: 0,
};

/* ----------------------------------------------------------------
   Day-picker helpers
   ---------------------------------------------------------------- */

function parseDays(csv: string | null | undefined): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

function serializeDays(days: number[]): string {
  return [...new Set(days)].sort((a, b) => a - b).join(",");
}

/* ----------------------------------------------------------------
   Time helpers
   ---------------------------------------------------------------- */

/** Backend returns "08:00:00"; HTML <input type="time"> wants "08:00". */
function toInputTime(t: string | null | undefined): string {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

/** HTML gives "08:00"; backend expects "08:00:00". */
function fromInputTime(t: string): string {
  if (!t) return "";
  return t.length === 5 ? `${t}:00` : t;
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */

export default function DoctorsAdminPage() {
  const { t, locale } = useAdminT();
  const gt = (k: "ar" | "fr" | "en") =>
    ({
      ar: { ar: "الدرجة العلمية (بالعربية)", fr: "Grade (arabe)", en: "Grade (Arabic)" },
      fr: { ar: "الدرجة العلمية (بالفرنسية)", fr: "Grade (français)", en: "Grade (French)" },
      en: { ar: "الدرجة العلمية (بالإنجليزية)", fr: "Grade (anglais)", en: "Grade (English)" },
    })[k][locale];
  const [items, setItems] = useState<AdminDoctor[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminDoctor | null>(null);
  const [form, setForm] = useState<Partial<AdminDoctor>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([listAdminDoctors(search), listAdminDepartments()])
      .then(([doctors, deps]) => {
        setItems(doctors);
        setDepartments(deps);
      })
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

  function openEdit(doc: AdminDoctor) {
    setEditing(doc);
    setForm({
      ...doc,
      // Normalize times for the <input type="time"> controls
      schedule_start: toInputTime(doc.schedule_start ?? ""),
      schedule_end: toInputTime(doc.schedule_end ?? ""),
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      // Normalize times back to HH:MM:SS for the backend
      const payload: Partial<AdminDoctor> = {
        ...form,
        schedule_start: form.schedule_start ? fromInputTime(form.schedule_start) : null,
        schedule_end: form.schedule_end ? fromInputTime(form.schedule_end) : null,
      };

      if (editing) {
        await updateDoctor(editing.id, payload);
        setBanner({ type: "success", message: t("Doctor updated.") });
      } else {
        await createDoctor(payload);
        setBanner({ type: "success", message: t("Doctor created.") });
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setFormError(message || t("Could not save doctor."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(doc: AdminDoctor) {
    if (!confirm(t("Delete this item? This cannot be undone."))) return;
    try {
      await deleteDoctor(doc.id);
      setBanner({ type: "success", message: t("Doctor deleted.") });
      load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setBanner({ type: "error", message });
    }
  }

  function departmentName(id?: number | null) {
    if (!id) return "—";
    return departments.find((d) => d.id === id)?.name_ar || `#${id}`;
  }

  /* ---- Day picker state (derived from form.schedule_days) ---- */
  const selectedDays = parseDays(form.schedule_days);

  function toggleDay(idx: number) {
    const next = selectedDays.includes(idx)
      ? selectedDays.filter((d) => d !== idx)
      : [...selectedDays, idx];
    setForm({ ...form, schedule_days: serializeDays(next) });
  }

  function clearDays() {
    setForm({ ...form, schedule_days: "" });
  }

  function selectAllDays() {
    setForm({ ...form, schedule_days: "0,1,2,3,4,5,6" });
  }

  function selectWeekdays() {
    setForm({ ...form, schedule_days: "0,1,2,3,4" });
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{t("Doctors")}</h1>
          <p className="admin-page-subtitle">{t("Manage the hospital's medical staff.")}</p>
        </div>
      </div>

      {banner && <div className={`admin-banner is-${banner.type}`}>{banner.message}</div>}

      <div className="admin-toolbar">
        <input
          className="admin-search-input"
          placeholder={t("Search doctors…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button type="button" className="admin-btn-primary" onClick={openCreate}>
          <Plus size={16} />
          {t("Add Doctor")}
        </button>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-loading-state">{t("Loading doctors…")}</div>
        ) : error ? (
          <div className="admin-error-state">Could not load doctors: {error}</div>
        ) : items.length === 0 ? (
          <div className="admin-empty-state">{t("No doctors yet. Click \"Add Doctor\" to create one.")}</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("Name")}</th>
                <th>{t("Specialty")}</th>
                <th>{t("Department")}</th>
                <th>{t("Schedule")}</th>
                <th>{t("Status")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((doc) => {
                const days = parseDays(doc.schedule_days);
                const hasSchedule = days.length > 0 && doc.schedule_start && doc.schedule_end;
                return (
                  <tr key={doc.id}>
                    <td>{doc.full_name_ar}</td>
                    <td>{doc.specialty || "—"}</td>
                    <td>{departmentName(doc.department_id)}</td>
                    <td>
                      {hasSchedule ? (
                        <span className="text-xs text-[var(--ink-soft)]" dir="ltr">
                          {days.length === 7 ? t("Every day") : `${days.length} ${t("days")}`} ·{" "}
                          {toInputTime(doc.schedule_start)}–{toInputTime(doc.schedule_end)}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--ink-soft)]">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge ${doc.is_active ? "is-active" : "is-inactive"}`}>
                        {doc.is_active ? t("Active") : t("Inactive")}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button type="button" className="admin-btn-secondary" onClick={() => openEdit(doc)}>
                          <Pencil size={13} /> {t("Edit")}
                        </button>
                        <button
                          type="button"
                          className="admin-btn-secondary admin-btn-danger"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 size={13} /> {t("Delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">{editing ? t("Edit Doctor") : t("Add Doctor")}</h2>
            {formError && <div className="admin-banner is-error">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="admin-form-grid">
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Full name (Arabic) *")}</label>
                  <input
                    required
                    className="admin-form-input"
                    value={form.full_name_ar || ""}
                    onChange={(e) => setForm({ ...form, full_name_ar: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Full name (French)")}</label>
                  <input
                    className="admin-form-input"
                    value={form.full_name_fr || ""}
                    onChange={(e) => setForm({ ...form, full_name_fr: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Full name (English)")}</label>
                  <input
                    className="admin-form-input"
                    value={form.full_name_en || ""}
                    onChange={(e) => setForm({ ...form, full_name_en: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Specialty")}</label>
                  <input
                    className="admin-form-input"
                    value={form.specialty || ""}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Department")}</label>
                  <select
                    className="admin-form-select"
                    value={form.department_id ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, department_id: e.target.value ? Number(e.target.value) : undefined })
                    }
                  >
                    <option value="">{t("— None —")}</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{t("Title (Arabic)")}</label>
                  <input
                    className="admin-form-input"
                    value={form.title_ar || ""}
                    onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{gt("ar")}</label>
                  <input
                    className="admin-form-input"
                    dir="rtl"
                    value={form.grade_ar || ""}
                    onChange={(e) => setForm({ ...form, grade_ar: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{gt("fr")}</label>
                  <input
                    className="admin-form-input"
                    dir="ltr"
                    value={form.grade_fr || ""}
                    onChange={(e) => setForm({ ...form, grade_fr: e.target.value })}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{gt("en")}</label>
                  <input
                    className="admin-form-input"
                    dir="ltr"
                    value={form.grade_en || ""}
                    onChange={(e) => setForm({ ...form, grade_en: e.target.value })}
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
                  <label className="admin-form-label">{t("Email")}</label>
                  <input
                    type="email"
                    className="admin-form-input"
                    value={form.email || ""}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <ImageUploadField
                  label={t("Doctor photo")}
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                />

                {/* ============================================================
                    STRUCTURED SCHEDULE
                    ============================================================ */}
                <div className="admin-form-field is-full">
                  <label className="admin-form-label flex items-center gap-2">
                    <CalendarDays size={14} />
                    {t("Working days")}
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    {DAYS.map((d) => {
                      const isSelected = selectedDays.includes(d.idx);
                      return (
                        <button
                          key={d.idx}
                          type="button"
                          onClick={() => toggleDay(d.idx)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                            isSelected
                              ? "border-[var(--green-deep)] bg-[var(--green-deep)] text-white"
                              : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink-soft)] hover:border-[var(--green-deep)]"
                          }`}
                        >
                          {t(d.label)}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={selectWeekdays}
                      className="text-[11px] font-semibold text-[var(--green-deep)] underline"
                    >
                      {t("Sun–Thu")}
                    </button>
                    <button
                      type="button"
                      onClick={selectAllDays}
                      className="text-[11px] font-semibold text-[var(--green-deep)] underline"
                    >
                      {t("Every day")}
                    </button>
                    <button
                      type="button"
                      onClick={clearDays}
                      className="text-[11px] font-semibold text-red-600 underline"
                    >
                      {t("Clear")}
                    </button>
                  </div>

                  <p className="mt-1 text-[11px] text-[var(--ink-soft)]">
                    {t("Days are based on local time (0 = Sunday).")}
                  </p>
                </div>

                <div className="admin-form-field">
                  <label className="admin-form-label flex items-center gap-2">
                    <Clock size={14} />
                    {t("Start time")}
                  </label>
                  <input
                    type="time"
                    className="admin-form-input"
                    value={form.schedule_start || ""}
                    onChange={(e) => setForm({ ...form, schedule_start: e.target.value })}
                  />
                </div>

                <div className="admin-form-field">
                  <label className="admin-form-label flex items-center gap-2">
                    <Clock size={14} />
                    {t("End time")}
                  </label>
                  <input
                    type="time"
                    className="admin-form-input"
                    value={form.schedule_end || ""}
                    onChange={(e) => setForm({ ...form, schedule_end: e.target.value })}
                  />
                </div>

                {/* ============================================================
                    LEGACY NOTES (optional)
                    ============================================================ */}
                <div className="admin-form-field is-full">
                  <label className="admin-form-label">
                    {t("Legacy schedule note (Arabic) — optional")}
                  </label>
                  <input
                    className="admin-form-input"
                    placeholder="e.g. على مدار الأسبوع، 24/24"
                    value={form.schedule_ar || ""}
                    onChange={(e) => setForm({ ...form, schedule_ar: e.target.value })}
                  />
                  <p className="mt-1 text-[11px] text-[var(--ink-soft)]">
                    {t("Shown only when structured schedule is empty.")}
                  </p>
                </div>

                <div className="admin-form-field is-full">
                  <label className="admin-form-label">{t("Bio (Arabic)")}</label>
                  <textarea
                    className="admin-form-textarea"
                    value={form.bio_ar || ""}
                    onChange={(e) => setForm({ ...form, bio_ar: e.target.value })}
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
                  {saving ? t("Saving…") : editing ? t("Save changes") : t("Create doctor")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}