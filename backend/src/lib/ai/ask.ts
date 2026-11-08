import fs from "fs"
import path from "path"
import crypto from "crypto"
import { config } from "../../config/env"
import llm from "../../utils/llm/llm"
import { execDirect } from "../../agents/runtime"
import { normalizeTopic } from "../../utils/text/normalize"

export type AskCard = { q: string; a: string; tags?: string[] }
export type AskPayload = { topic: string; answer: string; flashcards: AskCard[] }

function toText(out: any): string {
  if (!out) return ""
  if (typeof out === "string") return out
  if (typeof out?.content === "string") return out.content
  if (Array.isArray(out?.content)) return out.content.map((p: any) => (typeof p === "string" ? p : p?.text ?? "")).join("")
  if (Array.isArray(out?.generations) && out.generations[0]?.text) return out.generations[0].text
  return String(out ?? "")
}

function guessTopic(q: string): string {
  const t = String(q ?? "").trim().replace(/\s+/g, " ")
  if (t.length <= 80) return t
  const m = t.match(/\babout\s+([^?.!]{3,80})/i) || t.match(/\b(on|of|for|in)\s+([^?.!]{3,80})/i)
  return (m?.[2] || m?.[1] || t.slice(0, 80)).trim()
}

function extractFirstJsonObject(s: string): string {
  let depth = 0, start = -1
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === "{") { if (depth === 0) start = i; depth++ }
    else if (ch === "}") { depth--; if (depth === 0 && start !== -1) return s.slice(start, i + 1) }
  }
  return ""
}

function tryParse<T = unknown>(s: string): T | null {
  try { return JSON.parse(s) as T } catch { return null }
}

function parseLooseModelPayload(s: string): { topic?: string; answer: string; flashcards: AskCard[] } | null {
  // Recover YAML-style block answers returned inside a JSON-like wrapper.
  const answerMatch = /["']answer["']\s*:\s*\|/.exec(s)
  if (!answerMatch || answerMatch.index === undefined) return null

  const topicMatch = /["']topic["']\s*:\s*["']([^"']*)["']/.exec(s)
  let answerText = s.slice(answerMatch.index + answerMatch[0].length)
  let flashcards: AskCard[] = []

  const cardsMatch = /["']flashcards["']\s*:/.exec(answerText)
  if (cardsMatch && cardsMatch.index !== undefined) {
    const cardsText = answerText.slice(cardsMatch.index + cardsMatch[0].length).trim()
    const arrayMatch = cardsText.match(/^(\[[\s\S]*?\])/)
    if (arrayMatch) {
      const parsedCards = tryParse<AskCard[]>(arrayMatch[1])
      if (Array.isArray(parsedCards)) flashcards = parsedCards
    }
    answerText = answerText.slice(0, cardsMatch.index)
  }

  answerText = answerText
    .replace(/\r/g, "")
    .replace(/^\s*\n/, "")
    .replace(/\n?\s*[\x60]{3,}\s*$/g, "")
    .replace(/\n?\s*\\?\s*},?\s*$/g, "")

  const lines = answerText.split("\n")
  const nonEmpty = lines.filter(line => line.trim().length > 0)
  const indent = nonEmpty.length
    ? Math.min(...nonEmpty.map(line => line.match(/^\s*/)?.[0].length || 0))
    : 0
  const answer = lines.map(line => line.slice(Math.min(indent, line.length))).join("\n").trim()

  return { topic: topicMatch?.[1], answer, flashcards }
}

export const BASE_SYSTEM_PROMPT = `
You are AI-StudyMate, a clear and accurate study assistant.

Follow the user's instructions exactly. If they request a specific number of points, questions, examples, steps, or words, satisfy that requirement completely. Never replace a requested numbered answer with only a short introductory paragraph.

Explain concepts in simple, student-friendly language. Use headings and Markdown when useful. For exam-style answers, use the requested number of clearly numbered points, with each point containing a complete explanation. Be accurate, focused, and avoid unnecessary filler.

Return ONLY one valid JSON object with this structure:
{
  "topic": "short topic name",
  "answer": "complete Markdown answer",
  "flashcards": []
}

The answer field must contain the full response. Do not truncate the answer or put the answer outside the JSON object. Create up to 3 useful flashcards only when appropriate; otherwise return an empty array.
`.trim()

const cacheDir = path.join(process.cwd(), "storage", "cache", "ask")
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })
const keyOf = (x: any) => crypto.createHash("sha256").update(typeof x === "string" ? x : JSON.stringify(x)).digest("hex")
const readCache = (k: any) => { const f = path.join(cacheDir, keyOf(k) + ".json"); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null }
const writeCache = (k: any, v: any) => { const f = path.join(cacheDir, keyOf(k) + ".json"); fs.writeFileSync(f, JSON.stringify(v)) }

type HistoryMessage = { role: string; content: any }

function toMessageContent(content: any): string {
  if (content == null) return ""
  if (typeof content === "string") return content
  if (typeof content === "object") {
    const cand = (content as any).answer ?? (content as any).content
    if (typeof cand === "string" && cand.trim()) return cand
    try { return JSON.stringify(content) } catch { return String(content) }
  }
  return String(content)
}

function serializeHistoryForCache(history?: HistoryMessage[]): string[] {
  if (!history || !history.length) return []
  return history
    .slice(-4)
    .filter((m) => m?.role === "user" || m?.role === "assistant")
    .map((m) => `${m.role}:${toMessageContent(m.content).slice(0, 120)}`)
}

function toConversationHistory(history?: HistoryMessage[]): Array<{ role: string; content: string }> {
  if (!history || !history.length) return []
  const recent = history.slice(-6)
  const out: Array<{ role: string; content: string }> = []
  for (const msg of recent) {
    if (!msg || (msg.role !== "user" && msg.role !== "assistant")) continue
    out.push({ role: msg.role, content: toMessageContent(msg.content) })
  }
  return out
}

type AskWithContextOptions = {
  question: string
  context: string
  topic?: string
  systemPrompt?: string
  history?: HistoryMessage[]
  cacheScope?: string
}

export async function askWithContext(opts: AskWithContextOptions): Promise<AskPayload> {
  const rawQuestion = typeof opts.question === "string" ? opts.question : String(opts.question ?? "")
  const safeQ = normalizeTopic(rawQuestion)
  const ctx = typeof opts.context === "string" && opts.context.trim() ? opts.context : "NO_CONTEXT"
  const topic = typeof opts.topic === "string" && opts.topic.trim()
    ? opts.topic.trim()
    : guessTopic(safeQ) || "General"
  const systemPrompt = opts.systemPrompt?.trim() || BASE_SYSTEM_PROMPT
  const historyArr = Array.isArray(opts.history) ? opts.history : undefined
  const historyCache = serializeHistoryForCache(historyArr)

  // Bump this version when response parsing changes so malformed cached answers are regenerated.
  const ck = { parserVersion: 2, t: opts.cacheScope || "ask_ctx", q: safeQ, ctx, topic, sys: systemPrompt, hist: historyCache }
  const cached = readCache(ck)
  if (cached) return cached

  const messages: any[] = [{ role: "system", content: systemPrompt }]
  for (const msg of toConversationHistory(historyArr)) messages.push(msg)

  messages.push({
    role: "user",
    content: `Context:\n${ctx}\n\nQuestion:\n${safeQ}\n\nTopic:\n${topic}\n\nReturn only the JSON object.`
  })

  const res = await llm.call(messages as any)
  const draft = toText(res).trim()
  const jsonStr = extractFirstJsonObject(draft) || draft
  const parsed = tryParse<any>(jsonStr)
  const looseParsed = parsed ? null : parseLooseModelPayload(draft)

  const out: AskPayload =
    parsed && typeof parsed === "object"
      ? {
        topic: typeof parsed.topic === "string" ? parsed.topic : topic,
        answer: typeof parsed.answer === "string" ? parsed.answer : "",
        flashcards: Array.isArray(parsed.flashcards) ? (parsed.flashcards as AskCard[]) : [],
      }
      : looseParsed
        ? {
          topic: looseParsed.topic || topic,
          answer: looseParsed.answer,
          flashcards: looseParsed.flashcards,
        }
        : { topic, answer: draft, flashcards: [] }

  writeCache(ck, out)
  return out
}

export async function handleAsk(
  q: string | { q: string; namespace?: string; history?: any[] },
  ns?: string,
  k = 6,
  historyArg?: any[]
): Promise<AskPayload> {
  if (typeof q === "object" && q !== null) {
    const params = q
    return handleAsk(params.q, params.namespace ?? ns, k, params.history ?? historyArg)
  }

  const questionRaw = typeof q === "string" ? q : String(q ?? "")
  const safeQ = normalizeTopic(questionRaw)
  const nsFinal = typeof ns === "string" && ns.trim() ? ns : "pagelm"

  // Skip embedding/vector search for ordinary chats with no uploaded study material.
  // This avoids an unnecessary embedding request before every basic question.
  let ctx = "NO_CONTEXT"
  const contextFile = path.join(process.cwd(), "storage", "json", `${nsFinal}.json`)
  let hasJsonContext = false

  if (fs.existsSync(contextFile)) {
    try {
      const storedDocs = JSON.parse(fs.readFileSync(contextFile, "utf8"))
      hasJsonContext = Array.isArray(storedDocs) && storedDocs.length > 0
    } catch {
      hasJsonContext = false
    }
  }

  if (hasJsonContext || config.db_mode !== "json") {
    const rag = await execDirect({
      agent: "researcher",
      plan: { steps: [{ tool: "rag.search", input: { q: safeQ, ns: nsFinal, k }, timeoutMs: 8000, retries: 1 }] },
      ctx: { ns: nsFinal }
    })

    const ctxDocs = Array.isArray(rag?.result) ? (rag.result as Array<{ text?: string }>) : []
    ctx = ctxDocs.map(d => d?.text || "").join("\n\n") || "NO_CONTEXT"
  }
  const topic = guessTopic(safeQ) || "General"

  return askWithContext({
    question: questionRaw,
    context: ctx,
    topic,
    history: historyArg,
    systemPrompt: BASE_SYSTEM_PROMPT,
    cacheScope: `ans:${nsFinal}`
  })
}
