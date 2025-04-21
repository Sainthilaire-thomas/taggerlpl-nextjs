import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fileId = url.searchParams.get("fileId");
  const token = request.headers.get("Authorization")?.split(" ")[1];

  if (!fileId || !token) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    // Appel à l'API Zoho
    const response = await fetch(
      `https://workdrive.zoho.com/api/v1/files/${fileId}/download`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Vérifier que la réponse est ok
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Récupérer le type de contenu et les données
    const contentType = response.headers.get("content-type");
    const data = await response.arrayBuffer();

    // Créer une nouvelle réponse avec les mêmes données et headers
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
