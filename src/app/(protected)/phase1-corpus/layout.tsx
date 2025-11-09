// src/app/(protected)/phase1-corpus/layout.tsx
import { ReactNode } from "react";

interface Phase1LayoutProps {
  children: ReactNode;
}

export default function Phase1CorpusLayout({ children }: Phase1LayoutProps) {
  return (
    <div>
      {/* TODO: Ajouter navigation Phase 1 si nécessaire */}
      {children}
    </div>
  );
}
