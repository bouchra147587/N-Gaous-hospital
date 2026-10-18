// Free, keyless translation via the MyMemory API. Used only as a fallback:
// when the admin hasn't filled in a French/English translation for a piece
// of content, we translate the Arabic text live instead of just showing
// Arabic to French/English visitors. Admin-provided translations always
// take priority and never call this.

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const CACHE_PREFIX = "translate-cache:";
const memoryCache = new Map<string, string>();

function cacheKey(text: string, target: "fr" | "en") {
  return `${target}:${text}`;
}

function readLocalCache(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CACHE_PREFIX + key);
  } catch {
    return null;
  }
}

function writeLocalCache(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_PREFIX + key, value);
  } catch {
    // localStorage full or unavailable (e.g. private mode) -- non-fatal,
    // we just lose caching across page reloads.
  }
}

export async function translateText(text: string, target: "fr" | "en"): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const key = cacheKey(trimmed, target);

  const cached = memoryCache.get(key) ?? readLocalCache(key);
  if (cached) {
    memoryCache.set(key, cached);
    return cached;
  }

  try {
    const url = `${MYMEMORY_URL}?q=${encodeURIComponent(trimmed)}&langpair=ar|${target}`;
    const res = await fetch(url);
    if (!res.ok) return trimmed;
    const data = await res.json();
    const translated: string | undefined = data?.responseData?.translatedText;
    if (!translated || data?.responseStatus !== 200) return trimmed;

    memoryCache.set(key, translated);
    writeLocalCache(key, translated);
    return translated;
  } catch {
    // Network error, rate limit, etc. -- fail soft and show the original
    // Arabic text rather than breaking the page.
    return trimmed;
  }
}
