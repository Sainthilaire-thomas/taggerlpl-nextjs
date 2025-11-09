import { useCallback } from "react";
// ⬇️ change le chemin si besoin
import supabaseClient from "@/lib/supabaseClient";

/**
 * Service de stockage (ex: Supabase Storage)
 * - generateSignedUrl: retourne une URL signée pour lecture audio
 */
export function useStorageService() {
  // Lis le bucket depuis l'env, sinon "calls"
  const BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_CALLS_BUCKET?.trim() || "calls";

  const generateSignedUrl = useCallback(
    async (path: string, expiresInSeconds = 3600) => {
      if (!path) throw new Error("Path manquant pour generateSignedUrl");

      // path peut être soit le "path" relatif interne du bucket,
      // soit "folder/file.mp3" si tu stockes comme ça
      const { data, error } = await supabaseClient.storage
        .from(BUCKET)
        .createSignedUrl(path, expiresInSeconds);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error("Échec de génération d'URL signée");
      return data.signedUrl as string;
    },
    []
  );

  return { generateSignedUrl };
}

export type UseStorageService = ReturnType<typeof useStorageService>;
