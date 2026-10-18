"use client";

import { useState, FormEvent } from "react";
import { submitContact } from "@/lib/api";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const MESSAGES = {
  en: {
    name: "Please enter your full name.",
    phone: "Enter a valid Algerian mobile number (05…, 06… or 07…, 10 digits).",
    phoneRequired: "Please enter your phone number.",
    email: "Please enter a valid email address.",
    emailRequired: "Please enter your email address.",
    message: "Your message cannot be empty.",
  },
  fr: {
    name: "Veuillez saisir votre nom complet.",
    phone: "Saisissez un numéro mobile algérien valide (05…, 06… ou 07…, 10 chiffres).",
    phoneRequired: "Veuillez saisir votre numéro de téléphone.",
    email: "Veuillez saisir une adresse e-mail valide.",
    emailRequired: "Veuillez saisir votre adresse e-mail.",
    message: "Le message ne peut pas être vide.",
  },
  ar: {
    name: "يرجى إدخال الاسم الكامل.",
    phone: "أدخل رقم هاتف جزائري صحيحًا (05… أو 06… أو 07…، 10 أرقام).",
    phoneRequired: "يرجى إدخال رقم الهاتف.",
    email: "يرجى إدخال بريد إلكتروني صحيح.",
    emailRequired: "يرجى إدخال البريد الإلكتروني.",
    message: "لا يمكن إرسال رسالة فارغة.",
  },
} as const;

// Algerian mobile: 05/06/07 + 8 digits (also accepts +213 / 00213 prefix)
const DZ_PHONE = /^0[567]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizePhone(v: string) {
  let p = v.replace(/[\s.\-()]/g, "");
  if (p.startsWith("+213")) p = "0" + p.slice(4);
  else if (p.startsWith("00213")) p = "0" + p.slice(5);
  return p;
}

type Errors = Partial<Record<"full_name" | "phone" | "email" | "message", string>>;

export default function ContactForm() {
  const { t, locale } = useI18n();
  const msgs = MESSAGES[(locale as "en" | "fr" | "ar") in MESSAGES ? (locale as "en" | "fr" | "ar") : "en"];
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const fullName = String(data.get("full_name") || "").trim();
    const rawPhone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    const errs: Errors = {};
    if (fullName.length < 2) errs.full_name = msgs.name;
    const phone = rawPhone ? normalizePhone(rawPhone) : "";
    if (!rawPhone) errs.phone = msgs.phoneRequired;
    else if (!DZ_PHONE.test(phone)) errs.phone = msgs.phone;
    if (!email) errs.email = msgs.emailRequired;
    else if (!EMAIL.test(email)) errs.email = msgs.email;
    if (message.length < 5) errs.message = msgs.message;

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("loading");
    try {
      await submitContact({
        full_name: fullName,
        phone,
        email,
        subject: String(data.get("subject") || "").trim(),
        message,
      });
      setStatus("done");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--green-deep)]/30 bg-[var(--green-mist)] p-10 text-center">
        <CheckCircle2 className="text-[var(--green-deep)]" size={36} />
        <p className="font-bold text-[var(--green-deeper)]">{t("form.successContactTitle")}</p>
        <p className="text-sm text-[var(--ink-soft)]">{t("form.successContactText")}</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-2 text-sm font-semibold text-[var(--green-deep)] hover:underline"
        >
          {t("form.sendAnother")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("form.fullName")} name="full_name" required error={errors.full_name} />
        <Field label={t("form.phone")} name="phone" type="tel" required placeholder="05 / 06 / 07 XX XX XX XX" error={errors.phone} />
      </div>
      <Field label={t("form.email")} name="email" type="email" required error={errors.email} />
      <Field label={t("form.subject")} name="subject" />
      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">{t("form.message")}</label>
        <textarea
          name="message"
          required
          rows={5}
          aria-invalid={!!errors.message}
          className={`w-full rounded-lg border bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--green-deep)] ${errors.message ? "border-[var(--brick)]" : "border-[var(--line)]"}`}
        />
        {errors.message && <p className="mt-1 text-xs font-semibold text-[var(--brick)]">{errors.message}</p>}
      </div>

      {status === "error" && (
        <p className="text-sm font-semibold text-[var(--brick)]">{t("form.errorContact")}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex w-fit items-center gap-2 rounded-full bg-[var(--green-deep)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--green-deeper)] disabled:opacity-60"
      >
        {status === "loading" && <Loader2 size={16} className="animate-spin" />}
        {t("form.submitContact")}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  error,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={`w-full rounded-lg border bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--green-deep)] ${error ? "border-[var(--brick)]" : "border-[var(--line)]"}`}
      />
      {error && <p className="mt-1 text-xs font-semibold text-[var(--brick)]">{error}</p>}
    </div>
  );
}
