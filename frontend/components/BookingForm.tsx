"use client";

import { useEffect, useMemo, useRef, useState, FormEvent } from "react";
import {
  CalendarDays, Clock, Loader2, Phone, User, CheckCircle2, AlertCircle, NotebookPen, CalendarClock,
} from "lucide-react";
import { useTr, useErrorMessage } from "@/lib/accountI18n";
import { getDoctorAvailability, submitAppointment, type Doctor } from "@/lib/api";
import {
  MAX_BOOKING_DAYS, formatWorkingDays, parseWorkingDays, shortHour, toISODate, weekdayOf,
} from "@/lib/schedule";

// Letters of any alphabet (incl. Arabic), separated by single spaces, hyphens or apostrophes.
const NAME_RE = /^\p{L}+(?:[ '’-]\p{L}+)*$/u;
// Algerian mobile: 05 / 06 / 07 + 8 digits. +213 / 00213 prefixes are accepted.
const PHONE_RE = /^0[567]\d{8}$/;

function normalizePhone(v: string) {
  let p = v.replace(/[\s.\-()]/g, "");
  if (p.startsWith("+213")) p = "0" + p.slice(4);
  else if (p.startsWith("00213")) p = "0" + p.slice(5);
  return p;
}

type Errors = Partial<Record<"first" | "last" | "phone" | "date" | "time" | "server", string>>;

export default function BookingForm({ doctor, onDone }: { doctor: Doctor; onDone?: () => void }) {
  const { t, locale } = useTr();
  const errorMessage = useErrorMessage("book");

  const days = useMemo(() => parseWorkingDays(doctor.schedule_days), [doctor.schedule_days]);
  const hours = `${shortHour(doctor.schedule_start)} – ${shortHour(doctor.schedule_end)}`;
  const today = new Date();
  const minDate = toISODate(today);
  const maxDate = toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + MAX_BOOKING_DAYS));

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ date: string; time: string } | null>(null);
  const reqId = useRef(0);

  /** Returns an error message for the chosen date, or "" when it is bookable. */
  function dateProblem(iso: string): string {
    if (!iso) return t("book.err.dateRequired");
    if (iso < minDate) return t("book.err.datePast");
    if (iso > maxDate) return t("book.err.dateFar");
    if (!days.includes(weekdayOf(iso))) {
      return `${t("book.err.notWorkingDay")} ${formatWorkingDays(days, locale)}`;
    }
    return "";
  }

  async function loadSlots(iso: string) {
    const id = ++reqId.current;
    setSlotsLoading(true);
    setSlots(null);
    try {
      const res = await getDoctorAvailability(doctor.id, iso);
      if (id === reqId.current) setSlots(res.slots);
    } catch {
      if (id === reqId.current) setSlots([]);
    } finally {
      if (id === reqId.current) setSlotsLoading(false);
    }
  }

  function onDateChange(iso: string) {
    setDate(iso);
    setTime("");
    setSlots(null);
    if (!iso) {
      setErrors((e) => ({ ...e, date: undefined, time: undefined }));
      return;
    }
    const problem = dateProblem(iso);
    setErrors((e) => ({ ...e, date: problem || undefined, time: undefined }));
    if (!problem) loadSlots(iso);
  }

  // If the doctor changes (e.g. picked from a list) start from a clean form.
  useEffect(() => {
    reqId.current++;
    setDate(""); setTime(""); setSlots(null); setErrors({});
  }, [doctor.id]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs: Errors = {};
    const f = first.trim().replace(/\s+/g, " ");
    const l = last.trim().replace(/\s+/g, " ");
    const p = normalizePhone(phone.trim());

    if (f.length < 2 || !NAME_RE.test(f)) errs.first = t("book.err.firstName");
    if (l.length < 2 || !NAME_RE.test(l)) errs.last = t("book.err.lastName");
    if (!PHONE_RE.test(p)) errs.phone = t("book.err.phone");
    const dp = dateProblem(date);
    if (dp) errs.date = dp;
    else if (!time || !slots?.includes(time)) errs.time = t("book.err.timeRequired");

    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await submitAppointment({
        first_name: f,
        last_name: l,
        phone: p,
        doctor_id: doctor.id,
        preferred_date: date,
        preferred_time: time,
        notes: notes.trim() || undefined,
      });
      setDone({ date, time });
      onDone?.();
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setErrors({ server: errorMessage(err) });
      if (code === "SLOT_UNAVAILABLE") {
        setTime("");
        loadSlots(date);
      }
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFirst(""); setLast(""); setPhone(""); setDate(""); setTime(""); setNotes("");
    setSlots(null); setErrors({}); setDone(null);
  }

  if (done) {
    return (
      <div className="bk-success">
        <CheckCircle2 size={44} />
        <h3>{t("book.successTitle")}</h3>
        <p>{t("book.successText")}</p>
        <div className="bk-summary">
          <span><CalendarDays size={16} /> <bdi dir="ltr">{done.date}</bdi></span>
          <span><Clock size={16} /> <bdi dir="ltr">{done.time}</bdi></span>
        </div>
        <button type="button" className="bk-link" onClick={reset}>{t("book.another")}</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bk-form">
      <div className="bk-hours">
        <CalendarClock size={18} />
        <div>
          <b>{t("book.workingHours")}</b>
          <span>
            {formatWorkingDays(days, locale)} · <bdi dir="ltr">{hours}</bdi>
          </span>
        </div>
      </div>

      <div className="bk-grid">
        <Field label={t("book.firstName")} icon={<User size={17} />} error={errors.first}>
          <input value={first} onChange={(e) => setFirst(e.target.value)} maxLength={100} autoComplete="given-name" />
        </Field>
        <Field label={t("book.lastName")} icon={<User size={17} />} error={errors.last}>
          <input value={last} onChange={(e) => setLast(e.target.value)} maxLength={100} autoComplete="family-name" />
        </Field>
      </div>

      <Field label={t("book.phone")} icon={<Phone size={17} />} error={errors.phone} hint={t("book.phoneHint")}>
        <input
          type="tel"
          inputMode="tel"
          dir="ltr"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05 / 06 / 07 XX XX XX XX"
          maxLength={20}
          autoComplete="tel"
        />
      </Field>

      <Field label={t("book.date")} icon={<CalendarDays size={17} />} error={errors.date}>
        <input type="date" value={date} min={minDate} max={maxDate} onChange={(e) => onDateChange(e.target.value)} />
      </Field>

      <div className="bk-field">
        <span className="bk-label">{t("book.time")}</span>
        {!date || errors.date ? (
          <p className="bk-hint">{t("book.pickDate")}</p>
        ) : slotsLoading ? (
          <p className="bk-hint"><Loader2 size={15} className="animate-spin" /> {t("book.loadingSlots")}</p>
        ) : slots && slots.length === 0 ? (
          <p className="bk-hint">{t("book.noSlots")}</p>
        ) : (
          <div className="bk-slots" role="radiogroup" aria-label={t("book.time")}>
            {(slots ?? []).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={time === s}
                dir="ltr"
                className={`bk-slot ${time === s ? "is-selected" : ""}`}
                onClick={() => { setTime(s); setErrors((e) => ({ ...e, time: undefined })); }}
              >
                <Clock size={13} /> {s}
              </button>
            ))}
          </div>
        )}
        {errors.time && <p className="bk-error">{errors.time}</p>}
      </div>

      <Field label={t("book.notes")} icon={<NotebookPen size={17} />}>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
      </Field>

      {errors.server && (
        <p className="bk-alert" role="alert"><AlertCircle size={18} /> <span>{errors.server}</span></p>
      )}

      <button type="submit" disabled={busy} className="bk-submit">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <CalendarDays size={18} />}
        <span>{t("book.submit")}</span>
      </button>
    </form>
  );
}

function Field({
  label, icon, error, hint, children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bk-field">
      <label className="bk-label">{label}</label>
      <div className={`bk-input ${error ? "has-error" : ""}`}>
        <span className="bk-input-icon" aria-hidden="true">{icon}</span>
        {children}
      </div>
      {hint && !error && <p className="bk-hint bk-hint-sm">{hint}</p>}
      {error && <p className="bk-error">{error}</p>}
    </div>
  );
}
