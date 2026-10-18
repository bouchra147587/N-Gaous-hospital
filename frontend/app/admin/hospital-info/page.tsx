"use client";

import { useEffect, useState } from "react";
import { getHospitalInfo, updateHospitalInfo, HospitalInfo } from "@/lib/adminApi";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useAdminT } from "@/lib/adminI18n";
import ImageUploadField from "@/components/ImageUploadField";

type Field = { base: string; labelKey: string; area?: boolean };

// Fields that exist in ar / fr / en (stored as <base>_<lang>)
const LANG_SECTIONS: { titleKey: string; fields: Field[] }[] = [
  { titleKey: "hosp.sec.identity", fields: [{ base: "name", labelKey: "hosp.f.name" }] },
  { titleKey: "hosp.sec.description", fields: [{ base: "description", labelKey: "hosp.f.description", area: true }] },
  {
    titleKey: "hosp.sec.about",
    fields: [
      { base: "about_title", labelKey: "hosp.f.aboutTitle" },
      { base: "about_content", labelKey: "hosp.f.aboutContent", area: true },
    ],
  },
  {
    titleKey: "hosp.sec.mvv",
    fields: [
      { base: "mission", labelKey: "hosp.f.mission", area: true },
      { base: "vision", labelKey: "hosp.f.vision", area: true },
      { base: "values", labelKey: "hosp.f.values", area: true },
    ],
  },
  { titleKey: "hosp.sec.history", fields: [{ base: "history", labelKey: "hosp.f.history", area: true }] },
];

// Language-independent fields
const PLAIN_SECTIONS: {
  titleKey: string;
  fields: { key: keyof HospitalInfo; labelKey: string; type?: string; ltr?: boolean }[];
}[] = [
  {
    titleKey: "hosp.sec.contact",
    fields: [
      { key: "address", labelKey: "hosp.f.address" },
      { key: "wilaya", labelKey: "hosp.f.wilaya" },
      { key: "phone", labelKey: "hosp.f.phone", type: "tel", ltr: true },
      { key: "emergency_phone", labelKey: "hosp.f.emergencyPhone", type: "tel", ltr: true },
      { key: "email", labelKey: "hosp.f.email", type: "email", ltr: true },
      { key: "opening_hours", labelKey: "hosp.f.hours" },
    ],
  },
  {
    titleKey: "hosp.sec.social",
    fields: [
      { key: "facebook_url", labelKey: "hosp.f.facebook", type: "url", ltr: true },
      { key: "twitter_url", labelKey: "hosp.f.twitter", type: "url", ltr: true },
      { key: "instagram_url", labelKey: "hosp.f.instagram", type: "url", ltr: true },
    ],
  },
];

const URL_KEYS: (keyof HospitalInfo)[] = ["facebook_url", "twitter_url", "instagram_url"];

export default function HospitalInfoPage() {
  const { t, locale } = useAdminT();
  const [form, setForm] = useState<Partial<HospitalInfo> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editLang, setEditLang] = useState<Locale>(locale);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Follow the site language by default when it changes
  useEffect(() => setEditLang(locale), [locale]);

  useEffect(() => {
    getHospitalInfo()
      .then(setForm)
      .catch((err: unknown) =>
        setBanner({ type: "error", message: err instanceof Error ? err.message : t("hosp.loadError") })
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(key: string, value: string | boolean) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    if (!form) return false;
    const next: Record<string, string> = {};
    if (!String(form.name_ar || "").trim()) next.name_ar = t("hosp.nameRequired");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = t("hosp.invalidEmail");
    for (const k of URL_KEYS) {
      const v = form[k] as string | null | undefined;
      if (v && !/^https?:\/\//i.test(v)) next[k as string] = t("hosp.invalidUrl");
    }
    setErrors(next);
    if (next.name_ar) setEditLang("ar");
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !validate()) return;
    setSaving(true);
    setBanner(null);
    try {
      // Send only writable fields (id / updated_at are read-only)
      const { id: _id, updated_at: _u, ...payload } = form as HospitalInfo & { updated_at?: string };
      void _id; void _u;
      const updated = await updateHospitalInfo(payload);
      setForm(updated);
      setBanner({ type: "success", message: t("hosp.saved") });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setBanner({ type: "error", message: (err instanceof Error && err.message) || t("hosp.saveError") });
    } finally {
      setSaving(false);
    }
  }

  const langMeta = LOCALES.find((l) => l.code === editLang)!;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{t("hosp.title")}</h1>
          <p className="admin-page-subtitle">{t("hosp.subtitle")}</p>
        </div>
      </div>

      {banner && <div className={`admin-banner is-${banner.type}`} role="status">{banner.message}</div>}
      {loading && <div className="admin-loading-state">{t("common.loading")}</div>}

      {form && (
        <form onSubmit={handleSubmit} noValidate>
          <section className="admin-card">
            <h2 className="admin-card-title">{t("hosp.sec.images")}</h2>
            <div className="admin-form-grid">
              <ImageUploadField label={t("hosp.f.aboutImage")} value={form.about_image_url} onChange={(u) => setField("about_image_url", u)} />
            </div>
          </section>

          {/* Language tabs for every translatable field */}
          <div className="admin-lang-bar">
            <span className="admin-lang-bar-label">{t("hosp.editingLang")}</span>
            <div className="admin-tabs" role="tablist">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  role="tab"
                  aria-selected={editLang === l.code}
                  className={`admin-tab ${editLang === l.code ? "is-active" : ""}`}
                  onClick={() => setEditLang(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <p className="admin-form-hint">{t("hosp.langHint")}</p>
          </div>

          {LANG_SECTIONS.map((section) => (
            <section key={section.titleKey} className="admin-card">
              <h2 className="admin-card-title">{t(section.titleKey)}</h2>
              <div className="admin-form-grid">
                {section.fields.map((f) => {
                  const key = `${f.base}_${editLang}`;
                  const err = errors[key];
                  const isNameAr = key === "name_ar";
                  return (
                    <div key={key} className={`admin-form-field ${f.area ? "is-full" : ""} ${err ? "has-error" : ""}`}>
                      <label className="admin-form-label" htmlFor={key}>
                        {t(f.labelKey)} {isNameAr && <span className="admin-required">*</span>}
                        <span className="admin-lang-chip">{editLang.toUpperCase()}</span>
                      </label>
                      {f.area ? (
                        <textarea
                          id={key}
                          className="admin-form-textarea"
                          dir={langMeta.dir}
                          rows={4}
                          value={((form as Record<string, unknown>)[key] as string) || ""}
                          onChange={(e) => setField(key, e.target.value)}
                        />
                      ) : (
                        <input
                          id={key}
                          className="admin-form-input"
                          dir={langMeta.dir}
                          value={((form as Record<string, unknown>)[key] as string) || ""}
                          onChange={(e) => setField(key, e.target.value)}
                        />
                      )}
                      {err && <p className="admin-field-error">{err}</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {PLAIN_SECTIONS.map((section) => (
            <section key={section.titleKey} className="admin-card">
              <h2 className="admin-card-title">{t(section.titleKey)}</h2>
              <div className="admin-form-grid">
                {section.fields.map((f) => (
                  <div key={f.key} className={`admin-form-field ${errors[f.key] ? "has-error" : ""}`}>
                    <label className="admin-form-label" htmlFor={f.key}>{t(f.labelKey)}</label>
                    <input
                      id={f.key}
                      type={f.type === "url" || f.type === "email" ? "text" : f.type || "text"}
                      inputMode={f.type === "email" ? "email" : f.type === "url" ? "url" : undefined}
                      dir={f.ltr ? "ltr" : undefined}
                      className="admin-form-input"
                      value={(form[f.key] as string) || ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                    />
                    {errors[f.key] && <p className="admin-field-error">{errors[f.key]}</p>}
                  </div>
                ))}
                {section.titleKey === "hosp.sec.contact" && (
                  <label className="admin-switch is-full">
                    <input
                      type="checkbox"
                      checked={!!form.emergency_available_24_7}
                      onChange={(e) => setField("emergency_available_24_7", e.target.checked)}
                    />
                    <span className="admin-switch-track" aria-hidden="true" />
                    <span>{t("hosp.f.emergency247")}</span>
                  </label>
                )}
              </div>
            </section>
          ))}

          <div className="admin-form-actions is-sticky">
            <button type="submit" className="admin-btn-primary" disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
