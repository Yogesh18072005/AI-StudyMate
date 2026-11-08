import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { env } from "../config/env";
import { chatJSON, getChatDetail, type FlashCard, createFlashcard, listFlashcards, deleteFlashcard, getChats, type ChatMessage, type SavedFlashcard, podcastStart } from "../lib/api";
import MarkdownView from "../components/Chat/MarkdownView";
import ActionRow from "../components/Chat/ActionRow";
import FlashCards from "../components/Chat/FlashCards";
import SelectionPopup from "../components/Chat/SelectionPopup";
import Composer from "../components/Chat/Composer";
import BagFab from "../components/Chat/BagFab";
import BagDrawer from "../components/Chat/BagDrawer";
import LoadingIndicator from "../components/Chat/LoadingIndicator";
import { useCompanion } from "../components/Companion/CompanionProvider";

type BagItem = { id: string; kind: "flashcard" | "note"; title: string; content: string };

function extractFirstJsonObject(s: string): string {
  let depth = 0, start = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") { if (depth === 0) start = i; depth++; }
    else if (ch === "}") { depth--; if (depth === 0 && start !== -1) return s.slice(start, i + 1); }
  }
  return "";
}

function parseLooseStructuredPayload(s: string): { md: string; flashcards: FlashCard[]; topic?: string } | null {
  // Recover the answer from JSON-like output where the model uses a YAML "|" marker.
  const answerMarker = /["']answer["']\s*:\s*\|/;
  const markerMatch = answerMarker.exec(s);
  if (!markerMatch || markerMatch.index === undefined) return null;

  const topicMatch = /["']topic["']\s*:\s*["']([^"']*)["']/.exec(s);
  const answerStart = markerMatch.index + markerMatch[0].length;
  let answerText = s.slice(answerStart);

  const flashcardsMarker = /["']flashcards["']\s*:/;
  const flashcardsMatch = flashcardsMarker.exec(answerText);
  let flashcards: FlashCard[] = [];
  if (flashcardsMatch && flashcardsMatch.index !== undefined) {
    const flashcardsText = answerText.slice(flashcardsMatch.index + flashcardsMatch[0].length).trim();
    const arrayMatch = flashcardsText.match(/^(\[[\s\S]*?\])/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[1]);
        if (Array.isArray(parsed)) flashcards = parsed;
      } catch { }
    }
    answerText = answerText.slice(0, flashcardsMatch.index);
  }

  // Remove wrapper artifacts after the Markdown answer, preserving braces inside it.
  answerText = answerText
    .replace(/\r/g, "")
    .replace(/^\s*\n/, "")
    .replace(/\n?\s*[\x60]{3,}\s*$/g, "")
    .replace(/\n?\s*\\?\s*\}\s*$/g, "");

  const lines = answerText.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const commonIndent = nonEmptyLines.length
    ? Math.min(...nonEmptyLines.map((line) => line.match(/^\s*/)?.[0].length || 0))
    : 0;
  const md = lines.map((line) => line.slice(Math.min(commonIndent, line.length))).join("\n").trim();

  return { md, flashcards, topic: topicMatch?.[1] };
}

function normalizePayload(payload: unknown): { md: string; flashcards: FlashCard[]; topic?: string } {
  if (typeof payload === "string") {
    const s = payload.trim();
    const loosePayload = parseLooseStructuredPayload(s);
    if (loosePayload) return loosePayload;
    if (s.startsWith("{") && s.endsWith("}")) {
      try { const obj = JSON.parse(s); return { md: String(obj?.answer || ""), flashcards: Array.isArray(obj?.flashcards) ? obj.flashcards : [], topic: typeof obj?.topic === "string" ? obj.topic : undefined }; } catch { }
    }
    const inner = extractFirstJsonObject(s);
    if (inner) {
      try { const obj = JSON.parse(inner); return { md: String(obj?.answer || ""), flashcards: Array.isArray(obj?.flashcards) ? obj.flashcards : [], topic: typeof obj?.topic === "string" ? obj.topic : undefined }; } catch { }
    }
    return { md: s, flashcards: [] };
  }
  if (payload && typeof payload === "object") {
    const o = payload as any;
    const answer = typeof o?.answer === "string" ? o.answer : String(o?.html || "");
    // The backend may already wrap the model's raw text in an AskPayload object.
    // Normalize the nested answer too, because it can still contain JSON/YAML-like output.
    const nested = answer ? normalizePayload(answer) : { md: "", flashcards: [] as FlashCard[] };
    return {
      md: nested.md,
      flashcards: nested.flashcards.length ? nested.flashcards : (Array.isArray(o?.flashcards) ? o.flashcards : []),
      topic: (typeof o?.topic === "string" ? o.topic : undefined) || nested.topic,
    };
  }
  return { md: "", flashcards: [] };
}

function deriveTopicFromMarkdown(md: string): string {
  const m = md.match(/^\s*#{1,6}\s+(.+?)\s*$/m);
  return m ? m[1].trim() : "";
}

export default function Chat() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const state = (location?.state || {}) as {
    chatId?: string;
    q?: string;
    answer?: string | { html?: string; answer?: string; flashcards?: FlashCard[]; topic?: string };
    flashcards?: FlashCard[];
  };

  const initialChatId = search.get("chatId") || state.chatId || "";
  const initialQuestion = search.get("q") || state.q || "";

  const [chatId, setChatId] = useState(initialChatId);
  const [messages, setMessages] = useState<ChatMessage[] | undefined>([]);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [bag, setBag] = useState<BagItem[]>([]);
  const [selected, setSelected] = useState<{ text: string; x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState<boolean>(!!(initialChatId || initialQuestion));
  const [awaitingAnswer, setAwaitingAnswer] = useState<boolean>(false);
  const [topic, setTopic] = useState<string>("");
  const [showTopics, setShowTopics] = useState(true);
  const { setDocument } = useCompanion();

  const selPopupRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const answerReceivedRef = useRef(false);
  const keyFor = (kind: BagItem["kind"], title: string, content: string) =>
    `${kind}:${title.trim().toLowerCase()}|${content.trim().toLowerCase()}`;

  useEffect(() => {
    if (!initialChatId && !initialQuestion) {
      (async () => {
        try {
          setConnecting(true);
          const res = await getChats();
          const list = Array.isArray(res?.chats) ? res.chats : [];
          if (list.length) {
            const latest = [...list].sort((a: any, b: any) => (b.at || 0) - (a.at || 0))[0];
            if (latest?.id) {
              setChatId(latest.id);
              navigate(`/chat?chatId=${encodeURIComponent(latest.id)}`, { replace: true, state: { chatId: latest.id } });
            } else {
              navigate("/", { replace: true });
            }
          } else {
            navigate("/", { replace: true });
          }
        } catch {
          navigate("/", { replace: true });
        }
      })();
    }
  }, [initialChatId, initialQuestion, navigate]);

  useEffect(() => {
    const cid = search.get("chatId") || state.chatId || "";
    setChatId(cid);
    if (state.answer) {
      const init = normalizePayload(state.answer);
      const seed: ChatMessage[] = [];
      if (initialQuestion) seed.push({ role: "user", content: initialQuestion, at: Date.now() });
      if (init.md) seed.push({ role: "assistant", content: init.md, at: Date.now() });
      if (seed.length) setMessages(seed);
      if ((init.flashcards?.length || state.flashcards?.length)) setCards(init.flashcards?.length ? init.flashcards : (state.flashcards || []));
      if (init.topic) setTopic(init.topic || "");
      else if (init.md) setTopic(deriveTopicFromMarkdown(init.md));
    } else {
      if (initialQuestion) {
        setMessages((prev) => (Array.isArray(prev) && prev.length ? prev : [{ role: "user", content: initialQuestion, at: Date.now() }]));
        setAwaitingAnswer(true);
      }
    }
  }, [search, state.chatId, state.answer, state.flashcards, initialQuestion]);

  useEffect(() => {
    if (!chatId) return;
    getChatDetail(chatId)
      .then((res) => {
        if (res?.ok && Array.isArray(res.messages)) {
          const normalized = res.messages.map((m) =>
            m.role === "assistant" ? { ...m, content: normalizePayload((m as any).content).md } : m
          );
          setMessages(normalized);
          for (let i = normalized.length - 1; i >= 0; i--) {
            const raw = (res.messages[i] as any)?.content;
            if (normalized[i].role === "assistant") {
              const n = normalizePayload(raw);
              if (n.flashcards.length) setCards(n.flashcards);
              if (n.topic) setTopic(n.topic);
              else if (n.md) setTopic(deriveTopicFromMarkdown(n.md));
              break;
            }
          }
        }
      })
      .catch(() => { });
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !initialQuestion || state.answer) return;

    let cancelled = false;
    answerReceivedRef.current = false;

    const recoverInitialAnswer = async () => {
      for (let attempt = 0; attempt < 300 && !cancelled && !answerReceivedRef.current; attempt++) {
        const detail = await getChatDetail(chatId).catch(() => null);
        const serverMessages = Array.isArray(detail?.messages) ? detail.messages : [];
        const lastMessage = serverMessages[serverMessages.length - 1];
        const lastUserMessage = [...serverMessages].reverse().find((message) => message.role === "user");

        if (lastMessage?.role === "assistant" && lastUserMessage?.content === initialQuestion) {
          answerReceivedRef.current = true;
          const normalized = serverMessages.map((message) =>
            message.role === "assistant"
              ? { ...message, content: normalizePayload((message as any).content).md }
              : message
          );
          setMessages(normalized);

          const answerPayload = normalizePayload((lastMessage as any).content);
          if (answerPayload.flashcards.length) setCards(answerPayload.flashcards);
          if (answerPayload.topic) setTopic(answerPayload.topic);
          else if (answerPayload.md) setTopic((current) => current || deriveTopicFromMarkdown(answerPayload.md));
          setAwaitingAnswer(false);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    };

    void recoverInitialAnswer();
    return () => {
      cancelled = true;
    };
  }, [chatId, initialQuestion, state.answer]);

  useEffect(() => {
    if (!chatId) return;
    const wsUrl = (env.backend || window.location.origin).replace(/^http/, "ws") + `/ws/chat?chatId=${encodeURIComponent(chatId)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => setConnecting(false);
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (m?.type === "answer") {
          if (answerReceivedRef.current) return;
          answerReceivedRef.current = true;
          const norm = normalizePayload(m.answer);
          setMessages((prev) => ([...(Array.isArray(prev) ? prev : []), { role: "assistant", content: norm.md, at: Date.now() }]));
          if (norm.flashcards.length) setCards(norm.flashcards);
          if (norm.topic) setTopic(norm.topic);
          else if (norm.md) setTopic((t) => t || deriveTopicFromMarkdown(norm.md));
          setAwaitingAnswer(false);
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 0);
        } else if (m?.type === "error") {
          setAwaitingAnswer(false);
          setBusy(false);
          const message = typeof m.error === "string" ? m.error : "Unknown server error";
          setMessages((prev) => ([
            ...(Array.isArray(prev) ? prev : []),
            { role: "assistant", content: `I couldn't complete that answer: ${message}`, at: Date.now() }
          ]));
        }
      } catch { }
    };
    return () => { try { ws.close(); } catch { } wsRef.current = null; };
  }, [chatId]);

  useEffect(() => {
    const onSel = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setSelected(null); return; }
      const r = sel.getRangeAt(0);
      const rect = r.getBoundingClientRect();
      if (!rect || !r.toString().trim()) return;
      setSelected({ text: r.toString().trim(), x: rect.left + rect.width / 2 - 60 + window.scrollX, y: rect.bottom + window.scrollY });
    };
    const onDocClick = (e: any) => {
      const n = e.target as Node;
      if (selPopupRef.current && !selPopupRef.current.contains(n) && !window.getSelection()?.toString().trim()) setSelected(null);
    };
    document.addEventListener("mouseup", onSel);
    document.addEventListener("keyup", onSel);
    document.addEventListener("click", onDocClick);
    return () => {
      document.removeEventListener("mouseup", onSel);
      document.removeEventListener("keyup", onSel);
      document.removeEventListener("click", onDocClick);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 0);
  }, [Array.isArray(messages) ? messages.length : 0]);

  const addToBag = async (kind: BagItem["kind"], title: string, content: string) => {
    const k = keyFor(kind, title, content);
    if (seenRef.current.has(k)) return;
    try {
      const { flashcard } = await createFlashcard({
        question: title,
        answer: content,
        tag: kind === "note" ? "note" : "core",
      });
      setBag((b) => [
        { id: flashcard.id, kind, title: flashcard.question, content: flashcard.answer },
        ...b,
      ]);
      seenRef.current.add(k);
    } catch {
      const local = { id: `${Date.now()}-${Math.random()}`, kind, title, content };
      setBag((b) => [local, ...b]);
      seenRef.current.add(k);
    }
  };

  const clearBag = async () => {
    try {
      const res = await listFlashcards();
      const items = res.flashcards || [];
      await Promise.all(items.map((c) => deleteFlashcard(c.id).catch(() => { })));
    } catch { }
    setBag([]);
    seenRef.current.clear();
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await listFlashcards();
        const items = (res.flashcards || []).map<BagItem>((c) => ({
          id: c.id,
          kind: c.tag === "note" ? "note" : "flashcard",
          title: c.question,
          content: c.answer,
        }));
        setBag(items.sort((a, b) => (a.id > b.id ? -1 : 1)));
        const s = new Set<string>();
        for (const it of items) s.add(keyFor(it.kind, it.title, it.content));
        seenRef.current = s;
      } catch { }
    })();
  }, []);

  const sendFollowup = async (q: string) => {
    const text = q.trim();
    if (!text || busy) return;
    setMessages((prev) => ([...(Array.isArray(prev) ? prev : []), { role: "user", content: text, at: Date.now() }]));
    answerReceivedRef.current = false;
    setAwaitingAnswer(true);
    setBusy(true);
    try {
      const r = await chatJSON({ q: text, chatId: chatId || undefined });
      const activeChatId = r?.chatId || chatId;
      if (activeChatId && activeChatId !== chatId) setChatId(activeChatId);

      // The backend starts generating immediately after the POST response.
      // If the WebSocket connects after the answer event, recover it from chat history.
      if (activeChatId) {
        for (let attempt = 0; attempt < 300 && !answerReceivedRef.current; attempt++) {
          const detail = await getChatDetail(activeChatId).catch(() => null);
          const serverMessages = Array.isArray(detail?.messages) ? detail.messages : [];
          const lastMessage = serverMessages[serverMessages.length - 1];
          const lastUserMessage = [...serverMessages].reverse().find((message) => message.role === "user");

          if (lastMessage?.role === "assistant" && lastUserMessage?.content === text) {
            const normalized = serverMessages.map((message) =>
              message.role === "assistant"
                ? { ...message, content: normalizePayload((message as any).content).md }
                : message
            );
            setMessages(normalized);
            const answerMessage = serverMessages[serverMessages.length - 1];
            const answerPayload = normalizePayload((answerMessage as any).content);
            if (answerPayload.flashcards.length) setCards(answerPayload.flashcards);
            if (answerPayload.topic) setTopic(answerPayload.topic);
            else if (answerPayload.md) setTopic((current) => current || deriveTopicFromMarkdown(answerPayload.md));
            setAwaitingAnswer(false);
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 0);
    }
  };

  const latestAssistantContent = useMemo(() => {
    const arr = Array.isArray(messages) ? messages : [];
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].role === "assistant") return arr[i].content;
    }
    return "";
  }, [messages]);

  useEffect(() => {
    if (latestAssistantContent) {
      const docTitle = topic || deriveTopicFromMarkdown(latestAssistantContent) || "Study Topic";
      const docId = chatId ? `chat:${chatId}` : "chat:current";
      setDocument({
        id: docId,
        title: docTitle,
        text: latestAssistantContent,
      });
    } else {
      setDocument(null);
    }
  }, [chatId, latestAssistantContent, setDocument, topic]);

  useEffect(() => {
    return () => setDocument(null);
  }, [setDocument]);

  const list = Array.isArray(messages) ? messages : [];

  return (
    <div className="flex flex-col min-h-screen w-full px-4 lg:pl-28 lg:pr-4">
      {!showTopics && (
        <button
          onClick={() => setShowTopics(true)}
          className="fixed top-5 right-6 z-20 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-950/90 border border-zinc-800 text-stone-400 hover:text-stone-100 hover:bg-stone-900 text-xs font-medium shadow-lg backdrop-blur transition-colors"
          title="Show Important Topics"
          aria-label="Show Important Topics"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M15 3v18" />
          </svg>
          <span>Topics ({cards.length})</span>
        </button>
      )}

      <div className="mt-20 lg:mt-6 mb-16 min-w-0">
        <div className="flex-1 min-w-0 pr-0 lg:pr-2">
          <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 pt-2 pb-28">
            <div className="space-y-6">
              {list.map((m, i) => {
                const userBubble = "inline-block max-w-[85%] bg-stone-900/70 border border-zinc-800 rounded-2xl px-4 py-3";
                if (m.role === "assistant") {
                  return (
                    <div key={i} className="w-full flex justify-start">
                      <div className="w-full mx-auto rounded-3xl bg-stone-950/90 border border-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-1 ring-black/10 backdrop-blur px-5 sm:px-8 py-5 sm:py-8 max-w-full">
                        <div className="animate-[fadeIn_300ms_ease-out] leading-7 md:leading-8 overflow-x-auto">
                          <MarkdownView md={m.content} />
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className="w-full flex justify-start">
                    <div className={userBubble}>
                      <div className="text-stone-200 whitespace-pre-wrap leading-relaxed">{m.content}</div>
                    </div>
                  </div>
                );
              })}
              {(connecting || awaitingAnswer) && (
                <div className="w-full flex justify-start">
                  <LoadingIndicator label={connecting ? "Connecting…" : "Thinking…"} />
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {latestAssistantContent && !awaitingAnswer && (
              <ActionRow
                disabled={busy}
                onSummarize={() => sendFollowup("Summarize the previous answer into 5–7 concise bullet points with bolded keywords.")}
                onLearnMore={() => sendFollowup("Go deeper into this topic with advanced details, real-world examples, and a short analogy.")}
                onStartQuiz={() => {
                  const t = topic || deriveTopicFromMarkdown(latestAssistantContent) || "General";
                  navigate(`/quiz?topic=${encodeURIComponent(t)}`, { state: { topic: t } });
                }}
                onCreatePodcast={async () => {
                  try {
                    const topicContent = latestAssistantContent || topic || "Generated from chat";
                    const response = await podcastStart({ topic: topicContent });
                    navigate("/tools", { state: { podcastPid: response.pid, podcastTopic: topicContent } });
                  } catch (error) {
                    console.error("Failed to create podcast:", error);
                  }
                }}
              />
            )}
          </div>
        </div>

      </div>

      {showTopics && (
        <aside className="hidden lg:block fixed right-4 top-24 bottom-6 z-30 w-[280px] xl:w-[320px]">
          <FlashCards
            items={cards}
            onAdd={({ kind, title, content }) => addToBag(kind, title, content)}
            onToggleCollapse={() => setShowTopics(false)}
          />
        </aside>
      )}

      <SelectionPopup
        selected={selected}
        popupRef={selPopupRef}
        addNote={(text) => { addToBag("note", `Note: ${text.slice(0, 30)}${text.length > 30 ? "..." : ""}`, text); setSelected(null); }}
        askDoubt={(text) => { const v = text.trim(); if (v) sendFollowup(v); setSelected(null); }}
      />

      <Composer disabled={busy} onSend={sendFollowup} />
      <BagFab count={bag.length} onClick={() => setBagOpen(true)} />
      <BagDrawer open={bagOpen} items={bag} onClose={() => setBagOpen(false)} onClear={clearBag} />
    </div>
  );
}
