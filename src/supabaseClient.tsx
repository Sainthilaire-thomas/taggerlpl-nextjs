"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

// Vérification des variables d'environnement
// Pour Next.js, nous utilisons process.env au lieu de import.meta.env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Certains paramètres nécessaires à l'application ne sont pas définis dans le fichier .env."
  );
  throw new Error("Configuration manquante. Vérifiez votre fichier .env.");
}

// Création du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interface pour le retour du hook personnalisé
interface UseSupabaseWithAuthReturn {
  supabase: SupabaseClient;
  isConfigured: boolean;
}

// Hook personnalisé pour configurer les headers avec le token JWT
export const useSupabaseWithAuth = (): UseSupabaseWithAuthReturn => {
  const { getAccessTokenSilently } = useAuth0();
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  useEffect(() => {
    const configureSupabase = async () => {
      try {
        const token = await getAccessTokenSilently();

        // Ajout du token dans les headers globaux
        // Note: Cette approche est adaptée pour TypeScript
        (supabase as any).auth = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        setIsConfigured(true);
      } catch (error) {
        console.error("Erreur lors de la récupération du token JWT :", error);
      }
    };

    configureSupabase();
  }, [getAccessTokenSilently]);

  return { supabase, isConfigured };
};

// Fonction utilitaire pour décoder un JWT sans vérification
export function decodeJWT(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Erreur lors du décodage du JWT :", error);
    return null;
  }
}
