/**
 * Hospital location settings  --  the ONLY file you edit for the map.
 *
 * The map, the "Directions" button and the address card all use the same
 * destination, chosen in this order:
 *
 *   1. embedUrl  (most reliable)  -> exact place chosen by you on Google Maps:
 *        Google Maps -> search the hospital -> Share -> "Embed a map"
 *        -> copy ONLY the address inside src="..." and paste it below.
 *        Directions then go to `lat,lng` if you also set them, else to `query`.
 *   2. lat + lng                  -> exact point (right-click the hospital on
 *        Google Maps and click the numbers to copy them).
 *   3. query (default)            -> Google looks the place up by name/address.
 *
 * After changing it, click "Open in Google Maps" on the site once to check the
 * pin is exactly on the hospital.
 */
import type { Locale } from "@/lib/i18n";

export const MAP_CONFIG: {
  embedUrl: string;
  lat: number | null;
  lng: number | null;
  query: string;
  zoom: number;
} = {
  embedUrl: "",
  lat: null,
  lng: null,
  // EPH Hôpital de N'Gaous, Rue de Sétif, N'Gaous 05600, Batna
  query: "EPH Hôpital de N'Gaous, Rue de Sétif, N'Gaous 05600, Batna, Algérie",
  zoom: 16,
};

/** Shown in the card when the API is unreachable. */
export const MAP_FALLBACK = { phone: "033 00 00 00" };

export function hasCoords(): boolean {
  return typeof MAP_CONFIG.lat === "number" && typeof MAP_CONFIG.lng === "number";
}

/** The destination text/coordinates handed to Google Maps. */
export function mapPlace(): string {
  return hasCoords() ? `${MAP_CONFIG.lat},${MAP_CONFIG.lng}` : MAP_CONFIG.query;
}

export function mapEmbedSrc(locale: Locale): string {
  const custom = MAP_CONFIG.embedUrl.trim();
  if (/^https:\/\/www\.google\.com\/maps\/embed/.test(custom)) return custom;
  return `https://www.google.com/maps?q=${encodeURIComponent(mapPlace())}&hl=${locale}&z=${MAP_CONFIG.zoom}&output=embed`;
}

/** Opens the place page in Google Maps. */
export function mapOpenHref(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapPlace())}`;
}

/** Turn-by-turn directions to the hospital, starting from the visitor's location. */
export function mapDirectionsHref(): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapPlace())}&travelmode=driving`;
}
