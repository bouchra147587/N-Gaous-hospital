import {
  Siren,
  Stethoscope,
  Scissors,
  Baby,
  Scan,
  FlaskConical,
  CalendarCheck,
  BedDouble,
  Ambulance,
  HeartPulse,
  LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  siren: Siren,
  stethoscope: Stethoscope,
  scissors: Scissors,
  baby: Baby,
  scan: Scan,
  "flask-conical": FlaskConical,
  "calendar-check": CalendarCheck,
  "bed-double": BedDouble,
  ambulance: Ambulance,
  "heart-pulse": HeartPulse,
};

export function getIcon(name?: string | null): LucideIcon {
  if (!name) return HeartPulse;
  return ICON_MAP[name] || HeartPulse;
}
