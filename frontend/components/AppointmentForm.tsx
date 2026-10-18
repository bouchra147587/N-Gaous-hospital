"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Stethoscope, Loader2 } from "lucide-react";
import { getDoctorsFresh, type Department, type Doctor } from "@/lib/api";
import { pickField } from "@/lib/i18n";
import { useTr } from "@/lib/accountI18n";
import BookingForm from "@/components/BookingForm";

/** /appointment page: pick a department, then a doctor who accepts appointments,
 *  then book inside that doctor's working hours. */
export default function AppointmentForm({ departments }: { departments: Department[] }) {
  const { t, locale } = useTr();
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [deptId, setDeptId] = useState("");
  const [doctorId, setDoctorId] = useState("");

  useEffect(() => {
    getDoctorsFresh()
      .then((all) => setDoctors(all.filter((d) => d.accepts_appointments)))
      .catch(() => setDoctors([]));
  }, []);

  const visible = useMemo(
    () => (doctors ?? []).filter((d) => !deptId || String(d.department_id) === deptId),
    [doctors, deptId]
  );
  const selected = visible.find((d) => String(d.id) === doctorId) || null;

  if (doctors === null) {
    return <p className="bk-hint"><Loader2 size={15} className="animate-spin" /> {t("book.loadingSlots")}</p>;
  }
  if (doctors.length === 0) {
    return <p className="bk-hint">{t("book.noBookable")}</p>;
  }

  const deptsWithDoctors = departments.filter((d) => doctors.some((x) => x.department_id === d.id));

  return (
    <div className="bk-form">
      <div className="bk-grid">
        <div className="bk-field">
          <label className="bk-label">{t("book.department")}</label>
          <div className="bk-input">
            <span className="bk-input-icon" aria-hidden="true"><Building2 size={17} /></span>
            <select value={deptId} onChange={(e) => { setDeptId(e.target.value); setDoctorId(""); }}>
              <option value="">{t("book.allDepartments")}</option>
              {deptsWithDoctors.map((d) => (
                <option key={d.id} value={d.id}>{pickField(d as any, "name", locale)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bk-field">
          <label className="bk-label">{t("book.doctor")}</label>
          <div className="bk-input">
            <span className="bk-input-icon" aria-hidden="true"><Stethoscope size={17} /></span>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">{t("book.selectDoctor")}</option>
              {visible.map((d) => (
                <option key={d.id} value={d.id}>{pickField(d as any, "full_name", locale)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selected && <BookingForm doctor={selected} />}
    </div>
  );
}
