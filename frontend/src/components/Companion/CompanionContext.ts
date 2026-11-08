import { createContext } from "react";

export type CompanionDocument = {
  id: string;
  title?: string;
  filePath?: string;
  text?: string;
};

export type CompanionContextValue = {
  document: CompanionDocument | null;
  setDocument: (doc: CompanionDocument | null) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const CompanionContext = createContext<CompanionContextValue | undefined>(undefined);
