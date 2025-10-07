// ✅ ÉTAPE 1 : Charger les variables d'environnement EN PREMIER
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔍 Vérification des variables d\'environnement...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Défini' : '❌ Manquant');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Défini' : '❌ Manquant');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

import { createClient } from '@supabase/supabase-js';
import { algorithmRegistry } from '@/algorithms/level1/shared/AlgorithmRegistry';

// ✅ IMPORTS CORRECTS (named exports, pas default)
import { M1ActionVerbCounter } from '@/algorithms/level1/M1Algorithms/M1ActionVerbCounter';
import M2CompositeAlignmentCalculator from '@/algorithms/level1/M2Algorithms/M2CompositeAlignmentCalculator';
import { PausesM3Calculator } from '@/algorithms/level1/M3Algorithms/PausesM3Calculator';

// Enregistrer les algorithmes dans le registre
console.log('📝 Enregistrement des algorithmes...');

const m1Algo = new M1ActionVerbCounter();
const m2Algo = new M2CompositeAlignmentCalculator();
const m3Algo = new PausesM3Calculator();

algorithmRegistry.register('M1ActionVerbCounter', m1Algo);
algorithmRegistry.register('M2CompositeAlignment', m2Algo);
algorithmRegistry.register('PausesM3Calculator', m3Algo);

console.log('✅ Algorithmes enregistrés:', algorithmRegistry.list().map(a => a.key));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

interface H2Pair {
  pair_id: number;
  conseiller_turn_id: number;
  conseiller_verbatim: string;
  client_verbatim: string;
  strategy_tag: string;
  computation_status: string | null;
}

async function precomputeH2Results() {
  console.log('🚀 Démarrage du pré-calcul H2');

  // 1. Charger les paires non calculées
  const { data: pairs, error } = await supabase
    .from('h2_analysis_pairs')
    .select(`
      pair_id,
      conseiller_turn_id,
      conseiller_verbatim,
      client_verbatim,
      strategy_tag,
      computation_status
    `)
    .or('computation_status.is.null,computation_status.eq.PENDING,computation_status.eq.ERROR')
    .order('pair_id')
    .limit(10); // ✅ LIMITER À 10 POUR TESTER

  if (error) {
    console.error('❌ Erreur chargement paires:', error);
    return;
  }

  console.log(`📊 ${pairs.length} paires à calculer`);

  // 2. Récupérer les algorithmes depuis le registre
  const m1Algorithm = algorithmRegistry.get('M1ActionVerbCounter');
  const m2Algorithm = algorithmRegistry.get('M2CompositeAlignment');
  const m3Algorithm = algorithmRegistry.get('PausesM3Calculator');

  if (!m1Algorithm || !m2Algorithm || !m3Algorithm) {
    console.error('❌ Algorithmes manquants dans le registre');
    console.error('Disponibles:', algorithmRegistry.list().map(a => a.key));
    return;
  }

  console.log('✅ Algorithmes chargés avec succès');

  // 3. Traiter les paires
  let processed = 0;
  let errors = 0;

  const updates = await Promise.all(
    pairs.map(async (pair) => {
      try {
        console.log(`  ⏳ Traitement pair_id ${pair.pair_id}...`);
        
        // M1: Densité verbes d'action (typage explicite)
        const m1Result = await m1Algorithm.run(pair.conseiller_verbatim) as any;
        console.log(`    M1 ✓`);
      
        // M2: Alignement linguistique (typage explicite)
        const m2Result = await m2Algorithm.run({
          t0: pair.conseiller_verbatim,
          t1: pair.client_verbatim
        }) as any;
        console.log(`    M2 ✓`);
      
        // M3: Charge cognitive (typage explicite)
        const m3Result = await m3Algorithm.run(pair.client_verbatim) as any;
        console.log(`    M3 ✓`);
      
        // Détection clarifications
        const clarificationPattern = /(comment|quoi|pardon|c'est-à-dire|je ne comprends)/gi;
        const clarificationCount = (pair.client_verbatim.match(clarificationPattern) || []).length;
      
        // Charge cognitive
        const hesitationCount = m3Result?.metadata?.details?.hesitationCount || 0;
        let cognitiveLoad: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      
        if (hesitationCount > 2 || clarificationCount > 0) {
          cognitiveLoad = 'HIGH';
        } else if (hesitationCount > 0) {
          cognitiveLoad = 'MEDIUM';
        }

        processed++;
      
        return {
          pair_id: pair.pair_id,
          // M1
          m1_verb_density: m1Result?.metadata?.details?.density || 0,
          m1_verb_count: m1Result?.metadata?.details?.actionVerbCount || 0,
          m1_total_words: m1Result?.metadata?.details?.totalTokens || 0,
          m1_action_verbs: m1Result?.metadata?.details?.verbsFound || [],
          // M2
          m2_lexical_alignment: m2Result?.metadata?.details?.lexicalAlignment || 0,
          m2_semantic_alignment: m2Result?.metadata?.details?.semanticAlignment || 0,
          m2_global_alignment: m2Result?.metadata?.details?.overall || 0,
          m2_shared_terms: m2Result?.metadata?.details?.sharedTerms || [],
          // M3
          m3_hesitation_count: hesitationCount,
          m3_clarification_count: clarificationCount,
          m3_cognitive_score: m3Result?.metadata?.details?.value || 0,
          m3_cognitive_load: cognitiveLoad,
          m3_patterns: m3Result?.metadata?.extra?.patterns || {},
          // Métadonnées
          computed_at: new Date().toISOString(),
          computation_status: 'COMPUTED'
        };

      } catch (error) {
        errors++;
        console.error(`  ❌ Erreur pair_id ${pair.pair_id}:`, error);
      
        return {
          pair_id: pair.pair_id,
          computation_status: 'ERROR',
          computed_at: new Date().toISOString()
        };
      }
    })
  );

  // 4. Mise à jour en base
const { error: updateError } = await supabase
  .from('h2_analysis_pairs')
  .upsert(updates, { 
    onConflict: 'pair_id',
    ignoreDuplicates: false 
  });

  if (updateError) {
    console.error('  ❌ Erreur mise à jour:', updateError);
  } else {
    console.log(`  ✅ ${updates.length} paires mises à jour`);
  }

  console.log('\n📈 Résumé:');
  console.log(`  ✅ Calculées: ${processed}`);
  console.log(`  ❌ Erreurs: ${errors}`);
  console.log(`  📊 Total: ${pairs.length}`);
}

precomputeH2Results()
  .then(() => console.log('\n✅ Pré-calcul terminé'))
  .catch((err) => console.error('\n❌ Erreur fatale:', err))
  .finally(() => process.exit());
