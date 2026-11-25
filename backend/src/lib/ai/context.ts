export type RetrievedContextDocument = {
  text?: string;
  meta?: Record<string, unknown>;
};

function sourceName(meta?: Record<string, unknown>): string {
  const candidate = meta?.source ?? meta?.filename ?? meta?.file_name;
  if (typeof candidate !== "string" || !candidate.trim()) return "Uploaded study material";
  return candidate.trim().replace(/[\\r\\n\\[\\]]/g, " ").slice(0, 160);
}

/** Format retrieved passages with stable, prompt-visible source IDs. */
export function buildGroundedContext(docs: RetrievedContextDocument[]): string {
  const usable = docs
    .filter((doc) => typeof doc?.text === "string" && doc.text.trim())
    .slice(0, 20);

  if (!usable.length) return "NO_CONTEXT";

  return usable
    .map((doc, index) => {
      const id = `S${index + 1}`;
      return `[Source ${id}: ${sourceName(doc.meta)}]\\n${doc.text!.trim()}`;
    })
    .join("\\n\\n");
}
