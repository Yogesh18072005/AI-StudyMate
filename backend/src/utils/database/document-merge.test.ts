import { describe, expect, it } from "vitest";
import { mergeStoredDocuments } from "./document-merge";

describe("mergeStoredDocuments", () => {
  it("preserves other uploaded sources when adding a document", () => {
    const result = mergeStoredDocuments(
      [{ pageContent: "biology", metadata: { source: "biology.pdf" } }],
      [{ pageContent: "chemistry", metadata: { source: "chemistry.pdf" } }],
    );
    expect(result.map((doc) => doc.pageContent)).toEqual(["biology", "chemistry"]);
  });

  it("replaces old chunks when the same source is uploaded again", () => {
    const result = mergeStoredDocuments(
      [
        { pageContent: "old chunk 1", metadata: { source: "biology.pdf" } },
        { pageContent: "old chunk 2", metadata: { source: "biology.pdf" } },
        { pageContent: "keep me", metadata: { source: "chemistry.pdf" } },
      ],
      [{ pageContent: "updated biology", metadata: { source: "biology.pdf" } }],
    );
    expect(result.map((doc) => doc.pageContent)).toEqual(["keep me", "updated biology"]);
  });

  it("retains legacy records without source metadata", () => {
    const result = mergeStoredDocuments(
      [{ pageContent: "legacy" }],
      [{ pageContent: "new", metadata: { source: "notes.pdf" } }],
    );
    expect(result.map((doc) => doc.pageContent)).toEqual(["legacy", "new"]);
  });
});
