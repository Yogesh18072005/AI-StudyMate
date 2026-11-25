export type StoredDocumentRecord = {
  pageContent: string;
  metadata?: Record<string, unknown>;
};

/** Preserve other sources and replace old chunks when a source is re-indexed. */
export function mergeStoredDocuments(
  existing: StoredDocumentRecord[],
  incoming: StoredDocumentRecord[],
): StoredDocumentRecord[] {
  const replacedSources = new Set(
    incoming
      .map((doc) => doc.metadata?.source)
      .filter((source): source is string => typeof source === "string" && source.length > 0),
  );

  const retained = existing.filter((doc) => {
    const source = doc.metadata?.source;
    return typeof source !== "string" || !replacedSources.has(source);
  });

  return [...retained, ...incoming];
}
