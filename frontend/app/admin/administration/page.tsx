"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";
import {
  AdminAdmSettings, AdminAdmOffice, AdminAdmDirector,
  getAdmSettings, updateAdmSettings,
  listAdmOffices, createAdmOffice, updateAdmOffice, deleteAdmOffice,
  listAdmDirectors, createAdmDirector, updateAdmDirector, deleteAdmDirector,
} from "@/lib/adminApi";
import { useAdminT } from "@/lib/adminI18n";

type Banner = { type: "success" | "error"; message: string } | null;
const LANGS = [["ar", "Arabic"], ["fr", "French"], ["en", "English"]] as const;

/** Renders one input per language for a base field name (e.g. title -> title_ar/fr/en). */
function Trilingual({ base, label, form, setForm, textarea, required }: {
  base: string; label: string; form: any; setForm: (f: any) => void; textarea?: boolean; required?: boolean;
}) {
  const { t } = useAdminT();
  return (
    <>
      {LANGS.map(([l, name]) => {
        const key = `${base}_${l}`;
        const Tag: any = textarea ? "textarea" : "input";
        return (
          <div key={key} className={`admin-form-field ${textarea && l === "ar" ? "is-full" : ""}`}>
            <label className="admin-form-label">{`${label} (${t(name)})`}{required && l === "ar" ? " *" : ""}</label>
            <Tag
              required={required && l === "ar"}
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

function Modal({ title, onClose, onSubmit, saving, error, children }: any) {
  const { t } = useAdminT();
  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="admin-modal-title">{title}</h2>
        {error && <div className="admin-banner is-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="admin-form-grid">{children}</div>
          <div className="admin-form-actions">
            <button type="button" className="admin-btn-secondary" onClick={onClose}>{t("Cancel")}</button>
            <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? t("Saving…") : t("Save changes")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="admin-form-field">
      <label className="admin-form-checkbox">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
    </div>
  );
}

function OrderField({ form, setForm }: any) {
  const { t } = useAdminT();
  return (
    <div className="admin-form-field">
      <label className="admin-form-label">{t("Display order")}</label>
      <input type="number" className="admin-form-input" value={form.display_order ?? 0}
        onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
    </div>
  );
}

function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { t } = useAdminT();
  return (
    <div className="admin-row-actions">
      <button type="button" className="admin-btn-secondary" onClick={onEdit}><Pencil size={13} /> {t("Edit")}</button>
      <button type="button" className="admin-btn-secondary admin-btn-danger" onClick={onDelete}><Trash2 size={13} /> {t("Delete")}</button>
    </div>
  );
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/* ------------------------------ Settings tab ------------------------------ */
function SettingsTab({ setBanner }: { setBanner: (b: Banner) => void }) {
  const { t } = useAdminT();
  const [form, setForm] = useState<AdminAdmSettings | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { getAdmSettings().then(setForm).catch((e) => setBanner({ type: "error", message: errMsg(e) })); }, []); // eslint-disable-line
  if (!form) return <div className="admin-loading-state">{t("Loading…")}</div>;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try { setForm(await updateAdmSettings(form!)); setBanner({ type: "success", message: t("Saved.") }); }
    catch (err) { setBanner({ type: "error", message: errMsg(err) }); }
    finally { setSaving(false); }
  }
  return (
    <form onSubmit={submit} className="admin-table-wrap" style={{ padding: "1.25rem" }}>
      <div className="admin-form-grid">
        <Trilingual base="eyebrow" label={t("Small label")} form={form} setForm={setForm} />
        <Trilingual base="title" label={t("Title")} form={form} setForm={setForm} />
        <Trilingual base="subtitle" label={t("Subtitle")} form={form} setForm={setForm} textarea />
        <Checkbox label={t("Show this section on the home page")} checked={form.is_visible} onChange={(v) => setForm({ ...form, is_visible: v })} />
      </div>
      <div className="admin-form-actions">
        <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? t("Saving…") : t("Save changes")}</button>
      </div>
    </form>
  );
}

/* ------------------------------ Generic CRUD tab -------------------------- */
function useCrud<T extends { id: number }>(list: () => Promise<T[]>, create: (p: any) => Promise<T>,
  update: (id: number, p: any) => Promise<T>, remove: (id: number) => Promise<unknown>, empty: any, setBanner: (b: Banner) => void) {
  const { t } = useAdminT();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = () => { setLoading(true); list().then(setItems).catch((e) => setBanner({ type: "error", message: errMsg(e) })).finally(() => setLoading(false)); };
  useEffect(load, []); // eslint-disable-line

  const openCreate = () => { setEditing(null); setForm(empty); setFormError(null); setOpen(true); };
  const openEdit = (it: T) => { setEditing(it); setForm(it); setFormError(null); setOpen(true); };
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormError(null);
    try {
      if (editing) await update(editing.id, form); else await create(form);
      setBanner({ type: "success", message: t("Saved.") }); setOpen(false); load();
    } catch (err) { setFormError(errMsg(err)); } finally { setSaving(false); }
  }
  async function del(it: T) {
    if (!confirm(t("Delete this item? This cannot be undone."))) return;
    try { await remove(it.id); setBanner({ type: "success", message: t("Deleted.") }); load(); }
    catch (err) { setBanner({ type: "error", message: errMsg(err) }); }
  }
  return { items, loading, open, setOpen, editing, form, setForm, saving, formError, openCreate, openEdit, submit, del };
}

const Badge = ({ on }: { on: boolean }) => {
  const { t } = useAdminT();
  return <span className={`admin-badge ${on ? "is-active" : "is-inactive"}`}>{on ? t("Active") : t("Inactive")}</span>;
};

function Thumb({ url }: { url?: string | null }) {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  if (!url) return <span>—</span>;
  return <img src={url.startsWith("http") ? url : `${API}${url}`} alt="" style={{ width: 56, height: 40, objectFit: "cover", borderRadius: 6 }} />;
}

/* ------------------------------ Offices tab ------------------------------- */
function OfficesTab({ setBanner }: { setBanner: (b: Banner) => void }) {
  const { t } = useAdminT();
  const c = useCrud<AdminAdmOffice>(listAdmOffices, createAdmOffice, updateAdmOffice, deleteAdmOffice,
    { title_ar: "", title_fr: "", title_en: "", description_ar: "", description_fr: "", description_en: "", image_url: "", is_active: true, display_order: 0 }, setBanner);
  return (
    <>
      <div className="admin-toolbar">
        <span />
        <button type="button" className="admin-btn-primary" onClick={c.openCreate}><Plus size={16} /> {t("Add Office")}</button>
      </div>
      <div className="admin-table-wrap">
        {c.loading ? <div className="admin-loading-state">{t("Loading…")}</div>
          : c.items.length === 0 ? <div className="admin-empty-state">{t("No offices yet.")}</div> : (
          <table className="admin-table">
            <thead><tr><th>{t("Image")}</th><th>{t("Title")}</th><th>{t("Status")}</th><th>{t("Order")}</th><th>{t("Actions")}</th></tr></thead>
            <tbody>
              {c.items.map((o) => (
                <tr key={o.id}>
                  <td><Thumb url={o.image_url} /></td><td>{o.title_ar}</td><td><Badge on={o.is_active} /></td><td>{o.display_order}</td>
                  <td><Actions onEdit={() => c.openEdit(o)} onDelete={() => c.del(o)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {c.open && (
        <Modal title={c.editing ? t("Edit Office") : t("Add Office")} onClose={() => c.setOpen(false)} onSubmit={c.submit} saving={c.saving} error={c.formError}>
          <Trilingual base="title" label={t("Title")} form={c.form} setForm={c.setForm} required />
          <Trilingual base="description" label={t("Role description")} form={c.form} setForm={c.setForm} textarea />
          <ImageUploadField label={t("Office image")} value={c.form.image_url} onChange={(url) => c.setForm({ ...c.form, image_url: url })} />
          <OrderField form={c.form} setForm={c.setForm} />
          <Checkbox label={t("Active (visible on public site)")} checked={c.form.is_active ?? true} onChange={(v) => c.setForm({ ...c.form, is_active: v })} />
        </Modal>
      )}
    </>
  );
}

/* ------------------------------ Directors tab ----------------------------- */
function DirectorsTab({ setBanner }: { setBanner: (b: Banner) => void }) {
  const { t } = useAdminT();
  const c = useCrud<AdminAdmDirector>(listAdmDirectors, createAdmDirector, updateAdmDirector, deleteAdmDirector,
    { name_ar: "", position_ar: "", badge_ar: "", description_ar: "", image_url: "", is_featured: false, is_active: true, display_order: 0 }, setBanner);
  return (
    <>
      <div className="admin-toolbar">
        <span />
        <button type="button" className="admin-btn-primary" onClick={c.openCreate}><Plus size={16} /> {t("Add Director")}</button>
      </div>
      <div className="admin-table-wrap">
        {c.loading ? <div className="admin-loading-state">{t("Loading…")}</div>
          : c.items.length === 0 ? <div className="admin-empty-state">{t("No directors yet.")}</div> : (
          <table className="admin-table">
            <thead><tr><th>{t("Photo")}</th><th>{t("Name")}</th><th>{t("Role badge")}</th><th>{t("Status")}</th><th>{t("Order")}</th><th>{t("Actions")}</th></tr></thead>
            <tbody>
              {c.items.map((d) => (
                <tr key={d.id}>
                  <td><Thumb url={d.image_url} /></td>
                  <td>{d.name_ar}{d.is_featured ? " ★" : ""}</td><td>{d.badge_ar}</td><td><Badge on={d.is_active} /></td><td>{d.display_order}</td>
                  <td><Actions onEdit={() => c.openEdit(d)} onDelete={() => c.del(d)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {c.open && (
        <Modal title={c.editing ? t("Edit Director") : t("Add Director")} onClose={() => c.setOpen(false)} onSubmit={c.submit} saving={c.saving} error={c.formError}>
          <Trilingual base="name" label={t("Name")} form={c.form} setForm={c.setForm} required />
          <Trilingual base="badge" label={t("Role badge")} form={c.form} setForm={c.setForm} />
          <Trilingual base="position" label={t("Position")} form={c.form} setForm={c.setForm} />
          <Trilingual base="description" label={t("Role description")} form={c.form} setForm={c.setForm} textarea />
          <ImageUploadField label={t("Photo")} value={c.form.image_url} onChange={(url) => c.setForm({ ...c.form, image_url: url })} />
          <OrderField form={c.form} setForm={c.setForm} />
          <Checkbox label={t("Featured (highlighted card, e.g. General Director)")} checked={c.form.is_featured ?? false} onChange={(v) => c.setForm({ ...c.form, is_featured: v })} />
          <Checkbox label={t("Active (visible on public site)")} checked={c.form.is_active ?? true} onChange={(v) => c.setForm({ ...c.form, is_active: v })} />
        </Modal>
      )}
    </>
  );
}

/* ------------------------------ Page -------------------------------------- */
export default function AdministrationAdminPage() {
  const { t } = useAdminT();
  const [tab, setTab] = useState<"offices" | "directors" | "settings">("offices");
  const [banner, setBanner] = useState<Banner>(null);
  const tabs = [["offices", t("Offices (image slider)")], ["directors", t("Directors")], ["settings", t("Section title")]] as const;
  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{t("Administration")}</h1>
          <p className="admin-page-subtitle">{t("Manage the Administration section of the home page.")}</p>
        </div>
      </div>
      {banner && <div className={`admin-banner is-${banner.type}`}>{banner.message}</div>}
      <div className="admin-toolbar" style={{ gap: ".5rem", justifyContent: "flex-start" }}>
        {tabs.map(([k, label]) => (
          <button key={k} type="button" className={k === tab ? "admin-btn-primary" : "admin-btn-secondary"} onClick={() => { setTab(k); setBanner(null); }}>
            {label}
          </button>
        ))}
      </div>
      {tab === "offices" && <OfficesTab setBanner={setBanner} />}
      {tab === "directors" && <DirectorsTab setBanner={setBanner} />}
      {tab === "settings" && <SettingsTab setBanner={setBanner} />}
    </div>
  );
}
