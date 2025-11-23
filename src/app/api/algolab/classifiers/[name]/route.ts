// app/api/algolab/classifiers/[name]/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

import { algorithmRegistry } from "@/features/phase3-analysis/level1-validation/algorithms/shared/AlgorithmRegistry";
import { initializeAlgorithms } from "@/features/phase3-analysis/level1-validation/algorithms/shared/initializeAlgorithms";

function ensureInitialized() {
  // initializeAlgorithms est idempotent (protégé par un flag)
  initializeAlgorithms();
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    ensureInitialized();

    const config = await request.json();
    const key = decodeURIComponent(params.name);
    const algo = algorithmRegistry.get<any, any>(key);

    if (!algo) {
      return NextResponse.json(
        { error: "Algorithme non trouvé" },
        { status: 404 }
      );
    }

    if (typeof (algo as any).updateConfig !== "function") {
      return NextResponse.json(
        { error: "Cet algorithme ne supporte pas la configuration dynamique" },
        { status: 400 }
      );
    }

    (algo as any).updateConfig(config);
    const isValid =
      typeof (algo as any).validateConfig === "function"
        ? !!(algo as any).validateConfig()
        : true;

    return NextResponse.json({
      success: true,
      isValid,
      message: isValid
        ? "Configuration mise à jour"
        : "Configuration mise à jour mais invalide",
      config:
        typeof (algo as any).getConfig === "function"
          ? (algo as any).getConfig()
          : undefined,
    });
  } catch (error) {
    console.error("Erreur mise à jour config:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    ensureInitialized();

    const key = decodeURIComponent(params.name);
    const algo = algorithmRegistry.get<any, any>(key);

    if (!algo) {
      return NextResponse.json(
        { error: "Algorithme non trouvé" },
        { status: 404 }
      );
    }

    if (typeof (algo as any).getConfig === "function") {
      return NextResponse.json({ config: (algo as any).getConfig() });
    }

    return NextResponse.json(
      { error: "Configuration non disponible" },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}
