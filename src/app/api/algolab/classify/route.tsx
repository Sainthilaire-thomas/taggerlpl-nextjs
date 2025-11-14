// app/api/algolab/classify/route.ts (proxy facultatif)
import { NextResponse } from "next/server";
export const runtime = "nodejs";

import { algorithmRegistry } from "@/features/phase3-analysis/level1-validation/algorithms/shared/AlgorithmRegistry";

export async function POST(req: Request) {
  try {
    const { key = "OpenAIXClassifier", verbatim, verbatims } = await req.json();
    const algo = algorithmRegistry.get<string, any>(key);
    if (!algo) {
      return NextResponse.json(
        { ok: false, error: `Algorithme inconnu: ${key}` },
        { status: 400 }
      );
    }

    const inputs = Array.isArray(verbatims)
      ? verbatims.map(String)
      : [String(verbatim ?? "")];
    const doBatch = typeof (algo as any).runBatch === "function";
    const results = doBatch
      ? await (algo as any).runBatch(inputs)
      : await Promise.all(inputs.map((v) => (algo as any).run(v)));

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
