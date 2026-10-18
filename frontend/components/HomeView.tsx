"use client";

import Link from "next/link";
import { mapOpenHref } from "@/lib/mapConfig";
import { useEffect, useState } from "react";
import HeroCarousel from "@/components/HeroCarousel";
import { useI18n, pickField } from "@/lib/i18n";
import { getIcon } from "@/lib/icons";
import { imageForIcon, MEDIA, portraitForDoctor } from "@/lib/media";
import ContactForm from "@/components/ContactForm";
import { useHospitalText } from "@/lib/hospitalContext";
import { resolveMediaUrl } from "@/lib/media";
import HomeNews from "@/components/HomeNews";
import HomeAdministration from "@/components/HomeAdministration";
import BookDoctorButton from "@/components/BookDoctorButton";
import type { NewsItem, AdministrationData } from "@/lib/api";
import {
  ArrowRight,
  ArrowLeft,
  Phone,
  Calendar,
  Shield,
  Heart,
  Clock,
  Award,
  Hospital,
  Target,
  Eye,
  HeartHandshake,
  History,
  BedDouble,
  Stethoscope,
  CalendarClock,
  MapPin,
  Mail,
  FileText,
  Download,
  Network,
  CalendarDays,
  AlertCircle,
  ChevronDown,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Activity,
  CheckCircle2,
} from "lucide-react";

import type { Service, Department, Doctor } from "@/lib/api";

/* ============================================================
   Units registry — keyed by department slug.
   ============================================================ */
export const DEPARTMENT_UNITS: Record<
  string,
  { ar: string; fr: string; en: string }[]
> = {
  "general-surgery": [
    { ar: "استشفاء الرجال", fr: "Hospitalisation hommes", en: "Men's Hospitalization" },
    { ar: "استشفاء النساء", fr: "Hospitalisation femmes", en: "Women's Hospitalization" },
  ],
  obgyn: [
    { ar: "أمراض النساء", fr: "Gynécologie", en: "Gynecology" },
    { ar: "التوليد", fr: "Obstétrique", en: "Obstetrics" },
  ],
  radiology: [{ ar: "الأشعة", fr: "Radiologie", en: "Radiology" }],
  lab: [{ ar: "الكيمياء الحيوية", fr: "Biochimie", en: "Biochemistry" }],
  "internal-medicine": [
    { ar: "استشفاء الرجال", fr: "Hospitalisation hommes", en: "Men's Hospitalization" },
    { ar: "استشفاء النساء", fr: "Hospitalisation femmes", en: "Women's Hospitalization" },
  ],
  dialysis: [{ ar: "تصفية الدم", fr: "Hémodialyse", en: "Hemodialysis" }],
  pediatrics: [{ ar: "طب الأطفال", fr: "Pédiatrie", en: "Pediatrics" }],
  pharmacy: [
    { ar: "تسيير الموارد الصيدلانية", fr: "Gestion des ressources pharmaceutiques", en: "Pharmaceutical Resources Management" },
    { ar: "توزيع الموارد الصيدلانية", fr: "Distribution des ressources pharmaceutiques", en: "Pharmaceutical Resources Distribution" },
  ],
  emergency: [
    { ar: "الاستقبال والفرز", fr: "Accueil et triage", en: "Reception & Triage" },
    { ar: "الوضع تحت الملاحظة", fr: "Observation", en: "Observation" },
  ],
  resuscitation: [
    { ar: "الإنعاش الطبي", fr: "Réanimation médicale", en: "Medical Resuscitation" },
    { ar: "الإنعاش الجراحي", fr: "Réanimation chirurgicale", en: "Surgical Resuscitation" },
  ],
};

const EMERGENCY_SLUG = "emergency";
const FEATURED_SLUGS = ["emergency", "dialysis", "internal-medicine"];

/* ============================================================
   Doctor schedule helpers
   ============================================================ */

const DAY_LABELS: Record<"ar" | "fr" | "en", string[]> = {
  ar: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export function parseDays(csv: string | null | undefined): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

export function formatDays(days: number[], locale: "ar" | "fr" | "en"): string {
  if (days.length === 0) return "";
  if (days.length === 7) {
    return locale === "ar" ? "كل الأيام" : locale === "fr" ? "Tous les jours" : "Every day";
  }
  const sorted = [...days].sort((a, b) => a - b);
  const labels = DAY_LABELS[locale];
  const isContiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (isContiguous && sorted.length >= 3) {
    return `${labels[sorted[0]]} – ${labels[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((d) => labels[d]).join(locale === "ar" ? "، " : ", ");
}

export function shortTime(t: string | null | undefined): string {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export function isPresentNow(doc: Doctor, now: Date = new Date()): boolean | null {
  const days = parseDays(doc.schedule_days);
  if (days.length === 0 || !doc.schedule_start || !doc.schedule_end) return null;
  const today = now.getDay();
  if (!days.includes(today)) return false;
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const start = shortTime(doc.schedule_start);
  const end = shortTime(doc.schedule_end);
  return hhmm >= start && hhmm <= end;
}

/* ============================================================
   Component
   ============================================================ */

export default function HomeView({
  services,
  departments,
  doctors,
  news = [],
  administration,
}: {
  services: Service[];
  departments: Department[];
  doctors: Doctor[];
  news?: NewsItem[];
  administration?: AdministrationData;
  hospital?: unknown;
}) {
  const { t, locale } = useI18n();
  const { h: hosp, text: ht, plain: hp } = useHospitalText();
  const isRTL = locale === "ar";
  const lang = locale as "ar" | "fr" | "en";

  const deptName = (id?: number | null) => {
    const d = departments.find((dep) => dep.id === id);
    return d ? pickField(d, "name", locale) : "";
  };

  const content = {
    hero: {
      title: isRTL ? "نقاوس" : locale === "fr" ? "N'Gaous" : "N'Gaous",
      subtitle: isRTL
        ? "المؤسسة العمومية الاستشفائية"
        : locale === "fr"
        ? "Établissement Public Hospitalier"
        : "Public Hospital Institution",
      description: isRTL
        ? "مرحباً بكم في مستشفى بن درهيم فرحات، في خدمة صحتكم كل يوم، نوفر رعاية طبية شاملة عبر مصالح الاستعجالات، الطب الداخلي، الجراحة، التوليد وطب الأطفال"
        : locale === "fr"
        ? "Bienvenue à l'Hôpital Bendrihem Farhat, à votre service chaque jour, nous offrons des soins médicaux complets aux urgences, médecine interne, chirurgie, obstétrique et pédiatrie"
        : "Welcome to Bendrihem Farhat Hospital, at your service every day, we provide comprehensive medical care in emergency, internal medicine, surgery, obstetrics and pediatrics",
      cta: isRTL ? "أخذ موعد استشارة" : locale === "fr" ? "Prendre rendez-vous" : "Book Appointment",
      emergency: isRTL ? "حالة طارئة؟ اتصل بنا" : locale === "fr" ? "Urgence ? Contactez-nous" : "Emergency? Contact us",
      emergencyNumber: hp("emergency_phone", "+213 33 23 00 00"),
    },
    welcome: {
      subtitle: isRTL
        ? "مرحباً بكم في مستشفى بن دريهم فرحات"
        : locale === "fr"
        ? "Bienvenue à l'Hôpital Bendrihem Farhat"
        : "Welcome to Bendrihem Farhat Hospital",
    },
  };

  const values = [
    { icon: Target, title: t("about.missionTitle"), text: ht("mission", t("about.missionText")) },
    { icon: Eye, title: t("about.visionTitle"), text: ht("vision", t("about.visionText")) },
    { icon: HeartHandshake, title: t("about.valuesTitle"), text: ht("values", t("about.valuesText")) },
  ];

  const organigrammeByLocale: Record<typeof locale, string> = {
    ar: "/organigramme/organigramme-ar.pdf",
    fr: "/organigramme/organigramme-fr.pdf",
    en: "/organigramme/organigramme-en.pdf",
  };
  const organigrammePdf = organigrammeByLocale[locale];

  const organigrammeLabels = {
    ar: {
      title: "الهيكل التنظيمي للمؤسسة",
      desc: "يمكنكم الاطلاع على التنظيم الداخلي للمؤسسة العمومية الاستشفائية أو تحميله بصيغة PDF.",
      view: "عرض الملف",
      download: "تحميل PDF",
    },
    fr: {
      title: "Organigramme de l'établissement",
      desc: "Consultez l'organisation interne de l'établissement public hospitalier ou téléchargez le fichier PDF.",
      view: "Voir le fichier",
      download: "Télécharger le PDF",
    },
    en: {
      title: "Institution Organizational Chart",
      desc: "View the internal organization of the public hospital institution or download the PDF file.",
      view: "View file",
      download: "Download PDF",
    },
  }[locale];

  const schedulesLabels = {
    ar: {
      title: "جداول الفحوصات",
      imageAlt: "مدخل المؤسسة الاستشفائية",
      emergencyTitle: "الاستعجالات الطبية والجراحية",
      emergencyBadge: "24 سا / 7 أيام",
      emergencySubtitle: "الاستعجالات الطبية والجراحية",
      consultationsTitle: "الفحوصات الطبية الخارجية",
      consultationsDays: "السبت - الخميس",
      consultationsHours: "08:00 - 16:00",
      visitLabel: "أوقات الزيارة",
      visitDays: "كل يوم",
      visitHours: "13:00 - 16:00",
    },
    fr: {
      title: "Horaires",
      imageAlt: "Entrée de l'établissement hospitalier",
      emergencyTitle: "Urgences médico-chirurgicales",
      emergencyBadge: "24h/7j",
      emergencySubtitle: "Urgences médico-chirurgicales",
      consultationsTitle: "Consultations médicales externes",
      consultationsDays: "Samedi - Jeudi",
      consultationsHours: "08:00 H - 16:00 H",
      visitLabel: "Heures de visite",
      visitDays: "Tous les jours",
      visitHours: "13:00 H - 16:00 H",
    },
    en: {
      title: "Schedules",
      imageAlt: "Hospital entrance",
      emergencyTitle: "Medical–surgical emergencies",
      emergencyBadge: "24h/7d",
      emergencySubtitle: "Medical & surgical emergencies",
      consultationsTitle: "External Medical consultations",
      consultationsDays: "Saturday–Thursday",
      consultationsHours: "08:00 H – 16:00 H",
      visitLabel: "Visiting hours",
      visitDays: "Every day",
      visitHours: "13:00 H – 16:00 H",
    },
  }[locale];

  const servicesLabels = {
    ar: { prev: "الخدمة السابقة", next: "الخدمة التالية", goTo: "الانتقال إلى", discover: "اكتشف الخدمة" },
    fr: { prev: "Service précédent", next: "Service suivant", goTo: "Aller à", discover: "Découvrir le service" },
    en: { prev: "Previous service", next: "Next service", goTo: "Go to", discover: "Discover the service" },
  }[locale];

  const departmentsLabels = {
    ar: {
      unitsLabel: "الوحدات",
      bedsLabel: "سرير",
      details: "التفاصيل",
      noUnits: "لا توجد وحدات مسجلة.",
      emergencyTag: "طوارئ",
      seeAll: "عرض المزيد",
      seeLess: "عرض أقل",
      allDepartments: "جميع المصالح",
    },
    fr: {
      unitsLabel: "Unités",
      bedsLabel: "lits",
      details: "Détails",
      noUnits: "Aucune unité enregistrée.",
      emergencyTag: "Urgence",
      seeAll: "Voir toutes",
      seeLess: "Voir moins",
      allDepartments: "Toutes les unités",
    },
    en: {
      unitsLabel: "Units",
      bedsLabel: "beds",
      details: "Details",
      noUnits: "No units recorded.",
      emergencyTag: "Emergency",
      seeAll: "See all",
      seeLess: "See less",
      allDepartments: "All departments",
    },
  }[locale];

  /* ---- Doctors section labels ---- */
  const doctorsLabels = {
    ar: {
      available: "متوفر الآن",
      away: "غير متوفر",
      schedule: "أوقات الحضور",
      seeAll: "عرض المزيد",
      seeLess: "عرض أقل",
    },
    fr: {
      available: "Disponible maintenant",
      away: "Non disponible",
      schedule: "Horaires de présence",
      seeAll: "Voir plus",
      seeLess: "Voir moins",
    },
    en: {
      available: "Available now",
      away: "Not available",
      schedule: "Working hours",
      seeAll: "See more",
      seeLess: "See less",
    },
  }[lang];

  const localServices = [
    { id: "surgery", icon: "hospital", image: "/gallery/hospital-1.jpg", available247: false, title: { ar: "الجراحة العامة", fr: "Chirurgie générale", en: "General Surgery" }, description: { ar: "عمليات جراحية عامة ومتخصصة، مع وحدتي استشفاء للرجال والنساء وطاقم جراحي مؤهل.", fr: "Interventions chirurgicales générales et spécialisées, avec deux unités d'hospitalisation (hommes et femmes) et une équipe chirurgicale qualifiée.", en: "General and specialized surgical procedures, with two hospitalization units (men and women) and a qualified surgical team." } },
    { id: "maternity", icon: "heart", image: "/gallery/hospital-2.jpg", available247: false, title: { ar: "أمراض النساء والتوليد", fr: "Gynécologie & Obstétrique", en: "Gynecology & Obstetrics" }, description: { ar: "رعاية كاملة للمرأة الحامل، متابعة الحمل، التوليد الطبيعي والقيصري، وعلاج أمراض النساء.", fr: "Prise en charge complète de la femme enceinte : suivi de grossesse, accouchement naturel et césarienne, et traitement des pathologies gynécologiques.", en: "Complete care for pregnant women: pregnancy follow-up, natural and cesarean delivery, and treatment of gynecological conditions." } },
    { id: "internal", icon: "stethoscope", image: "/gallery/hospital-3.jpg", available247: false, title: { ar: "الطب الداخلي", fr: "Médecine interne", en: "Internal Medicine" }, description: { ar: "تشخيص وعلاج الأمراض المزمنة والحادة، متابعة دقيقة للحالات المعقدة داخل وحدتي الاستشفاء.", fr: "Diagnostic et traitement des maladies chroniques et aiguës, suivi rigoureux des cas complexes dans les deux unités d'hospitalisation.", en: "Diagnosis and treatment of chronic and acute illnesses, with close follow-up of complex cases in both hospitalization units." } },
    { id: "pediatrics", icon: "heart", image: "/gallery/hospital-4.jpg", available247: false, title: { ar: "طب الأطفال", fr: "Pédiatrie", en: "Pediatrics" }, description: { ar: "رعاية صحية شاملة للأطفال، متابعة النمو، التلقيح، وعلاج أمراض الطفولة الشائعة والخطيرة.", fr: "Soins complets pour enfants : suivi de croissance, vaccinations, et traitement des maladies infantiles courantes et graves.", en: "Comprehensive child care: growth monitoring, vaccination, and treatment of common and severe childhood illnesses." } },
    { id: "emergency", icon: "phone", image: "/gallery/hospital-entrance.png", available247: true, title: { ar: "الاستعجالات الطبية والجراحية", fr: "Urgences médico-chirurgicales", en: "Medical & Surgical Emergencies" }, description: { ar: "استقبال، فرز، وضع تحت الملاحظة، ووحدة إنعاش مجهزة لاستقبال جميع الحالات الطارئة على مدار الساعة.", fr: "Accueil, triage, mise en observation et unité de réanimation équipée pour accueillir toutes les urgences 24h/24.", en: "Reception, triage, observation, and a fully equipped resuscitation unit to handle all emergencies 24/7." } },
    { id: "dialysis", icon: "clock", image: "/gallery/hospital-1.jpg", available247: false, title: { ar: "تصفية الدم", fr: "Hémodialyse", en: "Hemodialysis" }, description: { ar: "وحدة مجهزة لتصفية الدم لفائدة مرضى الفشل الكلوي المزمن، بمرافقة طبية وتمريضية متخصصة.", fr: "Unité équipée pour l'hémodialyse destinée aux patients insuffisants rénaux chroniques, avec un suivi médical et infirmier spécialisé.", en: "A unit equipped for hemodialysis for chronic kidney failure patients, with specialized medical and nursing care." } },
    { id: "radiology", icon: "hospital", image: "/gallery/hospital-2.jpg", available247: false, title: { ar: "الأشعة والتصوير الطبي", fr: "Radiologie & Imagerie médicale", en: "Radiology & Medical Imaging" }, description: { ar: "خدمات الأشعة السينية والصدى لدعم التشخيص الدقيق ومتابعة الحالة الصحية.", fr: "Services de radiologie et d'échographie pour appuyer un diagnostic précis et suivre l'état de santé.", en: "X-ray and ultrasound services supporting accurate diagnosis and health follow-up." } },
    { id: "lab", icon: "stethoscope", image: "/gallery/hospital-3.jpg", available247: false, title: { ar: "التحاليل المخبرية", fr: "Analyses de laboratoire", en: "Laboratory Analyses" }, description: { ar: "تحاليل الكيمياء الحيوية والفحوصات المخبرية الدقيقة، بالاعتماد على أحدث التجهيزات.", fr: "Analyses de biochimie et examens de laboratoire précis, réalisés avec des équipements modernes.", en: "Biochemistry and precise laboratory tests, performed with modern equipment." } },
    { id: "pharmacy", icon: "shield", image: "/gallery/hospital-4.jpg", available247: false, title: { ar: "الصيدلية الاستشفائية", fr: "Pharmacie hospitalière", en: "Hospital Pharmacy" }, description: { ar: "تسيير وتوزيع الموارد الصيدلانية داخل المؤسسة لضمان توفر الأدوية لجميع المرضى.", fr: "Gestion et distribution des ressources pharmaceutiques au sein de l'établissement pour garantir la disponibilité des médicaments.", en: "Management and distribution of pharmaceutical resources within the institution to ensure medication availability." } },
  ];

  const localDepartments: {
    id: string;
    slug: string;
    image: string;
    icon: string;
    beds?: number;
    isEmergency?: boolean;
    name: { ar: string; fr: string; en: string };
    description: { ar: string; fr: string; en: string };
  }[] = [
    { id: "general-surgery", slug: "general-surgery", image: "/gallery/hospital-1.jpg", icon: "hospital", beds: 60, name: { ar: "الجراحة العامة", fr: "Chirurgie générale", en: "General Surgery" }, description: { ar: "مصلحة جراحية مجهزة بطاقة استيعابية تبلغ 60 سريراً، تقدّم مختلف التدخلات الجراحية العامة والمتخصصة.", fr: "Service chirurgical disposant de 60 lits, offrant diverses interventions chirurgicales générales et spécialisées.", en: "Surgical department with 60 beds, offering various general and specialized surgical procedures." } },
    { id: "obgyn", slug: "obgyn", image: "/gallery/hospital-2.jpg", icon: "heart", beds: 60, name: { ar: "طب أمراض النساء والتوليد", fr: "Gynécologie-Obstétrique", en: "Gynecology & Obstetrics" }, description: { ar: "مصلحة متخصصة في متابعة الحمل والولادة وعلاج أمراض النساء، بطاقة استيعابية تبلغ 60 سريراً.", fr: "Service spécialisé dans le suivi de grossesse, l'accouchement et la gynécologie, avec une capacité de 60 lits.", en: "Department specialized in pregnancy follow-up, delivery and gynecology, with a capacity of 60 beds." } },
    { id: "radiology", slug: "radiology", image: "/gallery/hospital-3.jpg", icon: "hospital", name: { ar: "الأشعة المركزية", fr: "Radiologie centrale", en: "Central Radiology" }, description: { ar: "مصلحة الأشعة المركزية تقدم خدمات التصوير الطبي بالأشعة السينية لدعم التشخيص الدقيق.", fr: "Le service de radiologie centrale fournit des services d'imagerie médicale par rayons X pour un diagnostic précis.", en: "The central radiology department provides X-ray medical imaging services for accurate diagnosis." } },
    { id: "lab", slug: "lab", image: "/gallery/hospital-4.jpg", icon: "stethoscope", name: { ar: "المخبر المركزي", fr: "Laboratoire central", en: "Central Laboratory" }, description: { ar: "المخبر المركزي للتحاليل الطبية، يقدّم خدمات الكيمياء الحيوية والفحوصات المخبرية الدقيقة.", fr: "Laboratoire central d'analyses médicales, offrant des services de biochimie et de tests de laboratoire précis.", en: "Central medical analysis laboratory, offering biochemistry services and precise laboratory tests." } },
    { id: "internal-medicine", slug: "internal-medicine", image: "/gallery/hospital-1.jpg", icon: "stethoscope", beds: 70, name: { ar: "الطب الداخلي", fr: "Médecine interne", en: "Internal Medicine" }, description: { ar: "مصلحة الطب الداخلي تتابع الأمراض المزمنة والحادة، بطاقة استيعابية تبلغ 70 سريراً.", fr: "Le service de médecine interne prend en charge les maladies chroniques et aiguës, avec une capacité de 70 lits.", en: "The internal medicine department handles chronic and acute diseases, with a capacity of 70 beds." } },
    { id: "dialysis", slug: "dialysis", image: "/gallery/hospital-2.jpg", icon: "clock", name: { ar: "وحدة تصفية الدم", fr: "Unité d'hémodialyse", en: "Hemodialysis Unit" }, description: { ar: "وحدة تصفية الدم مخصصة لمرضى الفشل الكلوي المزمن، بمرافقة طبية وتمريضية متخصصة.", fr: "Unité d'hémodialyse dédiée aux patients insuffisants rénaux chroniques, avec un suivi médical et infirmier spécialisé.", en: "Hemodialysis unit dedicated to chronic kidney failure patients, with specialized medical and nursing care." } },
    { id: "pediatrics", slug: "pediatrics", image: "/gallery/hospital-3.jpg", icon: "heart", beds: 60, name: { ar: "طب الأطفال", fr: "Pédiatrie", en: "Pediatrics" }, description: { ar: "مصلحة طب الأطفال تقدّم رعاية صحية شاملة للأطفال، بطاقة استيعابية تبلغ 60 سريراً.", fr: "Le service de pédiatrie offre des soins complets aux enfants, avec une capacité de 60 lits.", en: "The pediatrics department provides comprehensive child care, with a capacity of 60 beds." } },
    { id: "pharmacy", slug: "pharmacy", image: "/gallery/hospital-4.jpg", icon: "shield", name: { ar: "وحدة الصيدلة", fr: "Unité de pharmacie", en: "Pharmacy Unit" }, description: { ar: "وحدة الصيدلة تسيّر وتوزّع الموارد الصيدلانية لضمان توفر الأدوية داخل المؤسسة.", fr: "L'unité de pharmacie gère et distribue les ressources pharmaceutiques pour garantir la disponibilité des médicaments.", en: "The pharmacy unit manages and distributes pharmaceutical resources to ensure medication availability." } },
    { id: "emergency", slug: "emergency", image: "/gallery/hospital-entrance.png", icon: "phone", beds: 18, isEmergency: true, name: { ar: "الاستعجالات الطبية الجراحية", fr: "Urgences médico-chirurgicales", en: "Medical & Surgical Emergency" }, description: { ar: "مصلحة الاستعجالات تقدم رعاية طارئة على مدار الساعة، بطاقة استيعابية تبلغ 18 سريراً.", fr: "Le service des urgences assure une prise en charge 24h/24, avec une capacité de 18 lits.", en: "The emergency department provides round-the-clock care, with a capacity of 18 beds." } },
    { id: "resuscitation", slug: "resuscitation", image: "/gallery/hospital-1.jpg", icon: "activity", name: { ar: "مصلحة الإنعاش", fr: "Service de réanimation", en: "Resuscitation Department" }, description: { ar: "مصلحة الإنعاش مخصصة لرعاية الحالات الحرجة بعد العمليات الجراحية أو الحوادث الخطيرة، بتجهيزات متطورة ومرافقة طبية مستمرة.", fr: "Service de réanimation dédié aux soins des cas critiques après chirurgie ou accidents graves, avec équipements avancés et suivi médical continu.", en: "Resuscitation department dedicated to critical care after surgery or serious accidents, with advanced equipment and continuous medical monitoring." } },
  ];

  const servicesToRender =
    services && services.length > 0
      ? services.map((s) => ({
          id: String(s.id),
          image: s.image_url || imageForIcon(s.icon),
          available247: !!s.available_24_7,
          title: pickField(s, "title", locale),
          description: pickField(s, "description", locale),
        }))
      : localServices.map((s) => ({
          id: s.id,
          image: s.image,
          available247: s.available247,
          title: s.title[locale as "ar" | "fr" | "en"],
          description: s.description[locale as "ar" | "fr" | "en"],
        }));

  const allDepartmentsToRender =
    departments && departments.length > 0
      ? departments.map((d) => ({
          id: String(d.id),
          slug: d.slug,
          image: d.image_url || imageForIcon(d.icon),
          beds: d.capacity_beds,
          isEmergency: d.slug === EMERGENCY_SLUG,
          name: pickField(d, "name", locale),
          description: pickField(d, "description", locale),
          units: (DEPARTMENT_UNITS[d.slug] ?? []).map((u) => u[locale as "ar" | "fr" | "en"]),
        }))
      : localDepartments.map((d) => ({
          id: d.id,
          slug: d.slug,
          image: d.image,
          beds: d.beds,
          isEmergency: !!d.isEmergency,
          name: d.name[locale as "ar" | "fr" | "en"],
          description: d.description[locale as "ar" | "fr" | "en"],
          units: (DEPARTMENT_UNITS[d.slug] ?? []).map((u) => u[locale as "ar" | "fr" | "en"]),
        }));

  const featuredDepartments = FEATURED_SLUGS
    .map((slug) => allDepartmentsToRender.find((d) => d.slug === slug))
    .filter((d): d is (typeof allDepartmentsToRender)[number] => Boolean(d));

  const restDepartments = allDepartmentsToRender.filter(
    (d) => !FEATURED_SLUGS.includes(d.slug)
  );

  /* ---- Doctor split for "see all" ---- */
  const DOCTOR_STEP = 3;
  const [visibleDoctors, setVisibleDoctors] = useState(DOCTOR_STEP);
  const shownDoctors = doctors.slice(0, visibleDoctors);
  const canShowMoreDoctors = visibleDoctors < doctors.length;
  const canShowLessDoctors = visibleDoctors > DOCTOR_STEP;

  const [activeService, setActiveService] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showAllDepartments, setShowAllDepartments] = useState(false);

  useEffect(() => {
    if (!autoPlay || servicesToRender.length <= 1) return;
    const id = setInterval(() => {
      setActiveService((i) => (i + 1) % servicesToRender.length);
    }, 6000);
    return () => clearInterval(id);
  }, [autoPlay, servicesToRender.length]);

  useEffect(() => {
    if (activeService >= servicesToRender.length) setActiveService(0);
  }, [servicesToRender.length, activeService]);

  const goPrev = () => {
    if (servicesToRender.length === 0) return;
    setActiveService((i) => (i - 1 + servicesToRender.length) % servicesToRender.length);
  };
  const goNext = () => {
    if (servicesToRender.length === 0) return;
    setActiveService((i) => (i + 1) % servicesToRender.length);
  };
  const goTo = (i: number) => setActiveService(i);

  const contactInfo: {
    icon: typeof MapPin;
    label: string;
    value: string;
    dir?: "ltr" | "rtl";
    href?: string;
    external?: boolean;
  }[] = [
    { icon: MapPin, label: t("contact.address"), value: [hp("address", t("footer.address")), hp("wilaya", "")].filter(Boolean).join(" - "), href: mapOpenHref(), external: true },
    { icon: Phone, label: t("contact.phone"), value: hp("phone", "033 00 00 00"), dir: "ltr", href: `tel:${hp("phone", "033 00 00 00").replace(/[^\d+]/g, "")}` },
    { icon: Mail, label: t("contact.email"), value: hp("email", "contact@eph-ngaous.dz"), dir: "ltr", href: `mailto:${hp("email", "contact@eph-ngaous.dz")}` },
    { icon: Clock, label: t("contact.hours"), value: hp("opening_hours", t("contact.hoursValue")) },
  ];

  /* ----------------------------------------------------------
     Department card renderer
     ---------------------------------------------------------- */
  const renderDepartmentCard = (d: (typeof allDepartmentsToRender)[number]) => {
    const isEmergency = d.isEmergency;

    return (
      <Link
        key={d.id}
        href={`/departments/${d.slug}`}
        className={`dept2-card group ${isEmergency ? "is-emergency" : ""}`}
      >
        <div className="dept2-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.image} alt="" className="dept2-img" />
          <div className="dept2-overlay" />
          {isEmergency && <span className="dept2-tag">{departmentsLabels.emergencyTag}</span>}
          {typeof d.beds === "number" && (
            <span className="dept2-beds">
              {d.beds} {departmentsLabels.bedsLabel}
            </span>
          )}
          <h3 className="dept2-name">{d.name}</h3>
        </div>

        <div className="dept2-body">
          <p className="dept2-desc">{d.description}</p>

          {d.units.length > 0 && (
            <div className="dept2-units">
              {d.units.map((u, idx) => (
                <span key={idx} className="dept2-chip">{u}</span>
              ))}
            </div>
          )}

          <span className="dept2-more">
            {departmentsLabels.details}
            <ArrowRight size={15} className="rtl:rotate-180" />
          </span>
        </div>
      </Link>
    );
  };

  /* ----------------------------------------------------------
     Doctor card renderer — circular + live status
     ---------------------------------------------------------- */
  const renderDoctorCard = (doc: Doctor) => {
    const present = isPresentNow(doc);
    const days = parseDays(doc.schedule_days);
    const hasStructuredSchedule =
      days.length > 0 && !!doc.schedule_start && !!doc.schedule_end;

    const daysLabel = hasStructuredSchedule ? formatDays(days, lang) : "";
    const timeLabel = hasStructuredSchedule
      ? `${shortTime(doc.schedule_start)} – ${shortTime(doc.schedule_end)}`
      : "";

    const legacySchedule =
      locale === "fr"
        ? doc.schedule_fr || doc.schedule
        : locale === "en"
        ? doc.schedule_en || doc.schedule
        : doc.schedule;

    return (
      <article
        key={doc.id}
        className="doctor-card group relative flex flex-col items-center rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--green-deep)] hover:shadow-xl"
      >
        {/* ---- Circular avatar ---- */}
        <div className="relative -mt-2 mb-3">
          <div
            className={`doctor-avatar-ring ${
              present === true
                ? "is-available"
                : present === false
                ? "is-away"
                : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doc.image_url || portraitForDoctor(doc.id)}
              alt={pickField(doc, "full_name", locale)}
              className="doctor-avatar"
            />
          </div>

          <span className="absolute -bottom-1 -end-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-[var(--paper)]">
            <Stethoscope size={15} className="text-[var(--green-deep)]" />
          </span>
        </div>

        {/* ---- Live status badge ---- */}
        {present !== null && (
          <span className={`doctor-status ${present ? "is-available" : "is-away"}`}>
            <span className="doctor-status-dot" aria-hidden="true" />
            {present ? doctorsLabels.available : doctorsLabels.away}
          </span>
        )}

        {/* ---- Name + title ---- */}
        <h3 className="mt-3 text-base font-extrabold leading-6 text-[var(--ink)]">
          {pickField(doc, "full_name", locale)}
        </h3>

        <p className="mt-1 text-sm font-medium text-[var(--green-deep)]">
          {pickField(doc, "title", locale)}
        </p>
        {pickField(doc, "grade", locale) && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gold)]">
            <GraduationCap size={13} />
            {pickField(doc, "grade", locale)}
          </p>
        )}

        {doc.department_id && (
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            {deptName(doc.department_id)}
          </p>
        )}

        {/* ---- Schedule block ---- */}
        {(hasStructuredSchedule || legacySchedule) && (
          <div className="mt-5 w-full border-t border-[var(--line)] pt-4 text-start">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
              <CalendarClock size={12} className="text-[var(--gold)]" />
              {doctorsLabels.schedule}
            </p>

            {hasStructuredSchedule ? (
              <div className="flex flex-col gap-1 text-xs text-[var(--ink-soft)]">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[var(--green-deep)]" />
                  {daysLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock size={13} className="text-[var(--gold)]" />
                  <span dir="ltr">{timeLabel}</span>
                </span>
              </div>
            ) : (
              <p className="text-xs leading-6 text-[var(--ink-soft)]">
                {legacySchedule}
              </p>
            )}
          </div>
        )}

        <BookDoctorButton doctor={doc} />
      </article>
    );
  };

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section
        id="home"
        data-hero="true"
        className={`hero-section section-anchor ${isRTL ? "hero-rtl" : "hero-ltr"}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="hero-background" data-hero-bg="true">
          <HeroCarousel
            isRTL={isRTL}
            images={[
              { src: "/hospitalNg.png", alt: isRTL ? "مستشفى بن دريهم فرحات" : "Bendrihem Farhat Hospital" },
              { src: "/hopital8.png", alt: isRTL ? "مدخل المستشفى" : "Hospital entrance" },
              { src: "/hopital5.jpg", alt: isRTL ? "واجهة5 المستشفى" : "Hospital 5exterior" },
              { src: "/hopital6.png", alt: isRTL ? "واجهة 6المستشفى" : "Hospital 6exterior" },
              { src: "/hopital7.png", alt: isRTL ? "واجهة 7المستشفى" : "Hospital 7exterior" },
            ]}
          />
        </div>

        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-heading">
              <div className="hero-subtitle">{content.hero.subtitle}</div>
              <h1 className="hero-title">{content.hero.title}</h1>
            </div>

            <p className="hero-description">{content.hero.description}</p>

            <div className="hero-actions">
              <a href={`tel:${content.hero.emergencyNumber.replace(/[^\d+]/g, "")}`} className="hero-emergency-button">
                <span className="hero-emergency-icon">
                  <Phone size={18} />
                </span>
                <span className="hero-emergency-text">
                  <small>{content.hero.emergency}</small>
                  <strong>{content.hero.emergencyNumber}</strong>
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="hero-scroll">
          <span />
        </div>
      </section>

      {/* WELCOME */}
      <section className="py-16 md:py-20 bg-[var(--paper)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--green-deeper)] mt-4">
              {content.welcome.subtitle}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#087db7] to-[#0f9e94] rounded-full mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="group bg-[var(--paper)] rounded-2xl p-8 border border-[var(--line)] hover:border-[#087db7] transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center">
              <div className="w-16 h-16 rounded-full bg-[#087db7]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#087db7] transition-colors duration-300">
                <Heart className="w-8 h-8 text-[#087db7] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2">
                {isRTL ? "رعاية صحية متكاملة" : locale === "fr" ? "Soins complets" : "Comprehensive Care"}
              </h3>
              <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                {isRTL
                  ? "نوفر رعاية صحية متكاملة وشاملة لجميع أفراد الأسرة"
                  : locale === "fr"
                  ? "Nous fournissons des soins de santé complets et intégrés pour toute la famille"
                  : "We provide comprehensive and integrated healthcare for the whole family"}
              </p>
            </div>

            <div className="group bg-[var(--paper)] rounded-2xl p-8 border border-[var(--line)] hover:border-[#087db7] transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center">
              <div className="w-16 h-16 rounded-full bg-[#087db7]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#087db7] transition-colors duration-300">
                <Clock className="w-8 h-8 text-[#087db7] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2">
                {isRTL ? "خدمة على مدار الساعة" : locale === "fr" ? "Service 24/7" : "24/7 Service"}
              </h3>
              <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                {isRTL
                  ? "نحن هنا لخدمتك على مدار الساعة طوال أيام الأسبوع"
                  : locale === "fr"
                  ? "Nous sommes à votre service 24 heures sur 24, 7 jours sur 7"
                  : "We are here to serve you 24 hours a day, 7 days a week"}
              </p>
            </div>

            <div className="group bg-[var(--paper)] rounded-2xl p-8 border border-[var(--line)] hover:border-[#087db7] transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-center">
              <div className="w-16 h-16 rounded-full bg-[#087db7]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#087db7] transition-colors duration-300">
                <Award className="w-8 h-8 text-[#087db7] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2">
                {isRTL ? "طاقم طبي متخصص" : locale === "fr" ? "Équipe médicale spécialisée" : "Specialized Medical Team"}
              </h3>
              <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                {isRTL
                  ? "فريق طبي وشبه طبي منفذين وتجهيزات حديثة"
                  : locale === "fr"
                  ? "Équipe médicale et paramédicale dévouée et équipements modernes"
                  : "Dedicated medical and paramedical team with modern equipment"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section-anchor border-t border-[var(--line)] bg-[var(--paper-raised)]">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <p className="mb-3 text-sm font-semibold text-[var(--brick)]">{t("about.eyebrow")}</p>
          <h2 className="text-balance text-3xl font-extrabold text-[var(--green-deeper)] md:text-4xl">
            {ht("about_title", "") || ht("name", t("about.title"))}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-soft)] md:text-base">
            {ht("description", t("about.desc"))}
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-extrabold text-[var(--green-deeper)]">{t("about.historyTitle")}</h3>
            <p className="mt-4 whitespace-pre-line text-sm leading-8 text-[var(--ink-soft)]">{ht("history", "") || ht("about_content", t("about.historyText"))}</p>
          </div>
          <div className="photo-card h-64 w-full md:h-80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolveMediaUrl(hosp?.about_image_url) || "/hopital.png"} alt="" className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 px-5 pb-16 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="photo-card p-7">
              <v.icon className="text-[var(--green-deep)]" size={28} />
              <h3 className="mt-4 text-base font-bold text-[var(--ink)]">{v.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{v.text}</p>
            </div>
          ))}
        </div>

        {/* ORGANIGRAMME */}
        <div className="mx-auto max-w-6xl px-5 pb-16">
          <div className="photo-card overflow-hidden">
            <div className="flex flex-col gap-6 p-7 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--green-mist)]">
                  <Network className="text-[var(--green-deep)]" size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[var(--green-deeper)]">
                    {organigrammeLabels.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--ink-soft)]">
                    {organigrammeLabels.desc}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={organigrammePdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-2.5 text-sm font-semibold text-[var(--green-deep)] transition-colors hover:border-[var(--green-deep)] hover:bg-[var(--green-mist)]"
                >
                  <FileText size={16} />
                  {organigrammeLabels.view}
                </a>
                <a
                  href={organigrammePdf}
                  download
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--green-deep)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
                >
                  <Download size={16} />
                  {organigrammeLabels.download}
                </a>
              </div>
            </div>

            <div className="hidden border-t border-[var(--line)] md:block">
              <object
                data={organigrammePdf}
                type="application/pdf"
                className="h-[500px] w-full"
                aria-label={organigrammeLabels.title}
              >
                <div className="flex h-full w-full items-center justify-center p-8 text-center text-sm text-[var(--ink-soft)]">
                  <p>
                    {isRTL
                      ? "متصفحك لا يدعم عرض ملفات PDF. "
                      : locale === "fr"
                      ? "Votre navigateur ne prend pas en charge l'affichage des PDF. "
                      : "Your browser does not support inline PDF viewing. "}
                    <a href={organigrammePdf} className="font-semibold text-[var(--green-deep)] underline">
                      {organigrammeLabels.view}
                    </a>
                  </p>
                </div>
              </object>
            </div>
          </div>
        </div>

        {/* SCHEDULES */}
        <div className="mx-auto max-w-6xl px-5 pb-16">
          <div className="mb-10 text-center">
            <h3 className="text-balance text-3xl font-extrabold text-[var(--ink)] md:text-4xl">
              {schedulesLabels.title}
            </h3>
            <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-[#087db7] to-[#0f9e94]" />
          </div>

          <div className="grid gap-8 md:grid-cols-2 md:items-stretch">
            <div className="photo-card h-72 w-full md:h-full md:min-h-[520px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/gallery/hospital-entrance.jpg"
                alt={schedulesLabels.imageAlt}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 md:p-8">
                <h4 className="text-xl font-extrabold text-[var(--brick)] md:text-2xl">
                  {schedulesLabels.emergencyTitle}
                </h4>

                <div className="mt-6 flex items-center justify-center gap-4">
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[6px] border-[var(--brick)] bg-white">
                    <span className="absolute left-1/2 top-1/2 h-[2px] w-7 origin-left -translate-y-1/2 rotate-[-90deg] bg-[var(--brick)]" />
                    <span className="absolute left-1/2 top-1/2 h-7 w-[2px] origin-top -translate-x-1/2 rotate-[-30deg] bg-[var(--brick)]" />
                    <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brick)]" />
                  </div>

                  <div className="relative">
                    <div className="rounded-md bg-[var(--green-deep)] px-5 py-2 text-center text-white shadow-md">
                      <div className="text-2xl font-extrabold leading-none">
                        {schedulesLabels.emergencyBadge}
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-90">
                        {schedulesLabels.emergencySubtitle}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 md:p-8">
                <h4 className="text-xl font-extrabold text-[#e79b16] md:text-2xl">
                  {schedulesLabels.consultationsTitle}
                </h4>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
                  <span className="text-base font-extrabold text-[var(--ink)] md:text-lg">
                    {schedulesLabels.consultationsDays}
                  </span>
                  <span className="text-base font-extrabold text-[var(--green-deep)] md:text-lg">
                    {schedulesLabels.consultationsHours}
                  </span>
                </div>

                <div className="mt-5 border-t border-[var(--line)] pt-5">
                  <h5 className="text-lg font-extrabold text-[#e79b16] md:text-xl">
                    {schedulesLabels.visitLabel}
                  </h5>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-base font-extrabold text-[var(--ink)] md:text-lg">
                      {schedulesLabels.visitDays}
                    </span>
                    <span className="text-base font-extrabold text-[var(--green-deep)] md:text-lg" dir="ltr">
                      {schedulesLabels.visitHours}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEPARTMENTS */}
      <section id="departments" className="section-anchor border-t border-[var(--line)]">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <p className="mb-3 text-sm font-semibold text-[var(--brick)]">{t("departments.eyebrow")}</p>
          <h2 className="text-balance text-3xl font-extrabold text-[var(--green-deeper)] md:text-4xl">
            {t("departments.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-soft)] md:text-base">
            {t("departments.desc")}
          </p>
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDepartments.map(renderDepartmentCard)}
          </div>

          {restDepartments.length > 0 && (
            <div
              id="more-departments"
              className={`dept-more-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-500 ease-out ${
                showAllDepartments
                  ? "mt-6 max-h-[6000px] opacity-100"
                  : "mt-0 max-h-0 overflow-hidden opacity-0"
              }`}
              aria-hidden={!showAllDepartments}
            >
              {restDepartments.map(renderDepartmentCard)}
            </div>
          )}

          {restDepartments.length > 0 && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllDepartments((v) => !v)}
                aria-expanded={showAllDepartments}
                aria-controls="more-departments"
                className="group inline-flex items-center gap-2 rounded-full border border-[var(--green-deep)] bg-[var(--paper)] px-6 py-3 text-sm font-bold text-[var(--green-deep)] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--green-deep)] hover:text-white hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green-deep)]"
              >
                <span>
                  {showAllDepartments
                    ? departmentsLabels.seeLess
                    : departmentsLabels.seeAll}
                </span>
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-300 ${
                    showAllDepartments ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="section-anchor svc-section border-t border-[var(--line)] bg-[var(--paper-raised)]">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <h2 className="text-balance text-3xl font-extrabold text-[var(--green-deeper)] md:text-4xl">
            {t("services.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-soft)] md:text-base">
            {t("services.desc")}
          </p>
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-16">
          {servicesToRender.length === 0 ? (
            <div className="photo-card p-10 text-center text-sm text-[var(--ink-soft)]">
              {t("departments.noDoctors")}
            </div>
          ) : (
            <div
              className="svc-carousel"
              onMouseEnter={() => setAutoPlay(false)}
              onMouseLeave={() => setAutoPlay(true)}
            >
              <div className="svc-carousel__viewport">
                <div
                  className="svc-carousel__track"
                  style={{
                    transform: `translateX(${isRTL ? activeService * 100 : -activeService * 100}%)`,
                  }}
                >
                  {servicesToRender.map((s, si) => (
                    <div key={s.id} className={`svc-carousel__slide ${si === activeService ? "is-active" : ""}`}>
                      <article className="svc-card">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.image} alt="" className="svc-card__img" />

                        <div className="svc-card__pane" aria-hidden="true" />

                        {s.available247 && (
                          <span className="svc-card__badge">
                            <span>{t("home.available247")}</span>
                            <span className="svc-card__badge-dot" aria-hidden="true" />
                          </span>
                        )}

                        <div className="svc-card__body">
                          <h3 className="svc-card__title">{s.title}</h3>
                          <p className="svc-card__text">{s.description}</p>
                        </div>
                      </article>
                    </div>
                  ))}
                </div>

                {servicesToRender.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="svc-carousel__arrow svc-carousel__arrow--prev"
                      aria-label={servicesLabels.prev}
                      onClick={goPrev}
                    >
                      <ChevronLeft size={20} strokeWidth={2.6} className="rtl:rotate-180" />
                    </button>
                    <button
                      type="button"
                      className="svc-carousel__arrow svc-carousel__arrow--next"
                      aria-label={servicesLabels.next}
                      onClick={goNext}
                    >
                      <ChevronRight size={20} strokeWidth={2.6} className="rtl:rotate-180" />
                    </button>
                  </>
                )}

                {servicesToRender.length > 1 && (
                  <div className="svc-carousel__dots" role="tablist">
                    {servicesToRender.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        role="tab"
                        aria-selected={i === activeService}
                        aria-label={`${servicesLabels.goTo} ${s.title}`}
                        className={`svc-carousel__dot ${i === activeService ? "is-active" : ""}`}
                        onClick={() => goTo(i)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          DOCTORS — circular avatars, live status, "See all"
          ===================================================== */}
      <section id="doctors" className="section-anchor border-t border-[var(--line)]">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <p className="mb-3 text-sm font-semibold text-[var(--brick)]">{t("doctors.eyebrow")}</p>
          <h2 className="text-balance text-3xl font-extrabold text-[var(--green-deeper)] md:text-4xl">
            {t("doctors.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-soft)] md:text-base">
            {t("doctors.desc")}
          </p>
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shownDoctors.map(renderDoctorCard)}
          </div>

          {/* ---- 3 more / 3 less at a time ---- */}
          {(canShowMoreDoctors || canShowLessDoctors) && (
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {canShowMoreDoctors && (
                <button
                  type="button"
                  onClick={() => setVisibleDoctors((n) => Math.min(n + DOCTOR_STEP, doctors.length))}
                  className="group inline-flex items-center gap-2 rounded-full border border-[var(--green-deep)] bg-[var(--paper)] px-6 py-3 text-sm font-bold text-[var(--green-deep)] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--green-deep)] hover:text-white hover:shadow-lg"
                >
                  <span>{doctorsLabels.seeAll}</span>
                  <ChevronDown size={18} />
                </button>
              )}
              {canShowLessDoctors && (
                <button
                  type="button"
                  onClick={() => setVisibleDoctors((n) => Math.max(DOCTOR_STEP, Math.ceil((n - DOCTOR_STEP) / DOCTOR_STEP) * DOCTOR_STEP))}
                  className="group inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-6 py-3 text-sm font-bold text-[var(--ink-soft)] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--green-deep)] hover:text-[var(--green-deep)]"
                >
                  <span>{doctorsLabels.seeLess}</span>
                  <ChevronDown size={18} className="rotate-180" />
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ADMINISTRATION */}
      {administration && <HomeAdministration data={administration} />}

      {/* CONTACT */}
      <HomeNews news={news} />

      <section id="contact" className="section-anchor ct-section">
        <div className="ct-inner">
          <header className="ct-head">
            <p className="ct-eyebrow">{t("contact.eyebrow")}</p>
            <h2 className="ct-title">{t("contact.title")}</h2>
            <p className="ct-desc">{t("contact.desc")}</p>
          </header>

          {/* address · phone · email · hours, side by side */}
          <div className="ct-cards">
            {contactInfo.map((i) => {
              const body = (
                <>
                  <span className="ct-icon">
                    <i.icon size={22} />
                  </span>
                  <span className="ct-label">{i.label}</span>
                  <span className="ct-value" dir={i.dir}>
                    {i.value}
                  </span>
                </>
              );
              return i.href ? (
                <a
                  key={i.label}
                  href={i.href}
                  className="ct-card is-link"
                  {...(i.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {body}
                </a>
              ) : (
                <div key={i.label} className="ct-card">
                  {body}
                </div>
              );
            })}
          </div>

          <div className="ct-form-card">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}