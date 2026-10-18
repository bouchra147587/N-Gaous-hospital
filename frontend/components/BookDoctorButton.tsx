"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { useTr } from "@/lib/accountI18n";
import type { Doctor } from "@/lib/api";
import BookingModal from "@/components/BookingModal";

/** "Book an appointment" button for a doctor card. Shown ONLY for doctors who
 *  created an approved account (and have published working hours). */
export default function BookDoctorButton({ doctor }: { doctor: Doctor }) {
  const { t } = useTr();
  const [open, setOpen] = useState(false);

  if (!doctor.accepts_appointments) return null;

  return (
    <>
      <button type="button" className="bk-open-btn" onClick={() => setOpen(true)}>
        <CalendarPlus size={16} />
        <span>{t("book.button")}</span>
      </button>
      {open && <BookingModal doctor={doctor} onClose={() => setOpen(false)} />}
    </>
  );
}
