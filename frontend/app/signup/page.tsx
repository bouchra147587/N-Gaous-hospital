"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import {
  Loader2, UserPlus, Mail, Lock, AlertCircle, CheckCircle2, Info, Stethoscope, LogIn, Clock, MailCheck, RefreshCw,
} from "lucide-react";
import { useTr, useErrorMessage } from "@/lib/accountI18n";
import { pickField } from "@/lib/i18n";
import { doctorSignup, verifyEmail, resendCode, type AccountType } from "@/lib/auth";
import { getDoctorsFresh, type Doctor } from "@/lib/api";
import AuthField from "@/components/AuthField";
import AccountTypeSwitch from "@/components/AccountTypeSwitch";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignupPage() {
  const { t, locale, dir } = useTr();
  const errorMessage = useErrorMessage("auth");

  const [type, setType] = useState<AccountType>("doctor");
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  // step 2: the doctor types the 6-digit code received by e-mail
  const [verifyFor, setVerifyFor] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [info, setInfo] = useState("");

  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("verify");
    if (e) setVerifyFor(e);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!/^\d{6}$/.test(code.trim())) return setServerError(t("auth.err.codeFormat"));
    setBusy(true);
    try {
      await verifyEmail({ email: verifyFor!, code: code.trim() });
      setVerifyFor(null);
      setDone(true);
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setServerError("");
    setInfo("");
    try {
      await resendCode(verifyFor!);
      setInfo(t("auth.codeSent"));
      setCooldown(60);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  }

  // Only doctor profiles that do not have an account yet can be claimed.
  useEffect(() => {
    getDoctorsFresh()
      .then((all) => setDoctors(all.filter((d) => !d.has_account)))
      .catch(() => setDoctors([]));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const doctorId = Number(data.get("doctor_id"));
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const confirm = String(data.get("confirm") || "");

    const errs: Record<string, string> = {};
    if (!Number.isInteger(doctorId) || doctorId <= 0) errs.doctor_id = t("auth.err.profile");
    if (!EMAIL_RE.test(email)) errs.email = t("auth.err.email");
    if (password.length < 8) errs.password = t("auth.err.passwordShort");
    if (confirm !== password) errs.confirm = t("auth.err.passwordMismatch");
    setErrors(errs);
    setServerError("");
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await doctorSignup({ email, password, doctor_id: doctorId });
      setCode("");
      setInfo(t("auth.codeSent"));
      setCooldown(60);
      setVerifyFor(email);
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="acct-page" dir={dir}>
      <div className="acct-card">
        <div className="acct-head">
          <span className="acct-head-icon"><UserPlus size={26} /></span>
          <h1>{t("auth.signup")}</h1>
          <p>{t("auth.signupSub")}</p>
        </div>

        {verifyFor && !done ? (
          <form onSubmit={handleVerify} noValidate className="acct-form">
            <div className="acct-info">
              <MailCheck size={22} />
              <div>
                <b>{t("auth.verifyTitle")}</b>
                <p>{t("auth.verifyText")} <b dir="ltr">{verifyFor}</b></p>
              </div>
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              dir="ltr"
              aria-label={t("auth.verifyTitle")}
              style={{ textAlign: "center", fontSize: 28, letterSpacing: 10, fontWeight: 800, padding: "14px 10px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", width: "100%" }}
            />
            {info && !serverError && <p className="acct-info" role="status"><CheckCircle2 size={18} /> {info}</p>}
            {serverError && (
              <p className="acct-alert" role="alert"><AlertCircle size={18} /><span>{serverError}</span></p>
            )}
            <button type="submit" disabled={busy} className="acct-submit">
              {busy ? <Loader2 className="animate-spin" size={18} /> : <MailCheck size={18} />}
              <span>{t("auth.verifyBtn")}</span>
            </button>
            <button type="button" onClick={handleResend} disabled={cooldown > 0} className="acct-link" style={{ justifySelf: "center", display: "inline-flex", gap: 6, alignItems: "center", background: "none", border: 0, cursor: cooldown > 0 ? "default" : "pointer", opacity: cooldown > 0 ? 0.6 : 1 }}>
              <RefreshCw size={15} /> {t("auth.resend")}{cooldown > 0 ? ` (${cooldown})` : ""}
            </button>
          </form>
        ) : done ? (
          <div className="acct-success">
            <CheckCircle2 size={40} />
            <h2>{t("auth.pendingTitle")}</h2>
            <p>{t("auth.pendingText")}</p>
            <span className="acct-pending-pill"><Clock size={15} /> {t("acc.pending")}</span>
            <Link href="/login?type=doctor" className="acct-submit">
              <LogIn size={18} />
              <span>{t("auth.goLogin")}</span>
            </Link>
          </div>
        ) : (
          <>
            <AccountTypeSwitch value={type} onChange={setType} />

            {type === "admin" ? (
              <div className="acct-info">
                <Info size={22} />
                <div>
                  <b>{t("auth.adminSignupTitle")}</b>
                  <p>{t("auth.adminSignupText")}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="acct-form">
                {doctors && doctors.length === 0 ? (
                  <div className="acct-info">
                    <Info size={22} />
                    <p>{t("auth.noProfiles")}</p>
                  </div>
                ) : (
                  <>
                    <AuthField
                      label={t("auth.doctorProfile")}
                      name="doctor_id"
                      icon={<Stethoscope size={18} />}
                      error={errors.doctor_id}
                    >
                      <option value="">{t("auth.selectProfile")}</option>
                      {(doctors ?? []).map((d) => (
                        <option key={d.id} value={d.id}>
                          {pickField(d as any, "full_name", locale)}
                        </option>
                      ))}
                    </AuthField>
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
                      autoComplete="new-password"
                      icon={<Lock size={18} />}
                      error={errors.password}
                    />
                    <AuthField
                      label={t("auth.confirmPassword")}
                      name="confirm"
                      type="password"
                      autoComplete="new-password"
                      icon={<Lock size={18} />}
                      error={errors.confirm}
                    />

                    {serverError && (
                      <p className="acct-alert" role="alert">
                        <AlertCircle size={18} />
                        <span>{serverError}</span>
                      </p>
                    )}

                    <button type="submit" disabled={busy || doctors === null} className="acct-submit">
                      {busy ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                      <span>{t("auth.submitSignup")}</span>
                    </button>
                  </>
                )}
              </form>
            )}

            <p className="acct-alt">
              {t("auth.haveAccount")}{" "}
              <Link href="/login" className="acct-link">
                <LogIn size={15} /> {t("auth.login")}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
