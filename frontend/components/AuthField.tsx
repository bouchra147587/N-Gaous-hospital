"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTr } from "@/lib/accountI18n";

type Props = {
  label: string;
  name: string;
  icon: ReactNode;
  type?: string;
  autoComplete?: string;
  error?: string;
  placeholder?: string;
  children?: ReactNode; // for <select> fields
};

/** Labelled input with a leading icon, inline error and (for passwords) a show/hide toggle. */
export default function AuthField({
  label,
  name,
  icon,
  type = "text",
  autoComplete,
  error,
  placeholder,
  children,
}: Props) {
  const { t } = useTr();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="acct-field">
      <label htmlFor={name} className="acct-label">
        {label}
      </label>
      <div className={`acct-input-wrap ${error ? "has-error" : ""}`}>
        <span className="acct-input-icon" aria-hidden="true">
          {icon}
        </span>
        {children ? (
          <select id={name} name={name} className="acct-input" aria-invalid={!!error} defaultValue="">
            {children}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={isPassword && visible ? "text" : type}
            autoComplete={autoComplete}
            placeholder={placeholder}
            aria-invalid={!!error}
            className="acct-input"
            dir={type === "email" || isPassword ? "ltr" : undefined}
          />
        )}
        {isPassword && (
          <button
            type="button"
            className="acct-eye"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
            title={visible ? t("auth.hidePassword") : t("auth.showPassword")}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="acct-error">{error}</p>}
    </div>
  );
}
