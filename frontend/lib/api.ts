export type Department = {
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
  order?: number;
};

export type Doctor = {
  id: number;
  full_name_ar: string;
  full_name_fr?: string | null;
  full_name_en?: string | null;
  title_ar?: string | null;
  title_fr?: string | null;
  title_en?: string | null;
  department_id?: number | null;
  grade_ar?: string | null;
  grade_fr?: string | null;
  grade_en?: string | null;
  bio_ar?: string | null;

  // ---- Legacy free-text schedule (kept for backward compatibility) ----
  schedule?: string | null;
  schedule_fr?: string | null;
  schedule_en?: string | null;

  // ---- NEW: structured schedule (Option A) ----
  // schedule_days is a CSV of JS day indices: "0,1,2,3,4"
  //   0 = Sunday, 1 = Monday, …, 6 = Saturday
  // schedule_start / schedule_end are "HH:MM" or "HH:MM:SS" strings.
  schedule_days?: string | null;
  schedule_start?: string | null;
  schedule_end?: string | null;

  image_url?: string | null;
  department?: Department | null;

  // A doctor can be booked only after creating (and getting approved for) an account.
  has_account?: boolean;
  accepts_appointments?: boolean;
};

export type Service = {
  id: number;
  title_ar: string;
  title_fr?: string | null;
  title_en?: string | null;
  description_ar?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  icon?: string | null;
  image_url?: string | null;
  available_24_7?: boolean;
  order?: number;
};

export type NewsItem = {
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
  published_at: string;
  category?: string;
  category_ar?: string | null;
  category_fr?: string | null;
  category_en?: string | null;
};

export type Hospital = {
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

// ---- Fallback content, shown if the FastAPI backend isn't running yet ----
export const FALLBACK_DEPARTMENTS: Department[] = [
  { id: 1, name_ar: "مصلحة الاستعجالات الطبية", name_fr: "Service des urgences médicales", name_en: "Emergency Department", slug: "emergency", description_ar: "استقبال ومعالجة الحالات الاستعجالية على مدار 24 ساعة.", description_fr: "Accueil et prise en charge des urgences 24h/24.", description_en: "Reception and treatment of urgent cases around the clock.", icon: "siren", capacity_beds: 20, order: 1 },
  { id: 2, name_ar: "مصلحة الطب الداخلي", name_fr: "Service de médecine interne", name_en: "Internal Medicine", slug: "internal-medicine", description_ar: "متابعة وتشخيص وعلاج الأمراض الباطنية المزمنة والحادة.", description_fr: "Suivi, diagnostic et traitement des maladies internes chroniques et aiguës.", description_en: "Monitoring, diagnosis and treatment of chronic and acute internal conditions.", icon: "stethoscope", capacity_beds: 30, order: 2 },
  { id: 3, name_ar: "مصلحة الجراحة العامة", name_fr: "Service de chirurgie générale", name_en: "General Surgery", slug: "general-surgery", description_ar: "عمليات جراحية مبرمجة واستعجالية بتجهيزات حديثة.", description_fr: "Interventions chirurgicales programmées et urgentes avec équipement moderne.", description_en: "Scheduled and emergency surgical procedures with modern equipment.", icon: "scissors", capacity_beds: 25, order: 3 },
  { id: 4, name_ar: "مصلحة النساء والتوليد", name_fr: "Service de gynécologie-obstétrique", name_en: "Maternity & Obstetrics", slug: "maternity", description_ar: "متابعة الحمل والولادة ورعاية الأم والوليد.", description_fr: "Suivi de grossesse, accouchement et soins à la mère et au nouveau-né.", description_en: "Pregnancy monitoring, delivery, and care for mother and newborn.", icon: "baby", capacity_beds: 28, order: 4 },
  { id: 5, name_ar: "مصلحة طب الأطفال", name_fr: "Service de pédiatrie", name_en: "Pediatrics", slug: "pediatrics", description_ar: "تكفل شامل بصحة الرضع والأطفال.", description_fr: "Prise en charge complète de la santé des nourrissons et des enfants.", description_en: "Comprehensive care for infants' and children's health.", icon: "baby", capacity_beds: 20, order: 5 },
  { id: 6, name_ar: "مصلحة الأشعة والتصوير الطبي", name_fr: "Service de radiologie et imagerie médicale", name_en: "Radiology & Medical Imaging", slug: "radiology", description_ar: "فحوصات بالأشعة السينية والصدى والسكانير.", description_fr: "Examens par rayons X, échographie et scanner.", description_en: "X-ray, ultrasound and CT scan examinations.", icon: "scan", order: 6 },
  { id: 7, name_ar: "مخبر التحاليل الطبية", name_fr: "Laboratoire d'analyses médicales", name_en: "Medical Laboratory", slug: "laboratory", description_ar: "تحاليل بيولوجية وكيميائية ودموية بنتائج موثوقة.", description_fr: "Analyses biologiques, chimiques et sanguines fiables.", description_en: "Reliable biological, chemical and blood testing.", icon: "flask-conical", order: 7 },
];

export const FALLBACK_SERVICES: Service[] = [
  { id: 1, title_ar: "الاستعجالات الطبية والجراحية", title_fr: "Urgences médicales et chirurgicales", title_en: "Medical & Surgical Emergencies", description_ar: "استقبال فوري للحالات الحرجة مع فريق طبي جاهز على مدار الساعة.", description_fr: "Accueil immédiat des cas critiques avec une équipe disponible 24h/24.", description_en: "Immediate reception of critical cases with a team ready around the clock.", icon: "siren", available_24_7: true, order: 1 },
  { id: 2, title_ar: "الاستشارات الطبية المتخصصة", title_fr: "Consultations médicales spécialisées", title_en: "Specialized Medical Consultations", description_ar: "مواعيد استشارة لدى أخصائيين في مختلف التخصصات الطبية.", description_fr: "Rendez-vous de consultation avec des spécialistes de différentes disciplines.", description_en: "Consultation appointments with specialists across medical disciplines.", icon: "calendar-check", order: 2 },
  { id: 3, title_ar: "التحاليل الطبية", title_fr: "Analyses médicales", title_en: "Medical Testing", description_ar: "مخبر مجهز لإجراء التحاليل البيولوجية بنتائج سريعة ودقيقة.", description_fr: "Laboratoire équipé pour des analyses biologiques rapides et précises.", description_en: "A lab equipped for fast and accurate biological testing.", icon: "flask-conical", order: 3 },
  { id: 4, title_ar: "الأشعة والتصوير الطبي", title_fr: "Radiologie et imagerie médicale", title_en: "Radiology & Imaging", description_ar: "خدمات الأشعة السينية والصدى لدعم التشخيص الدقيق.", description_fr: "Services de radiologie et d'échographie pour un diagnostic précis.", description_en: "X-ray and ultrasound services supporting accurate diagnosis.", icon: "scan", available_24_7: true, order: 4 },
  { id: 5, title_ar: "الإيواء والرعاية الداخلية", title_fr: "Hébergement et soins hospitaliers", title_en: "Inpatient Care", description_ar: "أسرة استشفاء مريحة ومتابعة طبية وتمريضية متواصلة.", description_fr: "Lits d'hospitalisation confortables avec suivi médical et infirmier continu.", description_en: "Comfortable hospital beds with continuous medical and nursing follow-up.", icon: "bed-double", available_24_7: true, order: 5 },
  { id: 6, title_ar: "سيارات الإسعاف والنقل الطبي", title_fr: "Ambulances et transport médical", title_en: "Ambulance & Medical Transport", description_ar: "أسطول إسعاف جاهز للتدخل السريع ونقل المرضى بأمان.", description_fr: "Une flotte d'ambulances prête à intervenir et transporter les patients en sécurité.", description_en: "A fleet of ambulances ready for rapid response and safe patient transport.", icon: "ambulance", available_24_7: true, order: 6 },
];

export const FALLBACK_DOCTORS: Doctor[] = [
  { id: 1, full_name_ar: "د. أمين شريط", full_name_fr: "Dr. Amine Cherit", full_name_en: "Dr. Amine Cherit", title_ar: "رئيس مصلحة الاستعجالات", title_fr: "Chef du service des urgences", title_en: "Head of Emergency Department", department_id: 1, schedule: "على مدار الأسبوع، 24/24", schedule_fr: "Toute la semaine, 24/24", schedule_en: "All week, 24/7", schedule_days: "0,1,2,3,4,5,6", schedule_start: "00:00", schedule_end: "23:59" },
  { id: 2, full_name_ar: "د. سميرة بلعيد", full_name_fr: "Dr. Samira Belaïd", full_name_en: "Dr. Samira Belaid", title_ar: "أخصائية في الطب الداخلي", title_fr: "Spécialiste en médecine interne", title_en: "Internal Medicine Specialist", department_id: 2, schedule: "السبت - الخميس، 08:00 - 15:00", schedule_fr: "Samedi - jeudi, 08:00 - 15:00", schedule_en: "Saturday - Thursday, 08:00 - 15:00", schedule_days: "0,1,2,3,4", schedule_start: "08:00", schedule_end: "15:00" },
  { id: 3, full_name_ar: "د. كريم مزياني", full_name_fr: "Dr. Karim Meziani", full_name_en: "Dr. Karim Meziani", title_ar: "جراح عام", title_fr: "Chirurgien général", title_en: "General Surgeon", department_id: 3, schedule: "الأحد، الثلاثاء، الخميس", schedule_fr: "Dimanche, mardi, jeudi", schedule_en: "Sunday, Tuesday, Thursday", schedule_days: "0,2,4", schedule_start: "09:00", schedule_end: "16:00" },
  { id: 4, full_name_ar: "د. ياسمين حداد", full_name_fr: "Dr. Yasmine Haddad", full_name_en: "Dr. Yasmine Haddad", title_ar: "أخصائية في أمراض النساء والتوليد", title_fr: "Spécialiste en gynécologie-obstétrique", title_en: "Obstetrics & Gynecology Specialist", department_id: 4, schedule: "السبت - الأربعاء، 08:00 - 16:00", schedule_fr: "Samedi - mercredi, 08:00 - 16:00", schedule_en: "Saturday - Wednesday, 08:00 - 16:00", schedule_days: "0,1,2,3", schedule_start: "08:00", schedule_end: "16:00" },
  { id: 5, full_name_ar: "د. عبد الرزاق بوزيد", full_name_fr: "Dr. Abderrezak Bouzid", full_name_en: "Dr. Abderrezak Bouzid", title_ar: "طبيب أطفال", title_fr: "Pédiatre", title_en: "Pediatrician", department_id: 5, schedule: "السبت - الخميس، 08:00 - 14:00", schedule_fr: "Samedi - jeudi, 08:00 - 14:00", schedule_en: "Saturday - Thursday, 08:00 - 14:00", schedule_days: "0,1,2,3,4", schedule_start: "08:00", schedule_end: "14:00" },
];

export const FALLBACK_NEWS: NewsItem[] = [
  { id: 1, title_ar: "افتتاح جناح جديد لمصلحة الاستعجالات", title_fr: "Ouverture d'une nouvelle aile pour le service des urgences", title_en: "New Wing Opened for the Emergency Department", excerpt_ar: "تدشين فضاء جديد موسع لاستقبال الحالات الاستعجالية بتجهيزات حديثة.", excerpt_fr: "Inauguration d'un nouvel espace élargi pour l'accueil des urgences, doté d'équipements modernes.", excerpt_en: "Inauguration of a new, expanded space for emergency reception with modern equipment.", published_at: new Date().toISOString(), category: "إعلانات", category_fr: "Annonces", category_en: "Announcements", image_url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80" },
  { id: 2, title_ar: "حملة تحسيس حول الوقاية من داء السكري", title_fr: "Campagne de sensibilisation sur la prévention du diabète", title_en: "Awareness Campaign on Diabetes Prevention", excerpt_ar: "حملة مجانية للكشف عن نسبة السكر في الدم لفائدة سكان الدائرة.", excerpt_fr: "Campagne gratuite de dépistage de la glycémie pour la population de la daïra.", excerpt_en: "A free blood-sugar screening campaign for the district's residents.", published_at: new Date().toISOString(), category: "صحة عمومية", category_fr: "Santé publique", category_en: "Public Health", image_url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80" },
  { id: 3, title_ar: "تعزيز أسطول سيارات الإسعاف", title_fr: "Renforcement de la flotte d'ambulances", title_en: "Ambulance Fleet Reinforced", excerpt_ar: "اقتناء سيارات إسعاف جديدة لتحسين خدمة النقل الطبي الاستعجالي.", excerpt_fr: "Acquisition de nouvelles ambulances pour améliorer le transport médical d'urgence.", excerpt_en: "New ambulances acquired to improve emergency medical transport.", published_at: new Date().toISOString(), category: "تجهيزات", category_fr: "Équipements", category_en: "Equipment", image_url: "https://images.unsplash.com/photo-1682611561092-8f7dcf689006?auto=format&fit=crop&w=1200&q=80" },
];

export async function getDepartments(): Promise<Department[]> {
  return safeFetch("/api/departments", FALLBACK_DEPARTMENTS);
}

export async function getServices(): Promise<Service[]> {
  return safeFetch("/api/services", FALLBACK_SERVICES);
}

export async function getDoctors(): Promise<Doctor[]> {
  return safeFetch("/api/doctors", FALLBACK_DOCTORS);
}

export async function getNews(): Promise<NewsItem[]> {
  return safeFetch("/api/news", FALLBACK_NEWS);
}

export async function getHospitalInfo(): Promise<Hospital | null> {
  return safeFetch("/api/hospital", null);
}

export async function submitContact(payload: {
  full_name: string;
  phone?: string;
  email?: string;
  subject?: string;
  message: string;
}) {
  const res = await fetch(`${API_URL}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.full_name,
      phone: payload.phone || null,
      email: payload.email || null,
      subject: payload.subject || null,
      message: payload.message,
    }),
  });
  if (!res.ok) throw new Error("تعذر إرسال الرسالة");
  return res.json();
}

/** Fresh (uncached) doctor list, used by the doctor sign-up page. */
export async function getDoctorsFresh(): Promise<Doctor[]> {
  const res = await fetch(`${API_URL}/api/doctors`, { cache: "no-store" });
  if (!res.ok) throw new Error("GENERIC");
  return res.json();
}

/** Free time slots ("HH:MM") for one doctor on one day (inside the doctor's working hours). */
export async function getDoctorAvailability(
  doctorId: number,
  date: string
): Promise<{ bookable: boolean; slots: string[]; reason?: string }> {
  const res = await fetch(`${API_URL}/api/doctors/${doctorId}/availability?date=${date}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("GENERIC");
  return res.json();
}

/** Books an appointment. Errors carry a stable code (e.g. "SLOT_UNAVAILABLE"). */
export async function submitAppointment(payload: {
  first_name: string;
  last_name: string;
  phone: string;
  doctor_id: number;
  preferred_date: string;
  preferred_time: string;
  notes?: string;
}) {
  const res = await fetch(`${API_URL}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof body.detail === "string" ? body.detail : "GENERIC");
  }
  return body;
}

// ---- Administration section ----
export type AdminOffice = {
  id: number;
  title_ar: string;
  title_fr?: string | null;
  title_en?: string | null;
  description_ar?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  display_order?: number;
};

export type AdminDirector = {
  id: number;
  name_ar: string;
  name_fr?: string | null;
  name_en?: string | null;
  position_ar?: string | null;
  position_fr?: string | null;
  position_en?: string | null;
  badge_ar?: string | null;
  badge_fr?: string | null;
  badge_en?: string | null;
  description_ar?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  icon?: string | null;
  is_featured?: boolean;
  display_order?: number;
};

export type AdministrationSettings = {
  eyebrow_ar?: string | null;
  eyebrow_fr?: string | null;
  eyebrow_en?: string | null;
  title_ar?: string | null;
  title_fr?: string | null;
  title_en?: string | null;
  subtitle_ar?: string | null;
  subtitle_fr?: string | null;
  subtitle_en?: string | null;
  is_visible?: boolean;
};

export type AdministrationData = {
  settings: AdministrationSettings | null;
  offices: AdminOffice[];
  directors: AdminDirector[];
};

export async function getAdministration(): Promise<AdministrationData> {
  return safeFetch("/api/administration", { settings: null, offices: [], directors: [] });
}

// ---- Department details page (admin-editable extras) ----
export type DepartmentDetail = {
  department_id: number;
  hero_image_url?: string | null;
  side_image_url?: string | null;
  about_image_url?: string | null;
  tag_ar?: string | null; tag_fr?: string | null; tag_en?: string | null;
  hero_subtitle_ar?: string | null; hero_subtitle_fr?: string | null; hero_subtitle_en?: string | null;
  about_ar?: string | null; about_fr?: string | null; about_en?: string | null;
  head_name_ar?: string | null; head_name_fr?: string | null; head_name_en?: string | null;
  floor_ar?: string | null; floor_fr?: string | null; floor_en?: string | null;
  services: { title_ar: string; title_fr?: string | null; title_en?: string | null }[];
};

export async function getDepartmentDetail(id: number): Promise<DepartmentDetail | null> {
  return safeFetch(`/api/department-details/${id}`, null);
}
