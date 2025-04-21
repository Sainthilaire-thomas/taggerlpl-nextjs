import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const folderId = url.searchParams.get("folderId");
    const token = request.headers.get("Authorization")?.split(" ")[1];

    if (!folderId || !token) {
      console.error("Paramètres manquants:", {
        hasFolderId: !!folderId,
        hasToken: !!token,
      });
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    console.log("Récupération des fichiers pour le dossier:", folderId);

    // Appel à l'API Zoho
    const response = await fetch(
      `https://workdrive.zoho.com/api/v1/files/${folderId}/files`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur API Zoho (${response.status}):`, errorText);
      return NextResponse.json(
        { error: "Failed to fetch files", details: errorText },
        { status: response.status }
      );
    }

    // Traiter la réponse
    const data = await response.json();
    console.log("Nombre de fichiers récupérés:", data.data?.length || 0);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error);
    return NextResponse.json(
      { error: "Failed to fetch files", details: String(error) },
      { status: 500 }
    );
  }
}
