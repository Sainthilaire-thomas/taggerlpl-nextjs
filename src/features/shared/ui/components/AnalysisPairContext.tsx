"use client";
import React, { useState, useEffect } from "react";
import { Box, IconButton, Tooltip, Collapse, alpha, useTheme, CircularProgress, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { ToneLine } from "@/features/shared/ui/components";
import { supabase } from "@/lib/supabaseClient";

// ============================================================================
// TYPES
// ============================================================================

export interface AnalysisPairContextProps {
  /** Option 1 : passer un pairId, le composant fetch tout seul */
  pairId?: number | null;
  
  /** Option 2 : passer les données directement (si déjà disponibles) */
  prev3?: string | null;
  prev2?: string | null;
  prev1?: string | null;
  conseiller?: string | null;  // Tour X
  client?: string | null;      // Tour Y
  next1?: string | null;
  next2?: string | null;
  next3?: string | null;
}

interface ContextData {
  prev3: string | null;
  prev2: string | null;
  prev1: string | null;
  conseiller: string | null;
  client: string | null;
  next1: string | null;
  next2: string | null;
  next3: string | null;
}

/** Type explicite pour le résultat Supabase */
interface AnalysisPairRow {
  pair_id: number;
  conseiller_verbatim: string | null;
  client_verbatim: string | null;
  prev1_verbatim: string | null;
  prev2_verbatim: string | null;
  prev3_verbatim: string | null;
  next1_verbatim: string | null;
  next2_verbatim: string | null;
  next3_verbatim: string | null;
}

// ============================================================================
// HOOK INTERNE : Fetch depuis analysis_pairs
// ============================================================================

const CONTEXT_FIELDS = [
  'pair_id',
  'conseiller_verbatim',
  'client_verbatim',
  'prev1_verbatim',
  'prev2_verbatim',
  'prev3_verbatim',
  'next1_verbatim',
  'next2_verbatim',
  'next3_verbatim',
].join(',');

function useAnalysisPairContext(pairId: number | null | undefined): {
  data: ContextData | null;
  isLoading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<ContextData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pairId) {
      setData(null);
      setError(null);
      return;
    }

    const fetchContext = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: row, error: fetchError } = await supabase
          .from('analysis_pairs')
          .select(CONTEXT_FIELDS)
          .eq('pair_id', pairId)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        // Double cast pour éviter GenericStringError de Supabase
        const typedRow = row as unknown as AnalysisPairRow | null;

        if (typedRow) {
          setData({
            prev3: typedRow.prev3_verbatim ?? null,
            prev2: typedRow.prev2_verbatim ?? null,
            prev1: typedRow.prev1_verbatim ?? null,
            conseiller: typedRow.conseiller_verbatim ?? null,
            client: typedRow.client_verbatim ?? null,
            next1: typedRow.next1_verbatim ?? null,
            next2: typedRow.next2_verbatim ?? null,
            next3: typedRow.next3_verbatim ?? null,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(message);
        console.error(`[AnalysisPairContext] Erreur pairId=${pairId}:`, message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContext();
  }, [pairId]);

  return { data, isLoading, error };
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

/**
 * Affiche le contexte d'une paire analysis_pairs.
 * 
 * Deux modes d'utilisation :
 * 
 * 1. **Mode autonome (recommandé)** : passer `pairId`, le composant fetch les données
 *    ```tsx
 *    <AnalysisPairContext pairId={123} />
 *    ```
 * 
 * 2. **Mode props directes** : passer les verbatims si déjà disponibles
 *    ```tsx
 *    <AnalysisPairContext conseiller="Bonjour" client="Oui merci" />
 *    ```
 * 
 * Affichage :
 * - Toujours : prev1 → X (conseiller) → Y (client) → next1
 * - Extensible via toggle : prev3, prev2, next2, next3
 */
const AnalysisPairContext: React.FC<AnalysisPairContextProps> = (props) => {
  const {
    pairId,
    prev3: propPrev3,
    prev2: propPrev2,
    prev1: propPrev1,
    conseiller: propConseiller,
    client: propClient,
    next1: propNext1,
    next2: propNext2,
    next3: propNext3,
  } = props;

  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  // Mode autonome : fetch si pairId fourni et pas de données directes
  const hasDirectData = propConseiller !== undefined || propClient !== undefined;
  const shouldFetch = pairId != null && !hasDirectData;
  
  const { data: fetchedData, isLoading, error } = useAnalysisPairContext(
    shouldFetch ? pairId : null
  );

  // Résoudre les données : props directes prioritaires, sinon fetched
  const prev3 = propPrev3 ?? fetchedData?.prev3 ?? null;
  const prev2 = propPrev2 ?? fetchedData?.prev2 ?? null;
  const prev1 = propPrev1 ?? fetchedData?.prev1 ?? null;
  const conseiller = propConseiller ?? fetchedData?.conseiller ?? null;
  const client = propClient ?? fetchedData?.client ?? null;
  const next1 = propNext1 ?? fetchedData?.next1 ?? null;
  const next2 = propNext2 ?? fetchedData?.next2 ?? null;
  const next3 = propNext3 ?? fetchedData?.next3 ?? null;

  const hasExtended = prev2 || prev3 || next2 || next3;

  // Couleurs distinctes pour conseiller (X) et client (Y)
  const conseillerBg = alpha(
    theme.palette.info.main,
    theme.palette.mode === "dark" ? 0.18 : 0.1
  );
  const clientBg = alpha(
    theme.palette.warning.main,
    theme.palette.mode === "dark" ? 0.18 : 0.1
  );

  // État de chargement
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="caption" color="text.secondary">
          Chargement contexte...
        </Typography>
      </Box>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <Box sx={{ py: 0.5 }}>
        <Typography variant="caption" color="error">
          Erreur: {error}
        </Typography>
      </Box>
    );
  }

  // Pas de données
  if (!conseiller && !client && !prev1 && !next1) {
    return (
      <Box sx={{ py: 0.5 }}>
        <Typography variant="caption" color="text.disabled">
          Contexte non disponible
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 0.5, position: "relative" }}>
      {/* Bouton expand */}
      {hasExtended && (
        <Box sx={{ position: "absolute", right: -4, top: -4, zIndex: 1 }}>
          <Tooltip title={expanded ? "Réduire" : "Plus de contexte"}>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                width: 20,
                height: 20,
              }}
            >
              {expanded ? (
                <ExpandLessIcon sx={{ fontSize: 14 }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 14 }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Contexte étendu AVANT */}
      <Collapse in={expanded} timeout="auto">
        <Box sx={{ display: "grid", gap: 0.5, mb: 0.5 }}>
          {prev3 && <ToneLine text={prev3} prefix="-3" tone="A" italic tooltip={prev3} />}
          {prev2 && <ToneLine text={prev2} prefix="-2" tone="A" italic tooltip={prev2} />}
        </Box>
      </Collapse>

      {/* Contexte principal */}
      {prev1 && <ToneLine text={prev1} prefix="-1" tone="B" tooltip={prev1} />}

      {/* Tour conseiller (X) avec fond bleu */}
      {conseiller && (
        <Box sx={{ bgcolor: conseillerBg, borderRadius: 1, mx: -0.5, px: 0.5, py: 0.25 }}>
          <ToneLine
            text={conseiller}
            prefix="X"
            tone="CURRENT"
            strong
            lines={2}
            tooltip={conseiller}
          />
        </Box>
      )}

      {/* Tour client (Y) avec fond orange */}
      {client && (
        <Box sx={{ bgcolor: clientBg, borderRadius: 1, mx: -0.5, px: 0.5, py: 0.25 }}>
          <ToneLine
            text={client}
            prefix="Y"
            tone="CURRENT"
            strong
            lines={2}
            tooltip={client}
          />
        </Box>
      )}

      {next1 && <ToneLine text={next1} prefix="+1" tone="B" italic tooltip={next1} />}

      {/* Contexte étendu APRÈS */}
      <Collapse in={expanded} timeout="auto">
        <Box sx={{ display: "grid", gap: 0.5, mt: 0.5 }}>
          {next2 && <ToneLine text={next2} prefix="+2" tone="A" italic tooltip={next2} />}
          {next3 && <ToneLine text={next3} prefix="+3" tone="A" italic tooltip={next3} />}
        </Box>
      </Collapse>
    </Box>
  );
};

export default AnalysisPairContext;
