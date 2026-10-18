"use client";

import { useState, FormEvent } from "react";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const L = {
  ar: { title: "تغيير كلمة المرور", cur: "كلمة المرور الحالية", nw: "كلمة المرور الجديدة", cf: "تأكيد كلمة المرور الجديدة", go: "حفظ", ok: "تم تغيير كلمة المرور.", min: "8 أحرف على الأقل", match: "كلمتا المرور غير متطابقتين", req: "هذا الحقل مطلوب", wrong: "كلمة المرور الحالية غير صحيحة", fail: "تعذر الحفظ، أعد المحاولة." },
  fr: { title: "Changer le mot de passe", cur: "Mot de passe actuel", nw: "Nouveau mot de passe", cf: "Confirmer le nouveau mot de passe", go: "Enregistrer", ok: "Mot de passe modifié.", min: "8 caractères minimum", match: "Les mots de passe ne correspondent pas", req: "Champ obligatoire", wrong: "Mot de passe actuel incorrect", fail: "Échec, réessayez." },
  en: { title: "Change password", cur: "Current password", nw: "New password", cf: "Confirm new password", go: "Save", ok: "Password changed.", min: "At least 8 characters", match: "Passwords do not match", req: "This field is required", wrong: "Current password is incorrect", fail: "Could not save, try again." },
} as const;

export default function DoctorPasswordPage() {
  const { locale } = useI18n();
  const l = L[locale as "ar" | "fr" | "en"];
  const [v, setV] = useState({ cur: "", nw: "", cf: "" });
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setDone(false);
    if (!v.cur || !v.nw) return setErr(l.req);
    if (v.nw.length < 8) return setErr(l.min);
    if (v.nw !== v.cf) return setErr(l.match);
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/proxy/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: v.cur, new_password: v.nw }),
      });
      if (res.status === 403) setErr(l.wrong);
      else if (!res.ok) setErr(l.fail);
      else { setDone(true); setV({ cur: "", nw: "", cf: "" }); }
    } catch { setErr(l.fail); } finally { setBusy(false); }
  }

  const field = (k: "cur" | "nw" | "cf", label: string) => (
    <div>
      <label className="admin-form-label">{label}</label>
      <input className="admin-form-input" type="password" dir="ltr" autoComplete={k === "cur" ? "current-password" : "new-password"}
        value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
    </div>
  );

  return (
    <div style={{ maxWidth: 440 }}>
      <h1 className="admin-page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}><KeyRound size={22} /> {l.title}</h1>
      <form onSubmit={submit} noValidate style={{ display: "grid", gap: 14, marginTop: 18 }}>
        {field("cur", l.cur)}{field("nw", l.nw)}{field("cf", l.cf)}
        {err && <p role="alert" className="admin-banner is-error">{err}</p>}
        {done && <p className="admin-banner" style={{ display: "flex", gap: 6, alignItems: "center" }}><CheckCircle2 size={16} /> {l.ok}</p>}
        <button type="submit" disabled={busy} className="admin-btn-primary" style={{ width: "fit-content" }}>
          {busy && <Loader2 size={15} className="animate-spin" />} {l.go}
        </button>
      </form>
    </div>
  );
}
