"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn, Mail, Lock, AlertCircle, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTr, useErrorMessage } from "@/lib/accountI18n";
import type { AccountType } from "@/lib/auth";
import AuthField from "@/components/AuthField";
import AccountTypeSwitch from "@/components/AccountTypeSwitch";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { t, dir } = useTr();
  const errorMessage = useErrorMessage("auth");

  const [type, setType] = useState<AccountType>(params.get("type") === "doctor" ? "doctor" : "admin");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    const errs: typeof errors = {};
    if (!EMAIL_RE.test(email)) errs.email = t("auth.err.email");
    if (!password) errs.password = t("auth.err.passwordRequired");
    setErrors(errs);
    setServerError("");
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const user = await login(email, password, type);
      const next = params.get("next") || "";
      if (user.role === "admin") {
        router.push(next.startsWith("/admin") ? next : "/admin/dashboard");
      } else if (user.role === "doctor") {
        router.push(next.startsWith("/doctor") ? next : "/doctor/appointments");
      } else {
        router.push("/");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_NOT_VERIFIED") {
        window.location.href = `/signup?verify=${encodeURIComponent(email)}`;
        return;
      }
      setServerError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="acct-page" dir={dir}>
      <div className="acct-card">
        <div className="acct-head">
          <span className="acct-head-icon"><LogIn size={26} /></span>
          <h1>{t("auth.login")}</h1>
          <p>{t("auth.loginSub")}</p>
        </div>

        <AccountTypeSwitch value={type} onChange={(v) => { setType(v); setServerError(""); }} />

        <form onSubmit={handleSubmit} noValidate className="acct-form">
          <AuthField
            label={t("auth.email")}
            name="email"
            type="email"
            autoComplete="email"
            icon={<Mail size={18} />}
            error={errors.email}
          />
          <AuthField
            label={t("auth.password")}
            name="password"
            type="password"
            autoComplete="current-password"
            icon={<Lock size={18} />}
            error={errors.password}
          />

          {serverError && (
            <p className="acct-alert" role="alert">
              <AlertCircle size={18} />
              <span>{serverError}</span>
            </p>
          )}

          <button type="submit" disabled={busy} className="acct-submit">
            {busy ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
            <span>{t("auth.submitLogin")}</span>
          </button>
        </form>

        {type === "doctor" && (
          <p className="acct-alt">
            {t("auth.noAccount")}{" "}
            <Link href="/signup" className="acct-link">
              <UserPlus size={15} /> {t("auth.signup")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
