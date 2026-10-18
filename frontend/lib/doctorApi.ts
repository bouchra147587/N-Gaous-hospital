// Doctor-space API. Goes through our Next.js proxy (/api/proxy/*), which adds
// the httpOnly auth cookie as a Bearer token. The backend only ever returns the
// logged-in doctor's OWN appointments.

import type { Doctor } from "@/lib/api";

export type AppointmentStatus = "pending" | "confirmed" | "rejected" | "cancelled" | "completed";

export type DoctorAppointment = {
  id: number;
  full_name: string;
  phone: string;
  preferred_date: string | null; // YYYY-MM-DD
  preferred_time: string | null; // HH:MM:SS
  notes: string | null;
  status: AppointmentStatus;
  created_at: string;
};

export type DoctorStats = { pending: number; confirmed: number; total: number };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(typeof body?.detail === "string" ? body.detail : `Request failed (${res.status})`);
  }
  return body as T;
}

export const getMyProfile = () => request<Doctor>("doctor/me");
export const getMyStats = () => request<DoctorStats>("doctor/stats");
export const listMyAppointments = (status?: AppointmentStatus | "") =>
  request<DoctorAppointment[]>(`doctor/appointments${status ? `?status=${status}` : ""}`);
export const answerAppointment = (id: number, status: AppointmentStatus) =>
  request<DoctorAppointment>(`doctor/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
