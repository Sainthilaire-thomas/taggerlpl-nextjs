import { ReactNode } from "react";

interface TaggingLayoutProps {
  children: ReactNode;
}

export default function TaggingLayout({ children }: TaggingLayoutProps) {
  return <div className="tagging-layout">{children}</div>;
}
