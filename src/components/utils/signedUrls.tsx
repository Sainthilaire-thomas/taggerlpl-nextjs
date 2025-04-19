import { supabase } from "@/supabaseClient";

/**
 * Génère une URL signée pour un fichier dans le bucket de stockage Supabase
 * @param filePath - Chemin du fichier dans le bucket
 * @param expiration - Durée de validité de l'URL en secondes (par défaut: 1200s = 20min)
 * @returns Promise<string> - URL signée pour accéder au fichier
 * @throws Error si la génération échoue
 */
export const generateSignedUrl = async (
  filePath: string,
  expiration: number = 1200
): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from("Calls")
      .createSignedUrl(filePath, expiration);

    if (error) {
      console.error("Erreur lors de la génération de l'URL signée :", error);
      throw new Error(error.message);
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL signée :", error);
    throw error;
  }
};
