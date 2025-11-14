import { NextResponse } from "next/server";
export const runtime = "nodejs";

import {
  getAlgorithmStatus,
  initializeAlgorithms,
} from "@/features/phase3-analysis/level1-validation/algorithms/shared/initializeAlgorithms";
import { algorithmRegistry } from "@/features/phase3-analysis/level1-validation/algorithms/shared/AlgorithmRegistry";

function ensureInitialized() {
  initializeAlgorithms();
}

export async function GET() {
  ensureInitialized();
  return NextResponse.json(getAlgorithmStatus());
}

export async function POST(req: Request) {
  try {
    ensureInitialized();

    const body = await req.json();
    const { key } = body;

    const algo = algorithmRegistry.get<any, any>(key);
    if (!algo) {
      return NextResponse.json(
        { ok: false, error: `Algorithme inconnu: ${key}` },
        { status: 400 }
      );
    }

    // 🔧 Normalisation du payload (string, objet contextuel, ou tableau)
    let inputs: unknown[];

    if (Array.isArray(body.inputs)) {
      inputs = body.inputs; // nouveau: inputs[]
    } else if (Array.isArray(body.input)) {
      inputs = body.input; // tolérance
    } else if (Array.isArray(body.verbatims)) {
      inputs = body.verbatims.map(String); // legacy: verbatims[]
    } else {
      const single =
        body.input !== undefined
          ? body.input // nouveau: input
          : body.verbatim !== undefined
          ? body.verbatim // legacy: verbatim
          : "";
      inputs = [single];
    }

    const hasBatchRun =
      typeof (algo as any).batchRun === "function" ||
      typeof (algo as any).runBatch === "function"; // compat

    const batchFn = (algo as any).batchRun ?? (algo as any).runBatch;

    const results = hasBatchRun
      ? await batchFn.call(algo, inputs)
      : await Promise.all(inputs.map((v) => (algo as any).run(v)));

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
