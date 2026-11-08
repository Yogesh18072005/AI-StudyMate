import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CompanionContext, type CompanionDocument, type CompanionContextValue } from "./CompanionContext";

export type { CompanionDocument } from "./CompanionContext";

export function CompanionProvider({ children }: { children: ReactNode }) {
  const [document, setDocumentState] = useState<CompanionDocument | null>(null);
  const [open, setOpen] = useState(false);

  const setDocument = useCallback((doc: CompanionDocument | null) => {
    setDocumentState((prev) => {
      if (doc) {
        const changed =
          !prev ||
          prev.id !== doc.id ||
          prev.text !== doc.text ||
          prev.title !== doc.title ||
          prev.filePath !== doc.filePath;
        if (changed) setOpen(true);
      } else {
        setOpen(false);
      }
      return doc;
    });
  }, []);

  const value = useMemo<CompanionContextValue>(
    () => ({ document, setDocument, open, setOpen }),
    [document, open, setDocument]
  );

  return <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>;
}
