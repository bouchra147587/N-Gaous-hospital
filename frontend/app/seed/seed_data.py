"""
Seeds the database with the hospital's real content, which previously lived
as hardcoded FALLBACK_* arrays inside the Next.js frontend (frontend/lib/api.ts).
Moving it here means the frontend can now be 100% dynamic (spec section 47/48).

Usage:
    python -m app.seed.seed_data

Safe to re-run: it checks for existing rows by natural key (slug / title)
before inserting, so it will not create duplicates.
"""

from datetime import datetime, timezone

from app.db.database import SessionLocal
from app.models.content import Department, Doctor, Hospital, News, Service
from app.models.operations import Schedule


def seed_hospital_info(db):
    existing = db.query(Hospital).first()
    if existing:
        if existing.about_title_ar:
            print("  hospital_info already present with About content, skipping")
            return
        # Backfill only the new About-section columns on the existing row;
        # never touch fields the admin may have already customized.
        existing.about_title_ar = "المؤسسة العمومية الاستشفائية بنقاوس"
        existing.about_title_fr = "EPH de N'Gaous"
        existing.about_title_en = "N'Gaous Public Hospital"
        existing.about_content_ar = "مؤسسة صحية عمومية تابعة لوزارة الصحة، تقع ببلدية نقاوس ضمن ولاية باتنة، وتسهر على تقديم خدمات استشفائية متكاملة لفائدة المواطنين."
        existing.about_content_fr = "Établissement public hospitalier relevant du ministère de la Santé, situé dans la commune de N'Gaous, wilaya de Batna, offrant des services hospitaliers intégrés aux citoyens."
        existing.about_content_en = "A public health institution under the Ministry of Health, located in N'Gaous, Batna province, providing integrated hospital services to citizens."
        if not existing.history_ar:
            existing.history_ar = "تأسست المؤسسة العمومية الاستشفائية بنقاوس لتلبية الاحتياجات الصحية المتزايدة لسكان الدائرة، وقد شهدت على مر السنين توسعات في مصالحها الطبية وتحديثاً مستمراً لتجهيزاتها، لتصبح اليوم قطباً صحياً هاماً في ولاية باتنة يخدم آلاف المرضى سنوياً عبر مختلف مصالحه الاستشفائية."
            existing.history_fr = "L'EPH de N'Gaous a été fondé pour répondre aux besoins de santé croissants de la population de la daïra. Au fil des années, ses services médicaux se sont étendus et ses équipements ont été modernisés en continu, faisant de lui aujourd'hui un pôle de santé majeur dans la wilaya de Batna, au service de milliers de patients chaque année."
            existing.history_en = "N'Gaous Public Hospital was founded to meet the growing health needs of the district's population. Over the years it has expanded its medical departments and continuously modernized its equipment, becoming today an important health hub in Batna province, serving thousands of patients annually."
        if not existing.mission_ar:
            existing.mission_ar = "تقديم رعاية صحية آمنة وشاملة لسكان دائرة نقاوس والمناطق المجاورة، بجودة عالية وإنسانية في التعامل."
            existing.mission_fr = "Offrir des soins de santé sûrs et complets à la population de la daïra de N'Gaous et des régions voisines, avec une grande qualité et humanité."
            existing.mission_en = "To provide safe and comprehensive healthcare to the population of N'Gaous district and surrounding areas, with high quality and humane care."
        if not existing.vision_ar:
            existing.vision_ar = "أن نكون مؤسسة استشفائية مرجعية في الجهة، رائدة في التكفل بالمريض واعتماد أحدث الوسائل الطبية."
            existing.vision_fr = "Devenir un établissement hospitalier de référence dans la région, pionnier dans la prise en charge du patient et l'adoption des moyens médicaux les plus modernes."
            existing.vision_en = "To be a reference hospital institution in the region, a pioneer in patient care and the adoption of the latest medical means."
        if not existing.values_ar:
            existing.values_ar = "الاحترافية، الاحترام، الشفافية، والعمل الجماعي في خدمة كل مريض يعبر أبوابنا."
            existing.values_fr = "Professionnalisme, respect, transparence et travail d'équipe au service de chaque patient."
            existing.values_en = "Professionalism, respect, transparency, and teamwork serving every patient who walks through our doors."
        db.commit()
        print("  backfilled About-section fields on existing hospital_info row")
        return
    db.add(
        Hospital(
            name_ar="المؤسسة العمومية الاستشفائية بنقاوس",
            name_fr="Établissement Public Hospitalier de Barika",
            name_en="Barika Public Hospital Establishment",
            description_ar="مؤسسة استشفائية عمومية تقدم خدمات طبية وجراحية واستعجالية لسكان دائرة برج بوعريريج وباتنة.",
            address="حي المستشفى، برقاوس",
            wilaya="باتنة",
            phone="033 00 00 00",
            emergency_phone="14",
            email="contact@hopital-barika.dz",
            opening_hours="السبت - الخميس، 08:00 - 16:00",
            emergency_available_24_7=True,
            about_title_ar="المؤسسة العمومية الاستشفائية بنقاوس",
            about_title_fr="EPH de N'Gaous",
            about_title_en="N'Gaous Public Hospital",
            about_content_ar="مؤسسة صحية عمومية تابعة لوزارة الصحة، تقع ببلدية نقاوس ضمن ولاية باتنة، وتسهر على تقديم خدمات استشفائية متكاملة لفائدة المواطنين.",
            about_content_fr="Établissement public hospitalier relevant du ministère de la Santé, situé dans la commune de N'Gaous, wilaya de Batna, offrant des services hospitaliers intégrés aux citoyens.",
            about_content_en="A public health institution under the Ministry of Health, located in N'Gaous, Batna province, providing integrated hospital services to citizens.",
            history_ar="تأسست المؤسسة العمومية الاستشفائية بنقاوس لتلبية الاحتياجات الصحية المتزايدة لسكان الدائرة، وقد شهدت على مر السنين توسعات في مصالحها الطبية وتحديثاً مستمراً لتجهيزاتها، لتصبح اليوم قطباً صحياً هاماً في ولاية باتنة يخدم آلاف المرضى سنوياً عبر مختلف مصالحه الاستشفائية.",
            history_fr="L'EPH de N'Gaous a été fondé pour répondre aux besoins de santé croissants de la population de la daïra. Au fil des années, ses services médicaux se sont étendus et ses équipements ont été modernisés en continu, faisant de lui aujourd'hui un pôle de santé majeur dans la wilaya de Batna, au service de milliers de patients chaque année.",
            history_en="N'Gaous Public Hospital was founded to meet the growing health needs of the district's population. Over the years it has expanded its medical departments and continuously modernized its equipment, becoming today an important health hub in Batna province, serving thousands of patients annually.",
            mission_ar="تقديم رعاية صحية آمنة وشاملة لسكان دائرة نقاوس والمناطق المجاورة، بجودة عالية وإنسانية في التعامل.",
            mission_fr="Offrir des soins de santé sûrs et complets à la population de la daïra de N'Gaous et des régions voisines, avec une grande qualité et humanité.",
            mission_en="To provide safe and comprehensive healthcare to the population of N'Gaous district and surrounding areas, with high quality and humane care.",
            vision_ar="أن نكون مؤسسة استشفائية مرجعية في الجهة، رائدة في التكفل بالمريض واعتماد أحدث الوسائل الطبية.",
            vision_fr="Devenir un établissement hospitalier de référence dans la région, pionnier dans la prise en charge du patient et l'adoption des moyens médicaux les plus modernes.",
            vision_en="To be a reference hospital institution in the region, a pioneer in patient care and the adoption of the latest medical means.",
            values_ar="الاحترافية، الاحترام، الشفافية، والعمل الجماعي في خدمة كل مريض يعبر أبوابنا.",
            values_fr="Professionnalisme, respect, transparence et travail d'équipe au service de chaque patient.",
            values_en="Professionalism, respect, transparency, and teamwork serving every patient who walks through our doors.",
        )
    )
    db.commit()
    print("  seeded hospital_info")


DEPARTMENTS = [
    dict(name_ar="مصلحة الاستعجالات الطبية", name_fr="Service des urgences médicales", name_en="Emergency Department", slug="emergency", description_ar="استقبال ومعالجة الحالات الاستعجالية على مدار 24 ساعة.", description_fr="Accueil et prise en charge des urgences 24h/24.", description_en="Reception and treatment of urgent cases around the clock.", icon="siren", capacity_beds=20, display_order=1),
    dict(name_ar="مصلحة الطب الداخلي", name_fr="Service de médecine interne", name_en="Internal Medicine", slug="internal-medicine", description_ar="متابعة وتشخيص وعلاج الأمراض الباطنية المزمنة والحادة.", description_fr="Suivi, diagnostic et traitement des maladies internes chroniques et aiguës.", description_en="Monitoring, diagnosis and treatment of chronic and acute internal conditions.", icon="stethoscope", capacity_beds=30, display_order=2),
    dict(name_ar="مصلحة الجراحة العامة", name_fr="Service de chirurgie générale", name_en="General Surgery", slug="general-surgery", description_ar="عمليات جراحية مبرمجة واستعجالية بتجهيزات حديثة.", description_fr="Interventions chirurgicales programmées et urgentes avec équipement moderne.", description_en="Scheduled and emergency surgical procedures with modern equipment.", icon="scissors", capacity_beds=25, display_order=3),
    dict(name_ar="مصلحة النساء والتوليد", name_fr="Service de gynécologie-obstétrique", name_en="Maternity & Obstetrics", slug="maternity", description_ar="متابعة الحمل والولادة ورعاية الأم والوليد.", description_fr="Suivi de grossesse, accouchement et soins à la mère et au nouveau-né.", description_en="Pregnancy monitoring, delivery, and care for mother and newborn.", icon="baby", capacity_beds=28, display_order=4),
    dict(name_ar="مصلحة طب الأطفال", name_fr="Service de pédiatrie", name_en="Pediatrics", slug="pediatrics", description_ar="تكفل شامل بصحة الرضع والأطفال.", description_fr="Prise en charge complète de la santé des nourrissons et des enfants.", description_en="Comprehensive care for infants' and children's health.", icon="baby", capacity_beds=20, display_order=5),
    dict(name_ar="مصلحة الأشعة والتصوير الطبي", name_fr="Service de radiologie et imagerie médicale", name_en="Radiology & Medical Imaging", slug="radiology", description_ar="فحوصات بالأشعة السينية والصدى والسكانير.", description_fr="Examens par rayons X, échographie et scanner.", description_en="X-ray, ultrasound and CT scan examinations.", icon="scan", display_order=6),
    dict(name_ar="مخبر التحاليل الطبية", name_fr="Laboratoire d'analyses médicales", name_en="Medical Laboratory", slug="laboratory", description_ar="تحاليل بيولوجية وكيميائية ودموية بنتائج موثوقة.", description_fr="Analyses biologiques, chimiques et sanguines fiables.", description_en="Reliable biological, chemical and blood testing.", icon="flask-conical", display_order=7),
]

SERVICES = [
    dict(title_ar="الاستعجالات الطبية والجراحية", title_fr="Urgences médicales et chirurgicales", title_en="Medical & Surgical Emergencies", description_ar="استقبال فوري للحالات الحرجة مع فريق طبي جاهز على مدار الساعة.", description_fr="Accueil immédiat des cas critiques avec une équipe disponible 24h/24.", description_en="Immediate reception of critical cases with a team ready around the clock.", icon="siren", available_24_7=True, display_order=1),
    dict(title_ar="الاستشارات الطبية المتخصصة", title_fr="Consultations médicales spécialisées", title_en="Specialized Medical Consultations", description_ar="مواعيد استشارة لدى أخصائيين في مختلف التخصصات الطبية.", description_fr="Rendez-vous de consultation avec des spécialistes de différentes disciplines.", description_en="Consultation appointments with specialists across medical disciplines.", icon="calendar-check", display_order=2),
    dict(title_ar="التحاليل الطبية", title_fr="Analyses médicales", title_en="Medical Testing", description_ar="مخبر مجهز لإجراء التحاليل البيولوجية بنتائج سريعة ودقيقة.", description_fr="Laboratoire équipé pour des analyses biologiques rapides et précises.", description_en="A lab equipped for fast and accurate biological testing.", icon="flask-conical", display_order=3),
    dict(title_ar="الأشعة والتصوير الطبي", title_fr="Radiologie et imagerie médicale", title_en="Radiology & Imaging", description_ar="خدمات الأشعة السينية والصدى لدعم التشخيص الدقيق.", description_fr="Services de radiologie et d'échographie pour un diagnostic précis.", description_en="X-ray and ultrasound services supporting accurate diagnosis.", icon="scan", available_24_7=True, display_order=4),
    dict(title_ar="الإيواء والرعاية الداخلية", title_fr="Hébergement et soins hospitaliers", title_en="Inpatient Care", description_ar="أسرة استشفاء مريحة ومتابعة طبية وتمريضية متواصلة.", description_fr="Lits d'hospitalisation confortables avec suivi médical et infirmier continu.", description_en="Comfortable hospital beds with continuous medical and nursing follow-up.", icon="bed-double", available_24_7=True, display_order=5),
    dict(title_ar="سيارات الإسعاف والنقل الطبي", title_fr="Ambulances et transport médical", title_en="Ambulance & Medical Transport", description_ar="أسطول إسعاف جاهز للتدخل السريع ونقل المرضى بأمان.", description_fr="Une flotte d'ambulances prête à intervenir et transporter les patients en sécurité.", description_en="A fleet of ambulances ready for rapid response and safe patient transport.", icon="ambulance", available_24_7=True, display_order=6),
]

# department_slug is resolved to an id after departments are inserted
DOCTORS = [
    dict(full_name_ar="د. أمين شريط", full_name_fr="Dr. Amine Cherit", full_name_en="Dr. Amine Cherit", title_ar="رئيس مصلحة الاستعجالات", title_fr="Chef du service des urgences", title_en="Head of Emergency Department", department_slug="emergency", schedule_ar="على مدار الأسبوع، 24/24", schedule_fr="Toute la semaine, 24/24", schedule_en="All week, 24/7", display_order=1),
    dict(full_name_ar="د. سميرة بلعيد", full_name_fr="Dr. Samira Belaïd", full_name_en="Dr. Samira Belaid", title_ar="أخصائية في الطب الداخلي", title_fr="Spécialiste en médecine interne", title_en="Internal Medicine Specialist", department_slug="internal-medicine", schedule_ar="السبت - الخميس، 08:00 - 15:00", schedule_fr="Samedi - jeudi, 08:00 - 15:00", schedule_en="Saturday - Thursday, 08:00 - 15:00", display_order=2),
    dict(full_name_ar="د. كريم مزياني", full_name_fr="Dr. Karim Meziani", full_name_en="Dr. Karim Meziani", title_ar="جراح عام", title_fr="Chirurgien général", title_en="General Surgeon", department_slug="general-surgery", schedule_ar="الأحد، الثلاثاء، الخميس", schedule_fr="Dimanche, mardi, jeudi", schedule_en="Sunday, Tuesday, Thursday", display_order=3),
    dict(full_name_ar="د. ياسمين حداد", full_name_fr="Dr. Yasmine Haddad", full_name_en="Dr. Yasmine Haddad", title_ar="أخصائية في أمراض النساء والتوليد", title_fr="Spécialiste en gynécologie-obstétrique", title_en="Obstetrics & Gynecology Specialist", department_slug="maternity", schedule_ar="السبت - الأربعاء، 08:00 - 16:00", schedule_fr="Samedi - mercredi, 08:00 - 16:00", schedule_en="Saturday - Wednesday, 08:00 - 16:00", display_order=4),
    dict(full_name_ar="د. عبد الرزاق بوزيد", full_name_fr="Dr. Abderrezak Bouzid", full_name_en="Dr. Abderrezak Bouzid", title_ar="طبيب أطفال", title_fr="Pédiatre", title_en="Pediatrician", department_slug="pediatrics", schedule_ar="السبت - الخميس، 08:00 - 14:00", schedule_fr="Samedi - jeudi, 08:00 - 14:00", schedule_en="Saturday - Thursday, 08:00 - 14:00", display_order=5),
]

NEWS = [
    dict(title_ar="افتتاح جناح جديد لمصلحة الاستعجالات", title_fr="Ouverture d'une nouvelle aile pour le service des urgences", title_en="New Wing Opened for the Emergency Department", excerpt_ar="تدشين فضاء جديد موسع لاستقبال الحالات الاستعجالية بتجهيزات حديثة.", excerpt_fr="Inauguration d'un nouvel espace élargi pour l'accueil des urgences, doté d'équipements modernes.", excerpt_en="Inauguration of a new, expanded space for emergency reception with modern equipment.", category_ar="إعلانات", category_fr="Annonces", category_en="Announcements", image_url="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80", is_published=True),
    dict(title_ar="حملة تحسيس حول الوقاية من داء السكري", title_fr="Campagne de sensibilisation sur la prévention du diabète", title_en="Awareness Campaign on Diabetes Prevention", excerpt_ar="حملة مجانية للكشف عن نسبة السكر في الدم لفائدة سكان الدائرة.", excerpt_fr="Campagne gratuite de dépistage de la glycémie pour la population de la daïra.", excerpt_en="A free blood-sugar screening campaign for the district's residents.", category_ar="صحة عمومية", category_fr="Santé publique", category_en="Public Health", image_url="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80", is_published=True),
    dict(title_ar="تعزيز أسطول سيارات الإسعاف", title_fr="Renforcement de la flotte d'ambulances", title_en="Ambulance Fleet Reinforced", excerpt_ar="اقتناء سيارات إسعاف جديدة لتحسين خدمة النقل الطبي الاستعجالي.", excerpt_fr="Acquisition de nouvelles ambulances pour améliorer le transport médical d'urgence.", excerpt_en="New ambulances acquired to improve emergency medical transport.", category_ar="تجهيزات", category_fr="Équipements", category_en="Equipment", image_url="https://images.unsplash.com/photo-1682611561092-8f7dcf689006?auto=format&fit=crop&w=1200&q=80", is_published=True),
]


def seed_departments(db) -> dict[str, int]:
    slug_to_id = {}
    for data in DEPARTMENTS:
        existing = db.query(Department).filter(Department.slug == data["slug"]).first()
        if existing:
            slug_to_id[data["slug"]] = existing.id
            continue
        dept = Department(**data)
        db.add(dept)
        db.flush()
        slug_to_id[data["slug"]] = dept.id
    db.commit()
    print(f"  seeded {len(DEPARTMENTS)} departments")
    return slug_to_id


def seed_services(db):
    created = 0
    for data in SERVICES:
        if db.query(Service).filter(Service.title_ar == data["title_ar"]).first():
            continue
        db.add(Service(**data))
        created += 1
    db.commit()
    print(f"  seeded {created} services ({len(SERVICES) - created} already existed)")


def seed_doctors(db, dept_ids: dict[str, int]):
    created = 0
    for data in DOCTORS:
        if db.query(Doctor).filter(Doctor.full_name_ar == data["full_name_ar"]).first():
            continue
        payload = {**data}
        slug = payload.pop("department_slug")
        payload["department_id"] = dept_ids.get(slug)
        db.add(Doctor(**payload))
        created += 1
    db.commit()
    print(f"  seeded {created} doctors ({len(DOCTORS) - created} already existed)")


def seed_news(db):
    created = 0
    for data in NEWS:
        if db.query(News).filter(News.title_ar == data["title_ar"]).first():
            continue
        db.add(News(**data, published_at=datetime.now(timezone.utc)))
        created += 1
    db.commit()
    print(f"  seeded {created} news articles ({len(NEWS) - created} already existed)")


def seed_schedules(db, dept_ids: dict[str, int]):
    if db.query(Schedule).first():
        print("  schedules already present, skipping")
        return
    emergency_id = dept_ids.get("emergency")
    if emergency_id:
        db.add(
            Schedule(
                department_id=emergency_id,
                is_emergency=True,
                label_ar="استعجالات على مدار الساعة",
                label_fr="Urgences 24h/24",
                label_en="Emergencies around the clock",
            )
        )
        db.commit()
        print("  seeded 1 baseline schedule (emergency 24/7)")


def run():
    db = SessionLocal()
    try:
        print("Seeding database...")
        seed_hospital_info(db)
        dept_ids = seed_departments(db)
        seed_services(db)
        seed_doctors(db, dept_ids)
        seed_news(db)
        seed_schedules(db, dept_ids)
        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
