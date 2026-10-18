"use client";

import { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { HospitalProvider } from "@/lib/hospitalContext";
import { AuthProvider } from "@/context/AuthContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <HospitalProvider>{children}</HospitalProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
