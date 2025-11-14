// hooks/useAlgorithmVersioning.ts
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { 
  AlgorithmVersionId, 
  AlgorithmVersionMetadata 
} from "@/types/algorithm-lab";

export const useAlgorithmVersioning = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setActiveVersion = async (versionId: AlgorithmVersionId) => {
    setLoading(true);
    setError(null);

    try {
      await supabase
        .from('algorithm_version_registry')
        .update({ is_active: false })
        .neq('version_id', '__placeholder__');

      const { error: updateError } = await supabase
        .from('algorithm_version_registry')
        .update({ is_active: true })
        .eq('version_id', versionId);

      if (updateError) throw updateError;

      console.log(`✅ Version ${versionId} activée`);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadVersion = async (
    versionId: AlgorithmVersionId
  ): Promise<AlgorithmVersionMetadata> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('algorithm_version_registry')
        .select('*')
        .eq('version_id', versionId)
        .single();

      if (fetchError) throw fetchError;

      return data as AlgorithmVersionMetadata;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Fonction pour mettre à jour les métadonnées d'une version
  const updateVersionMetadata = async (
    versionId: AlgorithmVersionId,
    updates: Partial<Pick<AlgorithmVersionMetadata, 'version_name' | 'description' | 'changelog'>>
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('algorithm_version_registry')
        .update(updates)
        .eq('version_id', versionId);

      if (updateError) throw updateError;

      console.log(`✅ Métadonnées mises à jour pour ${versionId}`);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    setActiveVersion,
    loadVersion,
    updateVersionMetadata, // 🆕 Export
    loading,
    error,
  };
};
