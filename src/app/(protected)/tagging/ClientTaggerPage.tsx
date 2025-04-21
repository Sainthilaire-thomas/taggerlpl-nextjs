"use client";

import dynamic from "next/dynamic";

const TaggerLPL = dynamic(() => import("@/components/TaggerLPL"), {
  ssr: false,
});

export default function ClientTaggerPage() {
  return <TaggerLPL />;
}
