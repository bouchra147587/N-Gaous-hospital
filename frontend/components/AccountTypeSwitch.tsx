"use client";

import { ShieldCheck, Stethoscope } from "lucide-react";
import { useTr } from "@/lib/accountI18n";
import type { AccountType } from "@/lib/auth";

/** Two big icon buttons: Administration / Doctor. */
export default function AccountTypeSwitch({
  value,
  onChange,
}: {
  value: AccountType;
  onChange: (v: AccountType) => void;
}) {
  const { t } = useTr();
  const items: { id: AccountType; label: string; icon: React.ReactNode }[] = [
    { id: "admin", label: t("auth.typeAdmin"), icon: <ShieldCheck size={22} /> },
    { id: "doctor", label: t("auth.typeDoctor"), icon: <Stethoscope size={22} /> },
  ];
  return (
    <div role="radiogroup" aria-label={t("auth.typeLabel")} className="acct-types">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="radio"
          aria-checked={value === it.id}
          className={`acct-type ${value === it.id ? "is-active" : ""}`}
          onClick={() => onChange(it.id)}
        >
          {it.icon}
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}
