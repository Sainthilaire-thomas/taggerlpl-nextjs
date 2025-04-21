import { NextResponse } from "next/server";

// Configuration OAuth pour Zoho
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID as string;
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI as string;
// L'URL de callback doit être configurée dans votre compte Zoho développeur

export async function GET(request: Request) {
  try {
    // Vérifier que les variables d'environnement sont définies
    if (!ZOHO_CLIENT_ID || !ZOHO_REDIRECT_URI) {
      return NextResponse.json(
        { error: "Configuration OAuth Zoho incomplète" },
        { status: 500 }
      );
    }

    // Récupérer l'URL de redirection après l'authentification si fournie
    const url = new URL(request.url);
    const redirectAfterAuth = url.searchParams.get("redirect") || "/calls";

    // Stocker l'URL de redirection dans un cookie pour la récupérer après callback
    const cookieOptions = {
      maxAge: 60 * 10, // 10 minutes
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
    };

    // Générer l'URL d'authentification Zoho
    // https://accounts.zoho.com/oauth/v2/auth
    const zohoAuthUrl = new URL("https://accounts.zoho.com/oauth/v2/auth");
    zohoAuthUrl.searchParams.append("client_id", ZOHO_CLIENT_ID);
    zohoAuthUrl.searchParams.append("response_type", "code");
    zohoAuthUrl.searchParams.append("redirect_uri", ZOHO_REDIRECT_URI);
    zohoAuthUrl.searchParams.append(
      "scope",
      "WorkDrive.files.READ,WorkDrive.workspace.READ"
    );
    zohoAuthUrl.searchParams.append("access_type", "offline");
    zohoAuthUrl.searchParams.append("prompt", "consent");

    // Rediriger vers l'URL d'authentification Zoho
    const response = NextResponse.redirect(zohoAuthUrl);

    // Ajouter le cookie de redirection
    response.cookies.set(
      "zoho_redirect_after_auth",
      redirectAfterAuth,
      cookieOptions
    );

    return response;
  } catch (error) {
    console.error(
      "Erreur lors de la redirection vers l'authentification Zoho:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la redirection vers l'authentification Zoho" },
      { status: 500 }
    );
  }
}
