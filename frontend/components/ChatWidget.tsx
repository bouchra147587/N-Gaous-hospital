"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  History,
  MessageCircle,
  Plus,
  RotateCcw,
  Send,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { useI18n, type Locale } from "@/lib/i18n";
import { sendChatMessage } from "@/lib/chatApi";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

/** true = button on every public page, false = home page only ("/") */
const SHOW_ON_ALL_PAGES = true;

const STORAGE_KEY = "hospital_chat_v1";
const TEASER_KEY = "hospital_chat_teaser_seen";
const MAX_CONVERSATIONS = 20;
const MAX_MESSAGES = 60;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  error?: boolean;
};

type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Msg[];
};

type Store = {
  conversations: Conversation[];
  /** null = "new conversation" (welcome screen); it is created on first send */
  activeId: string | null;
};

/* ------------------------------------------------------------------ */
/* Texts                                                               */
/* ------------------------------------------------------------------ */

const TXT: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    placeholder: string;
    welcome: string;
    tryAsking: string;
    typing: string;
    newChat: string;
    history: string;
    historyEmpty: string;
    historyNote: string;
    back: string;
    close: string;
    open: string;
    send: string;
    remove: string;
    clearAll: string;
    confirmClear: string;
    yes: string;
    no: string;
    messages: string;
    error: string;
    retry: string;
    teaser: string;
    disclaimer: string;
  }
> = {
  ar: {
    title: "مساعد المستشفى",
    subtitle: "يجيب من بيانات المستشفى",
    placeholder: "اكتب سؤالك هنا...",
    welcome:
      "مرحباً! أنا مساعد المستشفى 👋\nيمكنني إخبارك بالأطباء المتوفرين الآن، والمصالح، والخدمات، وأوقات العمل وحجز المواعيد.",
    tryAsking: "جرّب أحد هذه الأسئلة:",
    typing: "يكتب...",
    newChat: "محادثة جديدة",
    history: "سجل المحادثات",
    historyEmpty: "لا توجد محادثات سابقة بعد.",
    historyNote: "يُحفظ السجل على جهازك فقط.",
    back: "رجوع",
    close: "إغلاق",
    open: "فتح المساعد",
    send: "إرسال",
    remove: "حذف المحادثة",
    clearAll: "مسح كل السجل",
    confirmClear: "حذف كل المحادثات؟",
    yes: "نعم",
    no: "لا",
    messages: "رسائل",
    error: "عذراً، تعذّر الاتصال بالخادم. تحقق من الاتصال وحاول مجدداً.",
    retry: "إعادة المحاولة",
    teaser: "هل تحتاج مساعدة؟ اسألني 💬",
    disclaimer: "لا يقدّم نصائح طبية. في الحالات الطارئة اتصل بالاستعجالات.",
  },
  fr: {
    title: "Assistant de l'hôpital",
    subtitle: "Répond avec les données de l'hôpital",
    placeholder: "Posez votre question...",
    welcome:
      "Bonjour ! Je suis l'assistant de l'hôpital 👋\nJe peux vous renseigner sur les médecins disponibles, les services, les horaires et les rendez-vous.",
    tryAsking: "Essayez l'une de ces questions :",
    typing: "En train d'écrire...",
    newChat: "Nouvelle conversation",
    history: "Historique",
    historyEmpty: "Aucune conversation pour le moment.",
    historyNote: "L'historique reste sur cet appareil uniquement.",
    back: "Retour",
    close: "Fermer",
    open: "Ouvrir l'assistant",
    send: "Envoyer",
    remove: "Supprimer la conversation",
    clearAll: "Tout effacer",
    confirmClear: "Supprimer toutes les conversations ?",
    yes: "Oui",
    no: "Non",
    messages: "messages",
    error: "Désolé, impossible de joindre le serveur. Vérifiez votre connexion et réessayez.",
    retry: "Réessayer",
    teaser: "Besoin d'aide ? Posez-moi vos questions 💬",
    disclaimer: "Pas de conseils médicaux. En cas d'urgence, appelez les urgences.",
  },
  en: {
    title: "Hospital Assistant",
    subtitle: "Answers from hospital data",
    placeholder: "Type your question...",
    welcome:
      "Hello! I'm the hospital assistant 👋\nI can tell you which doctors are available now, and about departments, services, opening hours and appointments.",
    tryAsking: "Try one of these:",
    typing: "Typing...",
    newChat: "New chat",
    history: "Chat history",
    historyEmpty: "No previous conversations yet.",
    historyNote: "History is saved on this device only.",
    back: "Back",
    close: "Close",
    open: "Open assistant",
    send: "Send",
    remove: "Delete conversation",
    clearAll: "Clear all history",
    confirmClear: "Delete all conversations?",
    yes: "Yes",
    no: "No",
    messages: "messages",
    error: "Sorry, couldn't reach the server. Check your connection and try again.",
    retry: "Retry",
    teaser: "Need help? Ask me 💬",
    disclaimer: "No medical advice. In an emergency call the emergency line.",
  },
};

const SUGGESTIONS: Record<Locale, string[]> = {
  ar: [
    "من هم الأطباء المتوفرون الآن؟",
    "ما هي الخدمات المتوفرة؟",
    "ما هي أوقات عمل المستشفى؟",
    "ما هي المصالح المتوفرة؟",
    "كيف أحجز موعداً؟",
    "أين يقع المستشفى؟",
    "ما هو رقم الاستعجالات؟",
  ],
  fr: [
    "Quels médecins sont disponibles maintenant ?",
    "Quels services proposez-vous ?",
    "Quels sont les horaires d'ouverture ?",
    "Quels sont les services de l'hôpital ?",
    "Comment prendre rendez-vous ?",
    "Où se trouve l'hôpital ?",
    "Quel est le numéro des urgences ?",
  ],
  en: [
    "Which doctors are available now?",
    "What services do you offer?",
    "What are the opening hours?",
    "Which departments do you have?",
    "How do I book an appointment?",
    "Where is the hospital located?",
    "What is the emergency number?",
  ],
};

const DATE_TAG: Record<Locale, string> = { ar: "ar-DZ", fr: "fr-DZ", en: "en-GB" };

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { conversations: [], activeId: null };
    const parsed = JSON.parse(raw) as Partial<Store>;
    const conversations = (Array.isArray(parsed.conversations) ? parsed.conversations : [])
      .filter(
        (c): c is Conversation =>
          !!c && typeof c.id === "string" && Array.isArray(c.messages) && typeof c.title === "string"
      )
      .slice(0, MAX_CONVERSATIONS);
    const activeId =
      typeof parsed.activeId === "string" && conversations.some((c) => c.id === parsed.activeId)
        ? parsed.activeId
        : null;
    return { conversations, activeId };
  } catch {
    return { conversations: [], activeId: null };
  }
}

// **bold** and internal links [label](/path). "//host" and backslashes are
// rejected on purpose so a reply can never point to another website.
const RICH_SPLIT = /(\*\*[^*\n]+\*\*|\[[^\]\n]+\]\(\/(?!\/)[^)\s\\]*\))/g;
const LINK_RE = /^\[([^\]]+)\]\((\/(?!\/)[^)\s\\]*)\)$/;
const BOLD_RE = /^\*\*([^*]+)\*\*$/;

function renderRich(text: string, onNavigate: () => void): ReactNode[] {
  return text.split(RICH_SPLIT).map((part, i) => {
    if (!part) return null;
    const link = LINK_RE.exec(part);
    if (link) {
      return (
        <Link key={i} href={link[2]} className="hc-link" onClick={onNavigate}>
          {link[1]}
        </Link>
      );
    }
    const bold = BOLD_RE.exec(part);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function preview(text: string) {
  return text.replace(/\*\*|\[|\]\(\/[^)]*\)/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ChatWidget() {
  const { locale } = useI18n();
  const pathname = usePathname();
  const txt = TXT[locale];
  const suggestions = SUGGESTIONS[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [store, setStore] = useState<Store>({ conversations: [], activeId: null });
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [teaser, setTeaser] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = useMemo(
    () => store.conversations.find((c) => c.id === store.activeId) ?? null,
    [store]
  );
  const messages = active?.messages ?? [];
  const isLoading = loadingId !== null && loadingId === store.activeId;

  /* ---- persistence (localStorage, browser only) ---- */
  useEffect(() => {
    setStore(loadStore());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* storage full / private mode: chat still works, just without history */
    }
  }, [store, hydrated]);

  /* ---- little "Need help?" bubble, once per browser session ---- */
  const markTeaserSeen = useCallback(() => {
    setTeaser(false);
    try {
      sessionStorage.setItem(TEASER_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(TEASER_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (seen) return;
    const show = setTimeout(() => setTeaser(true), 3000);
    const hide = setTimeout(() => markTeaserSeen(), 12000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [hydrated, markTeaserSeen]);

  /* ---- Esc closes, auto-scroll, focus ---- */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loadingId, open, view]);

  useEffect(() => {
    if (open && view === "chat" && window.innerWidth >= 640) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open, view, store.activeId]);

  /* ---- actions ---- */
  const patchConversation = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setStore((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === id ? fn(c) : c)) }));
  }, []);

  async function ask(convId: string, text: string, prior: Msg[]) {
    setLoadingId(convId);
    try {
      const history = prior
        .filter((m) => !m.error)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(text, locale, history);
      const bot: Msg = { id: uid(), role: "assistant", content: res.reply, ts: Date.now() };
      patchConversation(convId, (c) => ({
        ...c,
        updatedAt: bot.ts,
        messages: [...c.messages, bot].slice(-MAX_MESSAGES),
      }));
    } catch {
      const bot: Msg = { id: uid(), role: "assistant", content: txt.error, ts: Date.now(), error: true };
      patchConversation(convId, (c) => ({
        ...c,
        messages: [...c.messages, bot].slice(-MAX_MESSAGES),
      }));
    } finally {
      setLoadingId(null);
    }
  }

  async function send(raw: string) {
    const text = raw.trim().slice(0, 1000);
    if (!text || loadingId) return;

    const now = Date.now();
    const userMsg: Msg = { id: uid(), role: "user", content: text, ts: now };
    let convId: string;
    let prior: Msg[] = [];

    if (active) {
      convId = active.id;
      prior = active.messages;
      patchConversation(convId, (c) => ({
        ...c,
        updatedAt: now,
        messages: [...c.messages, userMsg].slice(-MAX_MESSAGES),
      }));
    } else {
      convId = uid();
      const conv: Conversation = {
        id: convId,
        title: text.length > 42 ? `${text.slice(0, 42)}…` : text,
        createdAt: now,
        updatedAt: now,
        messages: [userMsg],
      };
      setStore((s) => ({
        conversations: [conv, ...s.conversations].slice(0, MAX_CONVERSATIONS),
        activeId: convId,
      }));
    }

    setInput("");
    setView("chat");
    await ask(convId, text, prior);
  }

  function retry(errorMsgId: string) {
    if (!active || loadingId) return;
    const idx = active.messages.findIndex((m) => m.id === errorMsgId);
    let userIdx = -1;
    for (let i = idx - 1; i >= 0; i--) {
      if (active.messages[i].role === "user") {
        userIdx = i;
        break;
      }
    }
    if (userIdx < 0) return;
    const lastUser = active.messages[userIdx];
    const prior = active.messages.slice(0, userIdx);
    patchConversation(active.id, (c) => ({ ...c, messages: c.messages.filter((m) => m.id !== errorMsgId) }));
    void ask(active.id, lastUser.content, prior);
  }

  function startNewChat() {
    setStore((s) => ({ ...s, activeId: null }));
    setInput("");
    setView("chat");
  }

  function openConversation(id: string) {
    setStore((s) => ({ ...s, activeId: id }));
    setView("chat");
  }

  function deleteConversation(id: string) {
    setStore((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    }));
  }

  function clearAll() {
    setStore({ conversations: [], activeId: null });
    setConfirmClear(false);
  }

  function toggle() {
    markTeaserSeen();
    setOpen((v) => !v);
    setView("chat");
  }

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString(DATE_TAG[locale], { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString(DATE_TAG[locale], { day: "numeric", month: "short" });

  const sortedConversations = useMemo(
    () => [...store.conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [store.conversations]
  );

  const closeOnMobileNavigate = () => {
    if (window.innerWidth < 640) setOpen(false);
  };

  /* ---- visibility (after all hooks) ---- */
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/doctor")) return null;
  if (!SHOW_ON_ALL_PAGES && pathname !== "/") return null;

  return (
    <div className="hc-root" dir={dir}>
      {teaser && !open && (
        <button type="button" className="hc-teaser" onClick={toggle}>
          {txt.teaser}
        </button>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={open ? txt.close : txt.open}
        aria-expanded={open}
        aria-controls="hospital-chat-panel"
        className={`hc-fab ${open ? "is-open" : ""}`}
      >
        {open ? <X size={24} /> : <MessageCircle size={26} />}
      </button>

      {open && (
        <section id="hospital-chat-panel" role="dialog" aria-label={txt.title} className="hc-panel">
          {/* Header */}
          <header className="hc-header">
            {view === "history" ? (
              <button type="button" className="hc-iconbtn" onClick={() => setView("chat")} aria-label={txt.back}>
                <BackIcon size={18} />
              </button>
            ) : (
              <span className="hc-avatar" aria-hidden="true">
                <Stethoscope size={18} />
              </span>
            )}

            <div className="hc-headtext">
              <div className="hc-title">{view === "history" ? txt.history : txt.title}</div>
              <div className="hc-subtitle">
                {view === "history" ? (
                  txt.historyNote
                ) : (
                  <>
                    <span className="hc-dot" aria-hidden="true" />
                    {txt.subtitle}
                  </>
                )}
              </div>
            </div>

            <div className="hc-headactions">
              <button type="button" className="hc-iconbtn" onClick={startNewChat} aria-label={txt.newChat} title={txt.newChat}>
                <Plus size={18} />
              </button>
              {view === "chat" && (
                <button
                  type="button"
                  className="hc-iconbtn"
                  onClick={() => setView("history")}
                  aria-label={txt.history}
                  title={txt.history}
                >
                  <History size={18} />
                </button>
              )}
              <button type="button" className="hc-iconbtn" onClick={() => setOpen(false)} aria-label={txt.close} title={txt.close}>
                <X size={18} />
              </button>
            </div>
          </header>

          {/* History view */}
          {view === "history" ? (
            <div className="hc-body" ref={listRef}>
              {sortedConversations.length === 0 ? (
                <p className="hc-empty">{txt.historyEmpty}</p>
              ) : (
                <>
                  {sortedConversations.map((c) => {
                    const last = c.messages[c.messages.length - 1];
                    return (
                      <div key={c.id} className={`hc-hitem ${c.id === store.activeId ? "is-active" : ""}`}>
                        <button type="button" className="hc-hmain" onClick={() => openConversation(c.id)}>
                          <span className="hc-htitle" dir="auto">{c.title}</span>
                          {last && (
                            <span className="hc-hprev" dir="auto">{preview(last.content)}</span>
                          )}
                          <span className="hc-hdate">
                            {fmtDate(c.updatedAt)} · {fmtTime(c.updatedAt)} · {c.messages.length} {txt.messages}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="hc-hdel"
                          onClick={() => deleteConversation(c.id)}
                          aria-label={txt.remove}
                          title={txt.remove}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                  <div className="hc-hfoot">
                    {confirmClear ? (
                      <>
                        <span>{txt.confirmClear}</span>
                        <button type="button" className="hc-linkbtn is-danger" onClick={clearAll}>{txt.yes}</button>
                        <button type="button" className="hc-linkbtn" onClick={() => setConfirmClear(false)}>{txt.no}</button>
                      </>
                    ) : (
                      <button type="button" className="hc-linkbtn is-danger" onClick={() => setConfirmClear(true)}>
                        {txt.clearAll}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="hc-body" ref={listRef} role="log" aria-live="polite">
                {messages.length === 0 && (
                  <div className="hc-welcome">
                    <div className="hc-row hc-row-bot">
                      <div className="hc-bubble hc-bubble-bot">{txt.welcome}</div>
                    </div>
                    <p className="hc-hint">{txt.tryAsking}</p>
                    <div className="hc-chips-grid">
                      {suggestions.map((s) => (
                        <button key={s} type="button" className="hc-chip" onClick={() => send(s)} disabled={loadingId !== null}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m) => (
                  <div key={m.id} className={`hc-row ${m.role === "user" ? "hc-row-user" : "hc-row-bot"}`}>
                    <div
                      dir="auto"
                      className={`hc-bubble ${m.role === "user" ? "hc-bubble-user" : "hc-bubble-bot"} ${m.error ? "hc-bubble-error" : ""}`}
                    >
                      {m.role === "assistant" ? renderRich(m.content, closeOnMobileNavigate) : m.content}
                    </div>
                    <div className="hc-meta">
                      <span>{fmtTime(m.ts)}</span>
                      {m.error && (
                        <button type="button" className="hc-linkbtn" onClick={() => retry(m.id)}>
                          <RotateCcw size={12} /> {txt.retry}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="hc-row hc-row-bot">
                    <div className="hc-bubble hc-bubble-bot hc-typing" aria-label={txt.typing}>
                      <span /><span /><span />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick questions once the conversation has started */}
              {messages.length > 0 && (
                <div className="hc-strip">
                  {suggestions.map((s) => (
                    <button key={s} type="button" className="hc-chip hc-chip-sm" onClick={() => send(s)} disabled={loadingId !== null}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form
                className="hc-inputrow"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  dir="auto"
                  value={input}
                  maxLength={1000}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={txt.placeholder}
                  className="hc-input"
                  disabled={loadingId !== null}
                  autoComplete="off"
                />
                <button type="submit" className="hc-send" disabled={loadingId !== null || !input.trim()} aria-label={txt.send}>
                  <Send size={17} className={dir === "rtl" ? "hc-flip" : ""} />
                </button>
              </form>
              <div className="hc-disclaimer">{txt.disclaimer}</div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
