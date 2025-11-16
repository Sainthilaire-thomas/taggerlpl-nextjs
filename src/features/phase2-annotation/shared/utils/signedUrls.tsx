import supabase from "@/lib/supabaseClient";

/**
 * GÃ©nÃ¨re une URL signÃ©e pour un fichier dans le bucket de stockage Supabase
 * @param filePath - Chemin du fichier dans le bucket
 * @param expiration - DurÃ©e de validitÃ© de l'URL en secondes (par dÃ©faut: 1200s = 20min)
 * @returns Promise<string> - URL signÃ©e pour accÃ©der au fichier
 * @throws Error si la gÃ©nÃ©ration Ã©choue
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
      console.error("Erreur lors de la gÃ©nÃ©ration de l'URL signÃ©e :", error);
      throw new Error(error.message);
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Erreur lors de la gÃ©nÃ©ration de l'URL signÃ©e :", error);
    throw error;
  }
};

