import { NextResponse } from "next/server";

// Configuration OAuth pour Zoho
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI;

export async function GET(request: Request) {
  try {
    // Vérifier que les variables d'environnement sont définies
    if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REDIRECT_URI) {
      console.error("Configuration OAuth Zoho incomplète", {
        hasClientId: !!ZOHO_CLIENT_ID,
        hasClientSecret: !!ZOHO_CLIENT_SECRET,
        hasRedirectUri: !!ZOHO_REDIRECT_URI,
      });
      return NextResponse.json(
        { error: "Configuration OAuth Zoho incomplète" },
        { status: 500 }
      );
    }

    // Récupérer le code d'autorisation de l'URL
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Code d'autorisation manquant" },
        { status: 400 }
      );
    }

    console.log("Code reçu:", code);

    // Échanger le code contre un token d'accès
    const tokenResponse = await fetch(
      "https://accounts.zoho.com/oauth/v2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: ZOHO_CLIENT_ID,
          client_secret: ZOHO_CLIENT_SECRET,
          redirect_uri: ZOHO_REDIRECT_URI,
          code: code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Échec de l'échange du code:", errorText);
      return NextResponse.json(
        { error: "Échec de l'échange du code", details: errorText },
        { status: tokenResponse.status }
      );
    }

    // Traiter la réponse du token
    const tokenData = await tokenResponse.json();
    console.log("Token data:", tokenData);

    // Calculer la date d'expiration (timestamp en secondes)
    const expiresAt = Date.now() + tokenData.expires_in * 1000;

    // Préparer les données du token pour être transmises au front-end
    const tokenInfo = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      expires_at: expiresAt,
      token_type: tokenData.token_type,
    };

    // Récupérer l'URL de redirection du cookie
    const cookies = request.headers.get("cookie") || "";
    const redirectCookieMatch = cookies.match(
      /zoho_redirect_after_auth=([^;]+)/
    );
    const redirectUrl = redirectCookieMatch
      ? decodeURIComponent(redirectCookieMatch[1])
      : "/calls";

    // Créer l'URL de redirection avec le token
    const redirectWithToken = new URL(redirectUrl, new URL(request.url).origin);
    redirectWithToken.searchParams.append("token", JSON.stringify(tokenInfo));

    // Créer la réponse de redirection
    const response = NextResponse.redirect(redirectWithToken.toString());

    // Supprimer le cookie de redirection
    response.cookies.delete("zoho_redirect_after_auth");

    // Dans callback/route.ts
    console.log("URL complète:", request.url);
    console.log("Headers:", request.headers);
    console.log("Cookies:", request.headers.get("cookie"));

    return response;
  } catch (error) {
    console.error("Erreur lors de la gestion du callback:", error);
    return NextResponse.json(
      { error: "Erreur lors de la gestion du callback" },
      { status: 500 }
    );
  }
}
