// app/api/zoho/download/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const fileId = url.searchParams.get("fileId");
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    console.log("Requête de téléchargement reçue pour fichier:", fileId);

    if (!fileId) {
      console.error("Erreur: ID de fichier manquant");
      return NextResponse.json(
        { error: "Missing fileId parameter" },
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

    console.log("Téléchargement du fichier Zoho avec ID:", fileId);

    // URL pour l'API de téléchargement Zoho
    const zohoDownloadUrl = `https://workdrive.zoho.com/api/v1/download/${fileId}`;
    console.log("URL de téléchargement Zoho:", zohoDownloadUrl);

    // Appel à l'API Zoho
    const response = await fetch(zohoDownloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur API Zoho (${response.status}):`, errorText);
      return NextResponse.json(
        { error: "Failed to download file from Zoho", details: errorText },
        { status: response.status }
      );
    }

    // Récupérer les en-têtes de la réponse
    const contentType =
      response.headers.get("Content-Type") || "application/octet-stream";
    const contentDisposition =
      response.headers.get("Content-Disposition") || "";

    console.log("Type de contenu:", contentType);

    // Récupérer le contenu du fichier
    const fileData = await response.arrayBuffer();

    // Préparer la réponse
    const nextResponse = new NextResponse(fileData);

    // Ajouter les en-têtes appropriés
    nextResponse.headers.set("Content-Type", contentType);
    if (contentDisposition) {
      nextResponse.headers.set("Content-Disposition", contentDisposition);
    }

    console.log(
      "Fichier téléchargé avec succès, taille:",
      fileData.byteLength,
      "octets"
    );

    return nextResponse;
  } catch (error) {
    console.error(
      "Erreur inattendue lors du téléchargement du fichier:",
      error
    );

    return NextResponse.json(
      {
        error: "Internal server error while downloading file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
