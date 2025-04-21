// app/api/zoho/files/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const folderId = url.searchParams.get("folderId");
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    console.log("Requête reçue pour GET /api/zoho/files avec:", {
      folderId,
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
    });

    if (!folderId) {
      console.error("Erreur: ID de dossier manquant ou invalide", {
        reçu: folderId,
      });
      return NextResponse.json(
        { error: "Missing or invalid folderId parameter" },
        { status: 400 }
      );
    }

    if (!token) {
      console.error("Erreur: Token d'autorisation manquant");
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 }
      );
    }

    console.log(`Appel de l'API Zoho pour le dossier: ${folderId}`);
    const apiUrl = `https://workdrive.zoho.com/api/v1/files/${folderId}/files`;

    console.log(`URL de l'API Zoho: ${apiUrl}`);

    // Appel à l'API Zoho
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Logguer les détails de la réponse
    console.log(`Réponse de l'API Zoho: Status ${response.status}`);

    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur API Zoho (${response.status}):`, errorText);

      // Construire une réponse d'erreur détaillée
      return NextResponse.json(
        {
          error: "Failed to fetch files from Zoho",
          details: errorText,
          status: response.status,
          url: apiUrl,
        },
        { status: response.status }
      );
    }

    // Traiter la réponse
    const data = await response.json();
    console.log("Nombre de fichiers récupérés:", data.data?.length || 0);

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Erreur inattendue lors de la récupération des fichiers:",
      error
    );

    return NextResponse.json(
      {
        error: "Internal server error while fetching files",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
