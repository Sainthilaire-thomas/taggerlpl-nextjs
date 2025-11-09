// src/app/(protected)/phase2-annotation/layout.tsx
import { ReactNode } from "react";

interface Phase2LayoutProps {
  children: ReactNode;
}

export default function Phase2AnnotationLayout({ children }: Phase2LayoutProps) {
  return (
    <div>
      {children}
    </div>
  );
}