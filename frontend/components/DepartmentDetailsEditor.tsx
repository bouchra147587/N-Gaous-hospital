"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";
import { AdminDepartmentDetail, getDepartmentDetail, saveDepartmentDetail } from "@/lib/adminApi";
import { useAdminT } from "@/lib/adminI18n";

const LANGS = [["ar", "Arabic"], ["fr", "French"], ["en", "English"]] as const;

function Tri({ base, label, form, setForm, textarea }: { base: string; label: string; form: any; setForm: (f: any) => void; textarea?: boolean }) {
  const { t } = useAdminT();
  return (
    <>
      {LANGS.map(([l, name]) => {
        const key = `${base}_${l}`;
        const Tag: any = textarea ? "textarea" : "input";
        return (
          <div key={key} className={`admin-form-field ${textarea ? "is-full" : ""}`}>
            <label className="admin-form-label">{`${label} (${t(name)})`}</label>
            <Tag
              className={textarea ? "admin-form-textarea" : "admin-form-input"}
              value={form[key] || ""}
              onChange={(e: any) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        );
      })}
    </>
  );
}

/** Modal that edits everything shown on the public department details page. */
export default function DepartmentDetailsEditor({ departmentId, departmentName, onClose, onSaved }: {
  departmentId: number; departmentName: string; onClose: () => void; onSaved: (msg: string) => void;
}) {
  const { t } = useAdminT();
  const [form, setForm] = useState<AdminDepartmentDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDepartmentDetail(departmentId).then(setForm).catch((e) => setError(e.message));
  }, [departmentId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true); setError(null);
    try { await saveDepartmentDetail(departmentId, form); onSaved(t("Saved.")); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setSaving(false); }
  }

  const setService = (i: number, patch: object) =>
    setForm((f) => f && ({ ...f, services: f.services.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="admin-modal-title">{t("Details page")} — {departmentName}</h2>
        {error && <div className="admin-banner is-error">{error}</div>}
        {!form ? <div className="admin-loading-state">{t("Loading…")}</div> : (
          <form onSubmit={submit}>
            <p className="admin-page-subtitle" style={{ marginBottom: ".75rem" }}>
              {t("Bed capacity is edited in the main department form.")}
            </p>

            <h3 className="admin-form-label" style={{ margin: ".5rem 0" }}>{t("Images (each one is independent)")}</h3>
            <div className="admin-form-grid">
              <ImageUploadField label={t("Top banner image")} value={form.hero_image_url} onChange={(u) => setForm({ ...form, hero_image_url: u })} />
              <ImageUploadField label={t("Side card image")} value={form.side_image_url} onChange={(u) => setForm({ ...form, side_image_url: u })} />
              <ImageUploadField label={t("About section image")} value={form.about_image_url} onChange={(u) => setForm({ ...form, about_image_url: u })} />
            </div>

            <h3 className="admin-form-label" style={{ margin: "1rem 0 .5rem" }}>{t("Texts")}</h3>
            <div className="admin-form-grid">
              <Tri base="tag" label={t("Tag")} form={form} setForm={setForm} />
              <Tri base="hero_subtitle" label={t("Banner subtitle")} form={form} setForm={setForm} textarea />
              <Tri base="about" label={t("About the department")} form={form} setForm={setForm} textarea />
              <Tri base="head_name" label={t("Head of department")} form={form} setForm={setForm} />
            </div>

            <h3 className="admin-form-label" style={{ margin: "1rem 0 .5rem" }}>{t("Key services we offer")}</h3>
            {form.services.map((s, i) => (
              <div key={i} className="admin-form-grid" style={{ alignItems: "end", marginBottom: ".5rem" }}>
                {LANGS.map(([l, name]) => (
                  <div key={l} className="admin-form-field">
                    <label className="admin-form-label">{t(name)}</label>
                    <input className="admin-form-input" value={(s as any)[`title_${l}`] || ""} onChange={(e) => setService(i, { [`title_${l}`]: e.target.value })} />
                  </div>
                ))}
                <button type="button" className="admin-btn-secondary admin-btn-danger"
                  onClick={() => setForm({ ...form, services: form.services.filter((_, idx) => idx !== i) })}>
                  <Trash2 size={13} /> {t("Delete")}
                </button>
              </div>
            ))}
            <button type="button" className="admin-btn-secondary"
              onClick={() => setForm({ ...form, services: [...form.services, { title_ar: "", title_fr: "", title_en: "" }] })}>
              <Plus size={14} /> {t("Add service")}
            </button>

            <div className="admin-form-actions">
              <button type="button" className="admin-btn-secondary" onClick={onClose}>{t("Cancel")}</button>
              <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? t("Saving…") : t("Save changes")}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
