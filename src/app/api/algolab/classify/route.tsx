import { NextResponse } from "next/server";
export const runtime = "nodejs"; // important: accès réseau + env

import { OpenAIConseillerClassifier } from "@/algorithms/level1/conseillerclassifiers/OpenAIConseillerClassifier";

export async function POST(req: Request) {
  try {
    const { verbatim, verbatims } = await req.json();

    const cls = new OpenAIConseillerClassifier({
      apiKey: process.env.OPENAI_API_KEY!, // clé uniquement côté serveur
      model: "gpt-4o-mini",
      temperature: 0, // déterministe
      maxTokens: 6, // on ne veut qu’un label
      timeout: 10_000,
      enableFallback: true,
    });

    if (Array.isArray(verbatims)) {
      const out = [];
      for (const v of verbatims) out.push(await cls.classify(String(v ?? "")));
      return NextResponse.json({ ok: true, results: out });
    }

    const result = await cls.classify(String(verbatim ?? ""));
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
