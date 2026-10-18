// All admin calls go through our own Next.js proxy (/api/proxy/*), which
// reads the httpOnly auth cookie server-side and forwards it to FastAPI as
// a Bearer token. The browser never sees the token itself (see
// app/api/proxy/[...path]/route.ts and lib/authCookies.ts).

// ---------------------------------------------------------------------------
// Image uploads
// ---------------------------------------------------------------------------

/**
 * Upload an image file to the backend.
 *
 * POST /api/proxy/admin/uploads
 *   → Next.js proxy strips "/api/proxy" and prepends "/api"
 *   → POST {BACKEND}/api/admin/uploads
 *   → FastAPI saves the file to {media_root}/uploads/<uuid>.<ext>
 *   → returns { url: "/media/uploads/<uuid>.<ext>" }
 *
 * The returned URL is relative ("/media/..."), served by the backend's
 * StaticFiles mount. The Next.js rewrite in next.config.ts proxies
 * "/media/*" to the backend so <img src="/media/..."> works without CORS.
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/proxy/admin/uploads", {
    method: "POST",
    body: formData,
    // No Content-Type header on purpose: the browser sets the correct
    // multipart/form-data boundary itself. Setting it manually breaks
    // the upload.
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (body && (body.detail?.[0]?.msg || body.detail)) ||
      `Upload failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return body as { url: string };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (body && (body.detail?.[0]?.msg || body.detail)) ||
      `Request failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return body as T;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type DashboardStats = {
  doctors: number;
  departments: number;
  services: number;
  news: number;
  pending_appointments: number;
  unread_messages: number;
};

export const getDashboardStats = () =>
  request<DashboardStats>("admin/dashboard/stats");

// ---------------------------------------------------------------------------
// Hospital info
// ---------------------------------------------------------------------------

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const getHospitalInfo = async (): Promise<HospitalInfo> => {
  const res = await fetch(`${API_URL}/api/hospital`, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load hospital info");
  return res.json();
};

export type HospitalInfo = {
  id: number;
  name_ar: string;
  name_fr?: string | null;
  name_en?: string | null;
  description_ar?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  address?: string | null;
  wilaya?: string | null;
  phone?: string | null;
  emergency_phone?: string | null;
  email?: string | null;
  opening_hours?: string | null;
  emergency_available_24_7?: boolean;
  mission_ar?: string | null;
  mission_fr?: string | null;
  mission_en?: string | null;
  vision_ar?: string | null;
  vision_fr?: string | null;
  vision_en?: string | null;
  values_ar?: string | null;
  values_fr?: string | null;
  values_en?: string | null;
  history_ar?: string | null;
  history_fr?: string | null;
  history_en?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
  about_title_ar?: string | null;
  about_title_fr?: string | null;
  about_title_en?: string | null;
  about_content_ar?: string | null;
  about_content_fr?: string | null;
  about_content_en?: string | null;
  about_image_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
};

export const updateHospitalInfo = (payload: Partial<HospitalInfo>) =>
  request<HospitalInfo>("admin/hospital", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

export type AdminDepartment = {
  id: number;
  name_ar: string;
  name_fr?: string | null;
  name_en?: string | null;
  slug: string;
  description_ar?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  icon?: string | null;
  image_url?: string | null;
  capacity_beds?: number | null;
  phone?: string | null;
  location?: string | null;
  opening_hours?: string | null;
  is_active: boolean;
  display_order: number;
};

export const listAdminDepartments = (search?: string) =>
  request<AdminDepartment[]>(
    `admin/departments${search ? `?search=${encodeURIComponent(search)}` : ""}`
  );

export const createDepartment = (payload: Partial<AdminDepartment>) =>
  request<AdminDepartment>("admin/departments", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateDepartment = (id: number, payload: Partial<AdminDepartment>) =>
  request<AdminDepartment>(`admin/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteDepartment = (id: number, force = false) =>
  request<{ ok: boolean }>(
    `admin/departments/${id}${force ? "?force=true" : ""}`,
    { method: "DELETE" }
  );

// ---------------------------------------------------------------------------
// Doctors
// ---------------------------------------------------------------------------

export type AdminDoctor = {
  id: number;
  full_name_ar: string;
  full_name_fr?: string | null;
  full_name_en?: string | null;
  title_ar?: string | null;
  title_fr?: string | null;
  title_en?: string | null;
  specialty?: string | null;
  department_id?: number | null;
  bio_ar?: string | null;
  bio_fr?: string | null;
  grade_ar?: string | null;
  grade_fr?: string | null;
  grade_en?: string | null;
  bio_en?: string | null;
  phone?: string | null;
  email?: string | null;
  image_url?: string | null;

  // Legacy free-text schedule
  schedule_ar?: string | null;
  schedule_fr?: string | null;
  schedule_en?: string | null;

  // Structured schedule
  schedule_days?: string | null;   // CSV of weekday indices, e.g. "0,1,2,3,4"
  schedule_start?: string | null;  // "HH:MM:SS"
  schedule_end?: string | null;    // "HH:MM:SS"

  is_active: boolean;
  display_order: number;
};

export const listAdminDoctors = (search?: string) =>
  request<AdminDoctor[]>(
    `admin/doctors${search ? `?search=${encodeURIComponent(search)}` : ""}`
  );

export const createDoctor = (payload: Partial<AdminDoctor>) =>
  request<AdminDoctor>("admin/doctors", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateDoctor = (id: number, payload: Partial<AdminDoctor>) =>
  request<AdminDoctor>(`admin/doctors/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteDoctor = (id: number) =>
  request<{ ok: boolean }>(`admin/doctors/${id}`, { method: "DELETE" });

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export type AdminService = {
  id: number;
  title_ar: string;
  title_fr?: string | null;
  title_en?: string | null;
  description_ar?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  icon?: string | null;
  image_url?: string | null;
  available_24_7: boolean;
  is_active: boolean;
  display_order: number;
};

export const listAdminServices = (search?: string) =>
  request<AdminService[]>(
    `admin/services${search ? `?search=${encodeURIComponent(search)}` : ""}`
  );

export const createService = (payload: Partial<AdminService>) =>
  request<AdminService>("admin/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateService = (id: number, payload: Partial<AdminService>) =>
  request<AdminService>(`admin/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteService = (id: number) =>
  request<{ ok: boolean }>(`admin/services/${id}`, { method: "DELETE" });

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

export type AdminNews = {
  id: number;
  title_ar: string;
  title_fr?: string | null;
  title_en?: string | null;
  excerpt_ar?: string | null;
  excerpt_fr?: string | null;
  excerpt_en?: string | null;
  content_ar?: string | null;
  content_fr?: string | null;
  content_en?: string | null;
  image_url?: string | null;
  gallery?: string[];
  category_ar?: string | null;
  category_fr?: string | null;
  category_en?: string | null;
  published_at?: string | null;
  is_published: boolean;
};

export const listAdminNews = (search?: string) =>
  request<AdminNews[]>(
    `admin/news${search ? `?search=${encodeURIComponent(search)}` : ""}`
  );

export const createNews = (payload: Partial<AdminNews>) =>
  request<AdminNews>("admin/news", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateNews = (id: number, payload: Partial<AdminNews>) =>
  request<AdminNews>(`admin/news/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteNews = (id: number) =>
  request<{ ok: boolean }>(`admin/news/${id}`, { method: "DELETE" });

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

export type MessageStatus = "unread" | "read" | "archived";

export type AdminContactMessage = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: MessageStatus;
  created_at: string;
};

export type ContactMessageStats = { total: number; unread: number; archived: number };

export const listContactMessages = (params?: { status?: MessageStatus | ""; search?: string }) => {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  const q = qs.toString();
  return request<AdminContactMessage[]>(`admin/contact-messages${q ? `?${q}` : ""}`);
};

export const getContactMessageStats = () =>
  request<ContactMessageStats>("admin/contact-messages/stats");

export const updateContactMessageStatus = (id: number, status: MessageStatus) =>
  request<AdminContactMessage>(`admin/contact-messages/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

export const deleteContactMessage = (id: number) =>
  request<{ ok: boolean }>(`admin/contact-messages/${id}`, { method: "DELETE" });

// ---------------------------------------------------------------------------
// Administration section (settings / offices / directors)
// ---------------------------------------------------------------------------

export type AdminAdmSettings = {
  eyebrow_ar?: string | null; eyebrow_fr?: string | null; eyebrow_en?: string | null;
  title_ar?: string | null; title_fr?: string | null; title_en?: string | null;
  subtitle_ar?: string | null; subtitle_fr?: string | null; subtitle_en?: string | null;
  is_visible: boolean;
};

export type AdminAdmOffice = {
  id: number;
  title_ar: string; title_fr?: string | null; title_en?: string | null;
  description_ar?: string | null; description_fr?: string | null; description_en?: string | null;
  image_url?: string | null;
  is_active: boolean;
  display_order: number;
};

export type AdminAdmDirector = {
  id: number;
  name_ar: string; name_fr?: string | null; name_en?: string | null;
  position_ar?: string | null; position_fr?: string | null; position_en?: string | null;
  badge_ar?: string | null; badge_fr?: string | null; badge_en?: string | null;
  description_ar?: string | null; description_fr?: string | null; description_en?: string | null;
  image_url?: string | null;
  icon?: string | null;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
};

const json = (method: string, payload: unknown) => ({ method, body: JSON.stringify(payload) });

export const getAdmSettings = () => request<AdminAdmSettings>("admin/administration/settings");
export const updateAdmSettings = (p: AdminAdmSettings) =>
  request<AdminAdmSettings>("admin/administration/settings", json("PUT", p));

export const listAdmOffices = () => request<AdminAdmOffice[]>("admin/administration/offices");
export const createAdmOffice = (p: Partial<AdminAdmOffice>) =>
  request<AdminAdmOffice>("admin/administration/offices", json("POST", p));
export const updateAdmOffice = (id: number, p: Partial<AdminAdmOffice>) =>
  request<AdminAdmOffice>(`admin/administration/offices/${id}`, json("PUT", p));
export const deleteAdmOffice = (id: number) =>
  request<{ ok: boolean }>(`admin/administration/offices/${id}`, { method: "DELETE" });

export const listAdmDirectors = () => request<AdminAdmDirector[]>("admin/administration/directors");
export const createAdmDirector = (p: Partial<AdminAdmDirector>) =>
  request<AdminAdmDirector>("admin/administration/directors", json("POST", p));
export const updateAdmDirector = (id: number, p: Partial<AdminAdmDirector>) =>
  request<AdminAdmDirector>(`admin/administration/directors/${id}`, json("PUT", p));
export const deleteAdmDirector = (id: number) =>
  request<{ ok: boolean }>(`admin/administration/directors/${id}`, { method: "DELETE" });

// ---------------------------------------------------------------------------
// Department details page
// ---------------------------------------------------------------------------
export type AdminDepartmentDetail = {
  department_id?: number;
  hero_image_url?: string | null;
  side_image_url?: string | null;
  about_image_url?: string | null;
  [k: string]: any;
  services: { title_ar: string; title_fr?: string | null; title_en?: string | null }[];
};

export const getDepartmentDetail = (departmentId: number) =>
  request<AdminDepartmentDetail>(`admin/department-details/${departmentId}`);
export const saveDepartmentDetail = (departmentId: number, payload: AdminDepartmentDetail) =>
  request<AdminDepartmentDetail>(`admin/department-details/${departmentId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });


// ---------------------------------------------------------------------------
// Doctor accounts (approve / deactivate / delete)
// ---------------------------------------------------------------------------

export type DoctorAccount = {
  id: number;
  email: string;
  is_active: boolean;
  email_verified?: boolean;
  created_at: string;
  doctor_id: number | null;
  doctor_name_ar: string | null;
  doctor_name_fr: string | null;
  doctor_name_en: string | null;
};

export const listDoctorAccounts = () => request<DoctorAccount[]>("admin/doctor-accounts");

export const setDoctorAccountActive = (id: number, isActive: boolean) =>
  request<unknown>(`admin/users/${id}/active?is_active=${isActive}`, { method: "PATCH" });

export const deleteDoctorAccount = (id: number) =>
  request<{ ok: boolean }>(`admin/doctor-accounts/${id}`, { method: "DELETE" });

export const resetDoctorPassword = (id: number) =>
  request<{ temporary_password: string; email: string }>(`admin/doctor-accounts/${id}/reset-password`, { method: "POST" });
