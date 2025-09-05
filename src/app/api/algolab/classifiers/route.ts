// app/api/algolab/classifiers/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

import { getAlgorithmStatus } from "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/initializeAlgorithms";
import { algorithmRegistry } from "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/AlgorithmRegistry";

export async function GET() {
  // statut **serveur** (avec OPENAI_API_KEY, etc.)
  return NextResponse.json(getAlgorithmStatus());
}

export async function POST(req: Request) {
  try {
    const { key, verbatim, verbatims } = await req.json();
    const inputs: string[] = Array.isArray(verbatims)
      ? verbatims.map(String)
      : [String(verbatim ?? "")];

    // On s'assure que le registre serveur est prêt (il l’est via auto-init)
    const algo = algorithmRegistry.get<string, any>(key);
    if (!algo) {
      return NextResponse.json(
        { ok: false, error: `Algorithme inconnu: ${key}` },
        { status: 400 }
      );
    }

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
