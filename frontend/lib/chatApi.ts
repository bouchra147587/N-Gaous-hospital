import type { Locale } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ChatRole = "user" | "assistant";

/** What the backend needs for context (role + text only). */
export type ChatHistoryItem = {
  role: ChatRole;
  content: string;
};

export type ChatReply = {
  reply: string;
  source: "db" | "ai" | "system";
};

const REQUEST_TIMEOUT_MS = 30_000;

/**
 * POST /api/chat. Throws on network errors, timeouts and non-2xx answers so
 * the widget can show a "retry" bubble.
 */
export async function sendChatMessage(
  message: string,
  locale: Locale,
  history: ChatHistoryItem[] = []
): Promise<ChatReply> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        locale,
        // the backend only needs the recent turns
        history: history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Chat request failed (${res.status})`);
    }

    const data = (await res.json()) as Partial<ChatReply>;
    if (!data.reply) throw new Error("Empty chat reply");
    return { reply: data.reply, source: data.source ?? "db" };
  } finally {
    clearTimeout(timer);
  }
}
