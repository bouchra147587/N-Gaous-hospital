"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Locale = "ar" | "fr" | "en";

export const LOCALES: { code: Locale; label: string; dir: "rtl" | "ltr" }[] = [
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "en", label: "English", dir: "ltr" },
];

type Dict = Record<string, string>;

const dictionaries: Record<Locale, Dict> = {
  ar: {
    "nav.home": "الرئيسية",
    "nav.about": "من نحن",
    "nav.services": "الخدمات",
    "nav.departments": "المصالح الطبية",
    "nav.doctors": "الأطباء",
    "nav.news": "الأخبار",
    "nav.administration": "الإدارة",
    "nav.contact": "اتصل بنا",
    "nav.emergency": "استعجالات",
    "nav.bookAppointment": "أخذ موعد",
    "nav.openMenu": "فتح القائمة",
    "nav.closeMenu": "إغلاق القائمة",
    "nav.toggleTheme": "تبديل المظهر",
    "nav.language": "اللغة",

    "hero.eyebrow": "وزارة الصحة — ولاية باتنة",
    "hero.title": "المؤسسة العمومية الاستشفائية بنقاوس، في خدمة صحتكم كل يوم",
    "hero.description":
      "نوفر رعاية طبية شاملة عبر مصالح الاستعجالات، الطب الداخلي، الجراحة، التوليد وطب الأطفال، بطاقم طبي وشبه طبي متفانٍ وتجهيزات حديثة.",
    "hero.ctaBook": "أخذ موعد استشارة",
    "hero.ctaEmergency": "استعجالات: 033 00 00 00",

    "stats.beds": "سرير استشفائي",
    "stats.departments": "مصلحة طبية",
    "stats.doctors": "طبيب وأخصائي",
    "stats.service247": "خدمة على مدار الساعة",

    "home.servicesTitle": "خدماتنا الطبية",
    "home.servicesDesc": "مجموعة من الخدمات المصممة لتغطية احتياجاتكم الصحية في مكان واحد.",
    "home.viewAllServices": "جميع الخدمات",
    "home.departmentsTitle": "المصالح الطبية",
    "home.departmentsDesc": "فرق طبية متخصصة موزعة على مصالح استشفائية متكاملة.",
    "home.viewAllDepartments": "جميع المصالح",
    "home.newsTitle": "آخر الأخبار",
    "home.newsDesc": "مستجدات ونشاطات المؤسسة العمومية الاستشفائية بنقاوس.",
    "home.viewAllNews": "كل الأخبار",
    "home.details": "التفاصيل",
    "home.available247": "متوفرة 24/24",
    "home.ctaTitle": "نحن هنا من أجل صحتكم، ليلاً ونهاراً",
    "home.ctaDesc": "بلدية نقاوس، ولاية باتنة — لا تترددوا في التواصل معنا لأي استفسار أو حجز موعد.",
    "home.ctaContact": "تواصل معنا",
    "home.ctaAppointment": "أخذ موعد",
    "home.galleryTitle": "لمحة من مؤسستنا",
    "home.galleryDesc": "بيئة طبية حديثة، مجهزة لخدمة صحتكم بأعلى معايير الجودة.",

    "footer.tagline": "في خدمة صحة المواطن، على مدار الساعة، بكل كفاءة وإنسانية.",
    "footer.quickLinks": "روابط سريعة",
    "footer.contactUs": "تواصل معنا",
    "footer.hours": "أوقات الاستقبال",
    "footer.emergencyHours": "الاستعجالات: على مدار الساعة",
    "footer.consultHours": "الفحوصات: السبت - الخميس، 08:00 - 16:00 — الزيارة: كل يوم 13:00 - 16:00",
    "footer.rights": "جميع الحقوق محفوظة",
    "footer.address": "بلدية نقاوس، ولاية باتنة، الجزائر",

    "about.eyebrow": "تعرّف علينا",
    "about.title": "المؤسسة العمومية الاستشفائية بنقاوس",
    "about.desc":
      "مؤسسة صحية عمومية تابعة لوزارة الصحة، تقع ببلدية نقاوس ضمن ولاية باتنة، وتسهر على تقديم خدمات استشفائية متكاملة لفائدة المواطنين.",
    "about.historyTitle": "عن مؤسستنا",
    "about.historyText":
      "تأسست المؤسسة العمومية الاستشفائية بنقاوس لتلبية الاحتياجات الصحية المتزايدة لسكان الدائرة، وقد شهدت على مر السنين توسعات في مصالحها الطبية وتحديثاً مستمراً لتجهيزاتها، لتصبح اليوم قطباً صحياً هاماً في ولاية باتنة يخدم آلاف المرضى سنوياً عبر مختلف مصالحه الاستشفائية.",
    "about.missionTitle": "رسالتنا",
    "about.missionText":
      "تقديم رعاية صحية آمنة وشاملة لسكان دائرة نقاوس والمناطق المجاورة، بجودة عالية وإنسانية في التعامل.",
    "about.visionTitle": "رؤيتنا",
    "about.visionText":
      "أن نكون مؤسسة استشفائية مرجعية في الجهة، رائدة في التكفل بالمريض واعتماد أحدث الوسائل الطبية.",
    "about.valuesTitle": "قيمنا",
    "about.valuesText": "الاحترافية، الاحترام، الشفافية، والعمل الجماعي في خدمة كل مريض يعبر أبوابنا.",

    "appointment.eyebrow": "حجز موعد",
    "appointment.title": "أخذ موعد استشارة",
    "appointment.desc":
      "املأوا النموذج أدناه وسيتصل بكم فريقنا لتأكيد الموعد. للحالات الاستعجالية، توجهوا مباشرة إلى مصلحة الاستعجالات.",
    "appointment.emergencyLabel": "حالة استعجالية؟",
    "appointment.emergencyNote": "اتصلوا فوراً أو توجهوا مباشرة إلى المؤسسة.",

    "contact.eyebrow": "نحن على استعداد للإجابة",
    "contact.title": "اتصل بنا",
    "contact.desc": "لأي استفسار أو ملاحظة، تواصلوا معنا عبر النموذج أدناه أو باستخدام معلومات الاتصال.",
    "contact.address": "العنوان",
    "contact.phone": "الهاتف",
    "contact.email": "البريد الإلكتروني",
    "contact.hours": "أوقات الاستقبال",
    "contact.hoursValue": "الاستعجالات 24/24 — الفحوصات: 08:00 - 16:00 — الزيارة: 13:00 - 16:00",
    "contact.mapTitle": "خريطة الموقع",

    "departments.eyebrow": "هيكلة المؤسسة",
    "departments.title": "المصالح الطبية",
    "departments.desc": "فرق طبية متخصصة موزعة على مصالح استشفائية متكاملة، تعمل معاً لتقديم رعاية شاملة.",
    "departments.beds": "سرير",
    "departments.backToAll": "كل المصالح",
    "departments.doctorsInDept": "الأطباء في هذه المصلحة",
    "departments.noDoctors": "سيتم تحديث قائمة الأطباء قريباً.",
    "departments.capacity": "الطاقة الاستيعابية",
    "departments.bookHere": "أخذ موعد في هذه المصلحة",

    "doctors.eyebrow": "طاقمنا الطبي",
    "doctors.title": "الأطباء والأخصائيون",
    "doctors.desc": "نخبة من الأطباء والأخصائيين في خدمة صحتكم، عبر مختلف المصالح الطبية بالمؤسسة.",

    "news.eyebrow": "مستجدات",
    "news.title": "أخبار المؤسسة",
    "news.desc": "تابعوا آخر النشاطات والإعلانات الصادرة عن المؤسسة العمومية الاستشفائية بنقاوس.",
    "news.backToAll": "كل الأخبار",
    "news.latestTitle": "آخر الأخبار",
    "news.latestDesc": "مستجدات وأخبار من مستشفى بندريهم فرحات",
    "news.viewAll": "عرض الكل",
    "news.readMore": "اقرأ الخبر",
    "news.publishDate": "تاريخ النشر",
    "news.category": "التصنيف",
    "news.share": "مشاركة الخبر",
    "news.backToNews": "العودة إلى الأخبار",
    "news.home": "الرئيسية",
    "news.empty": "لا توجد أخبار حالياً.",
    "news.gallery": "معرض الصور",
    "news.next": "التالي",
    "news.prev": "السابق",
    "news.copied": "تم نسخ الرابط",
    "news.copyLink": "نسخ الرابط",

    "services.eyebrow": "ما نقدمه",
    "services.title": "خدماتنا الطبية",
    "services.desc": "نغطي احتياجاتكم الصحية عبر مجموعة متكاملة من الخدمات، من الاستعجالات إلى المتابعة المتخصصة.",

    "form.fullName": "الاسم الكامل",
    "form.phone": "رقم الهاتف",
    "form.email": "البريد الإلكتروني",
    "form.subject": "الموضوع",
    "form.message": "الرسالة",
    "form.department": "المصلحة المطلوبة",
    "form.selectDept": "اختر المصلحة (اختياري)",
    "form.preferredDate": "التاريخ المفضل",
    "form.preferredTime": "الوقت المفضل",
    "form.notes": "ملاحظات إضافية",
    "form.submitAppointment": "تأكيد طلب الموعد",
    "form.submitContact": "إرسال الرسالة",
    "form.successAppointmentTitle": "تم استلام طلب موعدكم",
    "form.successAppointmentText": "سنتصل بكم لتأكيد الموعد النهائي خلال أقرب الآجال.",
    "form.successContactTitle": "تم إرسال رسالتكم بنجاح",
    "form.successContactText": "سيقوم فريقنا بالرد عليكم في أقرب وقت.",
    "form.bookAnother": "حجز موعد آخر",
    "form.sendAnother": "إرسال رسالة أخرى",
    "form.errorAppointment": "تعذر إرسال الطلب. تأكدوا من تشغيل الخادم الخلفي (backend) ثم أعيدوا المحاولة.",
    "form.errorContact": "تعذر إرسال الرسالة. تأكدوا من تشغيل الخادم الخلفي (backend) ثم أعيدوا المحاولة.",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.about": "À propos",
    "nav.services": "Services",
    "nav.departments": "Services médicaux",
    "nav.doctors": "Médecins",
    "nav.news": "Actualités",
    "nav.administration": "Administration",
    "nav.contact": "Contact",
    "nav.emergency": "Urgences",
    "nav.bookAppointment": "Prendre RDV",
    "nav.openMenu": "Ouvrir le menu",
    "nav.closeMenu": "Fermer le menu",
    "nav.toggleTheme": "Changer le thème",
    "nav.language": "Langue",

    "hero.eyebrow": "Ministère de la Santé — Wilaya de Batna",
    "hero.title": "L'EPH de N'Gaous, au service de votre santé chaque jour",
    "hero.description":
      "Une prise en charge médicale complète : urgences, médecine interne, chirurgie, maternité et pédiatrie, avec un personnel dévoué et des équipements modernes.",
    "hero.ctaBook": "Prendre un rendez-vous",
    "hero.ctaEmergency": "Urgences : 033 00 00 00",

    "stats.beds": "lits d'hospitalisation",
    "stats.departments": "services médicaux",
    "stats.doctors": "médecins et spécialistes",
    "stats.service247": "service 24h/24",

    "home.servicesTitle": "Nos services médicaux",
    "home.servicesDesc": "Un ensemble de services conçus pour répondre à vos besoins de santé en un seul lieu.",
    "home.viewAllServices": "Tous les services",
    "home.departmentsTitle": "Services médicaux",
    "home.departmentsDesc": "Des équipes spécialisées réparties sur des services hospitaliers complémentaires.",
    "home.viewAllDepartments": "Tous les services",
    "home.newsTitle": "Dernières actualités",
    "home.newsDesc": "Suivez les activités et annonces de l'EPH de N'Gaous.",
    "home.viewAllNews": "Toutes les actualités",
    "home.details": "Détails",
    "home.available247": "Disponible 24/24",
    "home.ctaTitle": "Nous sommes là pour votre santé, jour et nuit",
    "home.ctaDesc": "Commune de N'Gaous, wilaya de Batna — n'hésitez pas à nous contacter pour toute question ou prise de rendez-vous.",
    "home.ctaContact": "Nous contacter",
    "home.ctaAppointment": "Prendre rendez-vous",
    "home.galleryTitle": "Aperçu de notre établissement",
    "home.galleryDesc": "Un environnement médical moderne, équipé pour votre santé selon les plus hauts standards de qualité.",

    "footer.tagline": "Au service de la santé du citoyen, 24h/24, avec compétence et humanité.",
    "footer.quickLinks": "Liens rapides",
    "footer.contactUs": "Nous contacter",
    "footer.hours": "Horaires d'accueil",
    "footer.emergencyHours": "Urgences : 24h/24",
    "footer.consultHours": "Consultations : samedi - jeudi, 08:00 - 16:00",
    "footer.rights": "Tous droits réservés",
    "footer.address": "Commune de N'Gaous, wilaya de Batna, Algérie",

    "about.eyebrow": "Découvrez-nous",
    "about.title": "EPH de N'Gaous",
    "about.desc":
      "Établissement public hospitalier relevant du ministère de la Santé, situé dans la commune de N'Gaous, wilaya de Batna, offrant des services hospitaliers intégrés aux citoyens.",
    "about.historyTitle": "À propos de notre établissement",
    "about.historyText":
      "L'EPH de N'Gaous a été fondé pour répondre aux besoins de santé croissants de la population de la daïra. Au fil des années, ses services médicaux se sont étendus et ses équipements ont été modernisés en continu, faisant de lui aujourd'hui un pôle de santé majeur dans la wilaya de Batna, au service de milliers de patients chaque année.",
    "about.missionTitle": "Notre mission",
    "about.missionText":
      "Offrir des soins de santé sûrs et complets à la population de la daïra de N'Gaous et des régions voisines, avec une grande qualité et humanité.",
    "about.visionTitle": "Notre vision",
    "about.visionText":
      "Devenir un établissement hospitalier de référence dans la région, pionnier dans la prise en charge du patient et l'adoption des moyens médicaux les plus modernes.",
    "about.valuesTitle": "Nos valeurs",
    "about.valuesText": "Professionnalisme, respect, transparence et travail d'équipe au service de chaque patient.",

    "appointment.eyebrow": "Prise de rendez-vous",
    "appointment.title": "Prendre un rendez-vous",
    "appointment.desc":
      "Remplissez le formulaire ci-dessous, notre équipe vous contactera pour confirmer le rendez-vous. En cas d'urgence, rendez-vous directement au service des urgences.",
    "appointment.emergencyLabel": "Cas d'urgence ?",
    "appointment.emergencyNote": "Appelez immédiatement ou rendez-vous directement à l'établissement.",

    "contact.eyebrow": "Nous sommes à votre écoute",
    "contact.title": "Contactez-nous",
    "contact.desc": "Pour toute question ou remarque, contactez-nous via le formulaire ci-dessous ou nos coordonnées.",
    "contact.address": "Adresse",
    "contact.phone": "Téléphone",
    "contact.email": "E-mail",
    "contact.hours": "Horaires d'accueil",
    "contact.hoursValue": "Urgences 24/24 — Consultations : 08:00 - 16:00",
    "contact.mapTitle": "Carte de localisation",

    "departments.eyebrow": "Organisation de l'établissement",
    "departments.title": "Services médicaux",
    "departments.desc": "Des équipes médicales spécialisées réparties sur des services hospitaliers intégrés, œuvrant ensemble pour des soins complets.",
    "departments.beds": "lits",
    "departments.backToAll": "Tous les services",
    "departments.doctorsInDept": "Médecins de ce service",
    "departments.noDoctors": "La liste des médecins sera mise à jour prochainement.",
    "departments.capacity": "Capacité d'accueil",
    "departments.bookHere": "Prendre rendez-vous dans ce service",

    "doctors.eyebrow": "Notre personnel médical",
    "doctors.title": "Médecins et spécialistes",
    "doctors.desc": "Une équipe de médecins et spécialistes au service de votre santé, dans tous les services de l'établissement.",

    "news.eyebrow": "Actualités",
    "news.title": "Actualités de l'établissement",
    "news.desc": "Suivez les dernières activités et annonces de l'EPH de N'Gaous.",
    "news.backToAll": "Toutes les actualités",
    "news.latestTitle": "Dernières actualités",
    "news.latestDesc": "Nouveautés et actualités de l'hôpital Bendrihem Farhat",
    "news.viewAll": "Voir tout",
    "news.readMore": "Lire l'article",
    "news.publishDate": "Date de publication",
    "news.category": "Catégorie",
    "news.share": "Partager l'article",
    "news.backToNews": "Retour aux actualités",
    "news.home": "Accueil",
    "news.empty": "Aucune actualité pour le moment.",
    "news.gallery": "Galerie photos",
    "news.next": "Suivant",
    "news.prev": "Précédent",
    "news.copied": "Lien copié",
    "news.copyLink": "Copier le lien",

    "services.eyebrow": "Ce que nous offrons",
    "services.title": "Nos services médicaux",
    "services.desc": "Nous couvrons vos besoins de santé à travers un ensemble complet de services, des urgences au suivi spécialisé.",

    "form.fullName": "Nom complet",
    "form.phone": "Numéro de téléphone",
    "form.email": "E-mail",
    "form.subject": "Sujet",
    "form.message": "Message",
    "form.department": "Service souhaité",
    "form.selectDept": "Choisir le service (optionnel)",
    "form.preferredDate": "Date préférée",
    "form.preferredTime": "Heure préférée",
    "form.notes": "Notes supplémentaires",
    "form.submitAppointment": "Confirmer la demande",
    "form.submitContact": "Envoyer le message",
    "form.successAppointmentTitle": "Votre demande de rendez-vous a été reçue",
    "form.successAppointmentText": "Nous vous contacterons pour confirmer le rendez-vous final dans les plus brefs délais.",
    "form.successContactTitle": "Votre message a été envoyé avec succès",
    "form.successContactText": "Notre équipe vous répondra dans les meilleurs délais.",
    "form.bookAnother": "Prendre un autre rendez-vous",
    "form.sendAnother": "Envoyer un autre message",
    "form.errorAppointment": "Échec de l'envoi. Vérifiez que le serveur backend est actif puis réessayez.",
    "form.errorContact": "Échec de l'envoi. Vérifiez que le serveur backend est actif puis réessayez.",
  },
  en: {
    "nav.home": "Home",
    "nav.about": "About",
    "nav.services": "Services",
    "nav.departments": "Medical Departments",
    "nav.doctors": "Doctors",
    "nav.news": "News",
    "nav.administration": "Administration",
    "nav.contact": "Contact",
    "nav.emergency": "Emergency",
    "nav.bookAppointment": "Book Appointment",
    "nav.openMenu": "Open menu",
    "nav.closeMenu": "Close menu",
    "nav.toggleTheme": "Toggle theme",
    "nav.language": "Language",

    "hero.eyebrow": "Ministry of Health — Batna Province",
    "hero.title": "N'Gaous Public Hospital, serving your health every day",
    "hero.description":
      "We provide comprehensive medical care through emergency, internal medicine, surgery, maternity and pediatrics departments, with a dedicated staff and modern equipment.",
    "hero.ctaBook": "Book a Consultation",
    "hero.ctaEmergency": "Emergency: 033 00 00 00",

    "stats.beds": "hospital beds",
    "stats.departments": "medical departments",
    "stats.doctors": "doctors & specialists",
    "stats.service247": "service around the clock",

    "home.servicesTitle": "Our Medical Services",
    "home.servicesDesc": "A range of services designed to cover your health needs in one place.",
    "home.viewAllServices": "All services",
    "home.departmentsTitle": "Medical Departments",
    "home.departmentsDesc": "Specialized teams spread across integrated hospital departments.",
    "home.viewAllDepartments": "All departments",
    "home.newsTitle": "Latest News",
    "home.newsDesc": "Follow the news and activities of N'Gaous Public Hospital.",
    "home.viewAllNews": "All news",
    "home.details": "Details",
    "home.available247": "Available 24/7",
    "home.ctaTitle": "We are here for your health, day and night",
    "home.ctaDesc": "N'Gaous, Batna province — feel free to reach out for any inquiry or to book an appointment.",
    "home.ctaContact": "Contact us",
    "home.ctaAppointment": "Book appointment",
    "home.galleryTitle": "A glimpse of our facility",
    "home.galleryDesc": "A modern medical environment, equipped to serve your health to the highest standards.",

    "footer.tagline": "Serving citizens' health, around the clock, with skill and humanity.",
    "footer.quickLinks": "Quick Links",
    "footer.contactUs": "Contact Us",
    "footer.hours": "Reception Hours",
    "footer.emergencyHours": "Emergency: 24/7",
    "footer.consultHours": "Consultations: Saturday - Thursday, 08:00 - 16:00",
    "footer.rights": "All rights reserved",
    "footer.address": "N'Gaous, Batna Province, Algeria",

    "about.eyebrow": "Get to know us",
    "about.title": "N'Gaous Public Hospital",
    "about.desc":
      "A public health institution under the Ministry of Health, located in N'Gaous, Batna province, providing integrated hospital services to citizens.",
    "about.historyTitle": "About Our Institution",
    "about.historyText":
      "N'Gaous Public Hospital was founded to meet the growing health needs of the district's population. Over the years it has expanded its medical departments and continuously modernized its equipment, becoming today an important health hub in Batna province, serving thousands of patients annually.",
    "about.missionTitle": "Our Mission",
    "about.missionText":
      "To provide safe and comprehensive healthcare to the population of N'Gaous district and surrounding areas, with high quality and humane care.",
    "about.visionTitle": "Our Vision",
    "about.visionText":
      "To be a reference hospital institution in the region, a pioneer in patient care and the adoption of the latest medical means.",
    "about.valuesTitle": "Our Values",
    "about.valuesText": "Professionalism, respect, transparency, and teamwork serving every patient who walks through our doors.",

    "appointment.eyebrow": "Book an Appointment",
    "appointment.title": "Book a Consultation",
    "appointment.desc":
      "Fill out the form below and our team will contact you to confirm the appointment. For emergencies, please go directly to the emergency department.",
    "appointment.emergencyLabel": "Emergency case?",
    "appointment.emergencyNote": "Call immediately or head directly to the hospital.",

    "contact.eyebrow": "We're ready to help",
    "contact.title": "Contact Us",
    "contact.desc": "For any inquiry or feedback, reach out via the form below or using our contact details.",
    "contact.address": "Address",
    "contact.phone": "Phone",
    "contact.email": "Email",
    "contact.hours": "Reception Hours",
    "contact.hoursValue": "Emergency 24/7 — Consultations: 08:00 - 16:00",
    "contact.mapTitle": "Location map",

    "departments.eyebrow": "Hospital Structure",
    "departments.title": "Medical Departments",
    "departments.desc": "Specialized medical teams spread across integrated hospital departments, working together to provide comprehensive care.",
    "departments.beds": "beds",
    "departments.backToAll": "All departments",
    "departments.doctorsInDept": "Doctors in this department",
    "departments.noDoctors": "The list of doctors will be updated soon.",
    "departments.capacity": "Bed capacity",
    "departments.bookHere": "Book an appointment in this department",

    "doctors.eyebrow": "Our Medical Staff",
    "doctors.title": "Doctors & Specialists",
    "doctors.desc": "A team of doctors and specialists serving your health, across the hospital's various departments.",

    "news.eyebrow": "Updates",
    "news.title": "Hospital News",
    "news.desc": "Follow the latest activities and announcements from N'Gaous Public Hospital.",
    "news.backToAll": "All news",
    "news.latestTitle": "Latest News",
    "news.latestDesc": "Updates and news from Bendrihem Farhat Hospital",
    "news.viewAll": "View all",
    "news.readMore": "Read article",
    "news.publishDate": "Published on",
    "news.category": "Category",
    "news.share": "Share this article",
    "news.backToNews": "Back to news",
    "news.home": "Home",
    "news.empty": "No news yet.",
    "news.gallery": "Photo gallery",
    "news.next": "Next",
    "news.prev": "Previous",
    "news.copied": "Link copied",
    "news.copyLink": "Copy link",

    "services.eyebrow": "What We Offer",
    "services.title": "Our Medical Services",
    "services.desc": "We cover your health needs through a comprehensive set of services, from emergencies to specialized follow-up.",

    "form.fullName": "Full Name",
    "form.phone": "Phone Number",
    "form.email": "Email",
    "form.subject": "Subject",
    "form.message": "Message",
    "form.department": "Requested Department",
    "form.selectDept": "Select department (optional)",
    "form.preferredDate": "Preferred Date",
    "form.preferredTime": "Preferred Time",
    "form.notes": "Additional Notes",
    "form.submitAppointment": "Confirm Appointment Request",
    "form.submitContact": "Send Message",
    "form.successAppointmentTitle": "Your appointment request has been received",
    "form.successAppointmentText": "We will call you to confirm the final appointment as soon as possible.",
    "form.successContactTitle": "Your message has been sent successfully",
    "form.successContactText": "Our team will get back to you shortly.",
    "form.bookAnother": "Book another appointment",
    "form.sendAnother": "Send another message",
    "form.errorAppointment": "Could not send the request. Make sure the backend server is running and try again.",
    "form.errorContact": "Could not send the message. Make sure the backend server is running and try again.",
  },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dir: "rtl" | "ltr";
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("locale") as Locale | null) : null;
    if (saved && (saved === "ar" || saved === "fr" || saved === "en")) {
      setLocaleState(saved);
    }
  }, []);

  useEffect(() => {
    const dir = LOCALES.find((l) => l.code === locale)?.dir || "rtl";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem("locale", l);
  };

  const value = useMemo<I18nContextValue>(() => {
    const dir = LOCALES.find((l) => l.code === locale)?.dir || "rtl";
    const dict = dictionaries[locale];
    return {
      locale,
      setLocale,
      dir,
      t: (key: string) => dict[key] || dictionaries.ar[key] || key,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Pick a localized field like `pickField(dept, "name", locale)` -> name_fr / name_en / falls back to name_ar */
export function pickField<T extends Record<string, unknown>>(
  obj: T,
  base: string,
  locale: Locale
): string {
  const key = `${base}_${locale}`;
  const fallbackKey = `${base}_ar`;
  const val = (obj[key] as string | undefined) || (obj[fallbackKey] as string | undefined);
  return val || "";
}

export function formatDate(dateStr: string, locale: Locale) {
  const localeTag = locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-GB";
  return new Date(dateStr).toLocaleDateString(localeTag, { year: "numeric", month: "long", day: "numeric" });
}