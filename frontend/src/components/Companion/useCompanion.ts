import { useContext } from "react";
import { CompanionContext } from "./CompanionContext";

export function useCompanion() {
  const ctx = useContext(CompanionContext);
  if (!ctx) throw new Error("useCompanion must be used within a CompanionProvider");
  return ctx;
}
