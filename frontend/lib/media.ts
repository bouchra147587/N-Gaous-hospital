/**
 * Curated medical/hospital photography, sourced from Unsplash (free Unsplash
 * License — no attribution required). Used to give department, service,
 * doctor and news cards a real photographic image instead of icon-only tiles.
 */
function u(id: string, w = 1200) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
}

export const MEDIA = {
  /** Real photo of the hospital's own entrance gate. */
  hospitalReal: "/hospital-entrance.jpg",

  hospitalBuilding: u("photo-1586773860418-d37222d8fce3"), // exterior building
  hospitalLobby: u("photo-1519494026892-80bbd2d6fd0d"), // lobby reception
  hospitalCorridorBed: u("photo-1512678080530-7760d81faba6"),
  hospitalBed: u("photo-1628372095387-017d1099fc19"),
  emptyWard: u("photo-1538108149393-fbbd81895907"),
  ambulance: u("photo-1682611561092-8f7dcf689006"),
  doctorStethoscopeRed: u("photo-1532938911079-1b06ac7ceec7"),
  doctorLaptopStethoscope: u("photo-1576091160550-2173dba999ef"),
  doctorWomanStethoscope: u("photo-1638202993928-7267aad84c31"),
  surgeryTeam: u("photo-1640876777002-badf6aee5bcc"),
  ivStand: u("photo-1516574187841-cb9cc2ca948b"),
  stethoscopeCloseup: u("photo-1505751172876-fa1923c5c528"),
  medicalTeamWorking: u("photo-1504813184591-01572f98c85f"),
  bluGloves: u("photo-1584820927498-cfe5211fd8bf"),
  heartStethoscope: u("photo-1624727828489-a1e03b79bba8"),
  labTestTubes: u("photo-1631556763178-b96af5e9993e"),
  pediatricCare: u("photo-1631815588090-d4bfec5b1ccb"),
  maternityCare: u("photo-1584582396500-6bea82d2a44c"),
  radiologyScan: u("photo-1516069677018-378515003435"),
  nurseHallway: u("photo-1587351021355-a479a299d2f9"),

  // Portraits used as neutral avatar photography for the medical staff directory.
  doctorPortraitMan1: u("photo-1622253692010-333f2da6031d", 400),
  doctorPortraitWoman1: u("photo-1594824476967-48c8b964273f", 400),
  doctorPortraitMan2: u("photo-1537368910025-700350fe46c7", 400),
  doctorPortraitWoman2: u("photo-1651008376811-b90baee60c1f", 400),
  doctorPortraitMan3: u("photo-1612349317150-e413f6a5b16d", 400),
};

/** Fallback image mapped by department/service icon key, for cards without a dedicated image_url. */
export const ICON_IMAGE: Record<string, string> = {
  siren: MEDIA.ambulance,
  stethoscope: MEDIA.doctorLaptopStethoscope,
  scissors: MEDIA.surgeryTeam,
  baby: MEDIA.pediatricCare,
  scan: MEDIA.radiologyScan,
  "flask-conical": MEDIA.labTestTubes,
  "calendar-check": MEDIA.doctorWomanStethoscope,
  "bed-double": MEDIA.hospitalBed,
  ambulance: MEDIA.ambulance,
  "heart-pulse": MEDIA.stethoscopeCloseup,
};

export function imageForIcon(icon?: string | null) {
  if (!icon) return MEDIA.medicalTeamWorking;
  return ICON_IMAGE[icon] || MEDIA.medicalTeamWorking;
}

/** Round-robin doctor portrait, so the staff directory shows real faces without per-record data. */
const DOCTOR_PORTRAITS = [
  MEDIA.doctorPortraitMan1,
  MEDIA.doctorPortraitWoman1,
  MEDIA.doctorPortraitMan2,
  MEDIA.doctorPortraitWoman2,
  MEDIA.doctorPortraitMan3,
];

export function portraitForDoctor(id: number) {
  return DOCTOR_PORTRAITS[id % DOCTOR_PORTRAITS.length];
}

const MEDIA_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Images uploaded through the admin are stored as "/media/uploads/xxx.jpg"
 * on the backend. Turn that into a full URL the browser can load; leave
 * absolute URLs and empty values untouched.
 */
export function resolveMediaUrl(value?: string | null): string {
  if (!value) return "";
  if (/^https?:\/\//.test(value)) return value;
  return `${MEDIA_API_URL}${value}`;
}
