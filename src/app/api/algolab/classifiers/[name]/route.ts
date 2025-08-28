import { NextRequest, NextResponse } from "next/server";
import { ClassifierRegistry } from "@/algorithms/level1/shared/ClassifierRegistry";

export async function PUT(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const config = await request.json();
    const classifier = ClassifierRegistry.getClassifier(params.name);

    if (!classifier) {
      return NextResponse.json(
        { error: "Classificateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérification que le classificateur supporte updateConfig
    if (typeof classifier.updateConfig !== "function") {
      return NextResponse.json(
        {
          error: "Ce classificateur ne supporte pas la configuration dynamique",
        },
        { status: 400 }
      );
    }

    // Mise à jour de la config
    classifier.updateConfig(config);

    // Validation de la nouvelle config
    const isValid = classifier.validateConfig();

    return NextResponse.json({
      success: true,
      isValid,
      message: isValid
        ? "Configuration mise à jour"
        : "Configuration mise à jour mais invalide",
    });
  } catch (error) {
    console.error("Erreur mise à jour config:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// Optionnel : GET pour récupérer la config actuelle
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const classifier = ClassifierRegistry.getClassifier(params.name);

    if (!classifier) {
      return NextResponse.json(
        { error: "Classificateur non trouvé" },
        { status: 404 }
      );
    }

    // Si le classificateur a une méthode getConfig
    if (typeof classifier.getConfig === "function") {
      const config = classifier.getConfig();
      return NextResponse.json({ config });
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
