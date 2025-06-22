import { supabase } from "@/lib/supabaseClient";

export async function updateCallOrigine(callid: string, origine: string) {
  try {
    console.log(
      "🔄 Mise à jour origine pour callid:",
      callid,
      "nouvelle origine:",
      origine
    );

    const { data, error } = await supabase
      .from("call")
      .update({ origine })
      .eq("callid", callid)
      .select();

    if (error) {
      throw new Error(`Erreur Supabase: ${error.message}`);
    }

    console.log("✅ Origine mise à jour avec succès:", data);
    return data;
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de l'origine:", error);
    throw error;
  }
}
