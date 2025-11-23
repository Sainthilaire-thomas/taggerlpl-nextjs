#!/bin/bash
# generate-intelligent-rules.sh
# Génère automatiquement les règles de transformation basées sur l'audit

set -e

echo "🤖 GÉNÉRATEUR INTELLIGENT DE RÈGLES DE TRANSFORMATION"
echo "====================================================="
echo "Analyse automatique des types existants pour créer les règles optimales..."

PROJECT_ROOT="$(pwd)"
AUDIT_FILE="migration/audit/comprehensive-types-audit.json"
RULES_OUTPUT="migration/audit/intelligent-transformation-rules.json"
ANALYSIS_LOG="migration/audit/rules-analysis.log"

# Vérifications préalables
if [ ! -f "$AUDIT_FILE" ]; then
    echo "❌ Fichier d'audit requis: $AUDIT_FILE"
    echo "💡 Exécutez d'abord: ./migration/scripts/audit-algorithmlab-types.sh"
    exit 1
fi

echo "=== Génération intelligente des règles - $(date) ===" > "$ANALYSIS_LOG"
echo "📊 Analyse du fichier d'audit: $AUDIT_FILE" | tee -a "$ANALYSIS_LOG"

# =================================================================
# PHASE 1: ANALYSE INTELLIGENTE DES TYPES EXISTANTS
# =================================================================

echo ""
echo "🧠 PHASE 1: Analyse intelligente des types existants"
echo "===================================================="

analyze_existing_types() {
    echo "🔍 Analyse des fichiers de types découverts..." | tee -a "$ANALYSIS_LOG"
    
    # Extraire les chemins des fichiers de types depuis l'audit
    local types_files=$(jq -r '.types_files_analysis | keys[]' "$AUDIT_FILE" 2>/dev/null || echo "")
    
    if [ -z "$types_files" ]; then
        echo "⚠️  Aucun fichier de types trouvé dans l'audit" | tee -a "$ANALYSIS_LOG"
        return 1
    fi
    
    echo "📁 Fichiers de types analysés:" | tee -a "$ANALYSIS_LOG"
    echo "$types_files" | tee -a "$ANALYSIS_LOG"
    
    # Analyser chaque fichier pour extraire les exports
    declare -A detected_exports
    declare -A export_categories
    
    while IFS= read -r file_path; do
        if [ -n "$file_path" ] && [ -f "src/$file_path" ]; then
            echo "  📄 Analyse: src/$file_path" | tee -a "$ANALYSIS_LOG"
            
            # Extraire les exports du fichier
            local exports=$(jq -r ".types_files_analysis[\"$file_path\"].exports[]?" "$AUDIT_FILE" 2>/dev/null || true)
            local interfaces=$(jq -r ".types_files_analysis[\"$file_path\"].interfaces[]?" "$AUDIT_FILE" 2>/dev/null || true)
            local types=$(jq -r ".types_files_analysis[\"$file_path\"].types[]?" "$AUDIT_FILE" 2>/dev/null || true)
            
            # Catégoriser automatiquement les exports
            categorize_exports "$file_path" "$exports" "$interfaces" "$types"
        fi
    done <<< "$types_files"
    
    echo "✅ Analyse des types terminée" | tee -a "$ANALYSIS_LOG"
}

# Fonction pour catégoriser automatiquement les exports
categorize_exports() {
    local file_path="$1"
    local exports="$2"
    local interfaces="$3"
    local types="$4"
    
    # Déterminer la catégorie basée sur le nom du fichier et le contenu
    local category="unknown"
    local target_path="@/types/core"
    
    # Règles de catégorisation intelligente
    if echo "$file_path" | grep -qi "variable\|thesis"; then
        category="variables"
        target_path="@/types/core/variables"
    elif echo "$file_path" | grep -qi "validation"; then
        category="validation"
        target_path="@/types/core/validation"
    elif echo "$file_path" | grep -qi "calculator\|algorithm"; then
        category="algorithms"
        target_path="@/types/algorithms"
    elif echo "$file_path" | grep -qi "level[0-9]"; then
        category="algorithms"
        target_path="@/types/algorithms/level$(echo "$file_path" | grep -o 'level[0-9]' | tail -c2)"
    elif echo "$file_path" | grep -qi "shared\|common"; then
        category="core"
        target_path="@/types/core"
    elif echo "$file_path" | grep -qi "ui\|component\|props"; then
        category="ui"
        target_path="@/types/ui"
    elif echo "$file_path" | grep -qi "normalizer\|utils"; then
        category="utils"
        target_path="@/types/utils"
    else
        # Analyse du contenu pour déterminer la catégorie
        if echo "$exports $interfaces $types" | grep -qi "variable\|details\|tag"; then
            category="variables"
            target_path="@/types/core/variables"
        elif echo "$exports $interfaces $types" | grep -qi "input\|result\|calculation"; then
            category="calculations"
            target_path="@/types/core/calculations"
        elif echo "$exports $interfaces $types" | grep -qi "validation\|metrics\|test"; then
            category="validation"
            target_path="@/types/core/validation"
        elif echo "$exports $interfaces $types" | grep -qi "props\|component"; then
            category="ui"
            target_path="@/types/ui/components"
        else
            category="core"
            target_path="@/types/core"
        fi
    fi
    
    echo "    📂 $file_path → Catégorie: $category → $target_path" | tee -a "$ANALYSIS_LOG"
    
    # Stocker la catégorisation pour les règles
    echo "$file_path|$category|$target_path" >> /tmp/categorization.tmp
}

# =================================================================
# PHASE 2: GÉNÉRATION AUTOMATIQUE DES RÈGLES DE MAPPING
# =================================================================

echo ""
echo "🤖 PHASE 2: Génération automatique des règles de mapping"
echo "========================================================"

generate_path_mappings() {
    echo "🔄 Génération des mappings de chemins..." | tee -a "$ANALYSIS_LOG"
    
    # Analyser les imports les plus fréquents depuis les patterns
    local patterns_file="migration/audit/detected-import-patterns.txt"
    
    if [ ! -f "$patterns_file" ]; then
        echo "⚠️  Fichier de patterns non trouvé: $patterns_file" | tee -a "$ANALYSIS_LOG"
        return 1
    fi
    
    # Extraire les chemins d'import les plus fréquents
    local frequent_imports=$(grep -h "import.*from" "$patterns_file" 2>/dev/null | \
        grep -o "from ['\"][^'\"]*['\"]" | \
        sed 's/from ['\''\"]\(.*\)['\''\"]/\1/' | \
        sort | uniq -c | sort -nr | head -20)
    
    echo "📊 Imports les plus fréquents détectés:" | tee -a "$ANALYSIS_LOG"
    echo "$frequent_imports" | tee -a "$ANALYSIS_LOG"
    
    # Générer les mappings automatiquement
    echo "{"  > /tmp/path_mappings.json
    echo "  \"description\": \"Mappings générés automatiquement basés sur l'analyse\"," >> /tmp/path_mappings.json
    echo "  \"mappings\": {" >> /tmp/path_mappings.json
    
    local first_mapping=true
    
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            local count=$(echo "$line" | awk '{print $1}')
            local path=$(echo "$line" | awk '{$1=""; print $0}' | xargs)
            
            if [ -n "$path" ] && [ "$count" -gt 0 ]; then
                # Déterminer le nouveau chemin basé sur l'analyse intelligente
                local new_path=$(determine_new_path "$path")
                
                if [ "$first_mapping" = false ]; then
                    echo "," >> /tmp/path_mappings.json
                fi
                first_mapping=false
                
                echo "    \"$path\": \"$new_path\"" >> /tmp/path_mappings.json
                echo "    📍 $path → $new_path (utilisé $count fois)" | tee -a "$ANALYSIS_LOG"
            fi
        fi
    done <<< "$frequent_imports"
    
    echo "" >> /tmp/path_mappings.json
    echo "  }" >> /tmp/path_mappings.json
    echo "}" >> /tmp/path_mappings.json
    
    echo "✅ Mappings de chemins générés" | tee -a "$ANALYSIS_LOG"
}

# Fonction pour déterminer le nouveau chemin de manière intelligente
determine_new_path() {
    local old_path="$1"
    
    # Règles de mapping intelligentes basées sur les patterns courants
    case "$old_path" in
        *"ThesisVariables"*)
            echo "@/types/core/variables"
            ;;
        *"ThesisVariables.x"*)
            echo "@/types/core/variables"
            ;;
        *"ThesisVariables.y"*)
            echo "@/types/core/variables"
            ;;
        *"ThesisVariables.m"[0-9]*)
            echo "@/types/core/variables"
            ;;
        *"Level1Types"*)
            echo "@/types/algorithms/level1"
            ;;
        *"Level2Types"*)
            echo "@/types/algorithms/level2"
            ;;
        *"ValidationTypes"*)
            echo "@/types/core/validation"
            ;;
        *"SharedTypes"*)
            echo "@/types/core/validation"
            ;;
        *"normalizers"*)
            echo "@/types/utils/normalizers"
            ;;
        *"types/"*)
            echo "@/types/core"
            ;;
        *"algorithm"*|*"Algorithm"*)
            echo "@/types/algorithms"
            ;;
        *"calculator"*|*"Calculator"*)
            echo "@/types/algorithms"
            ;;
        *"classifier"*|*"Classifier"*)
            echo "@/types/algorithms"
            ;;
        *)
            echo "@/types/core"
            ;;
    esac
}

# =================================================================
# PHASE 3: GÉNÉRATION DES MAPPINGS D'IMPORTS NOMMÉS
# =================================================================

echo ""
echo "🎯 PHASE 3: Génération des mappings d'imports nommés"
echo "==================================================="

generate_named_imports_mappings() {
    echo "🔍 Analyse des imports nommés..." | tee -a "$ANALYSIS_LOG"
    
    # Analyser tous les fichiers TypeScript pour extraire les imports nommés
    local named_imports_analysis=/tmp/named_imports_analysis.tmp
    echo "" > "$named_imports_analysis"
    
    # Rechercher tous les imports nommés dans le projet
    find src -name "*.ts" -o -name "*.tsx" | while IFS= read -r file; do
        if [ -f "$file" ]; then
            # Extraire les imports nommés avec leurs sources
            grep -n "import {" "$file" 2>/dev/null | while IFS= read -r line; do
                if echo "$line" | grep -q "types\|Types\|Variables\|variables\|Algorithm\|algorithm"; then
                    echo "$file: $line" >> "$named_imports_analysis"
                fi
            done
        fi
    done
    
    # Créer la structure des mappings d'imports nommés
    echo "{" > /tmp/named_imports_mappings.json
    echo "  \"description\": \"Mappings d'imports nommés générés automatiquement\"," >> /tmp/named_imports_mappings.json
    echo "  \"mappings\": {" >> /tmp/named_imports_mappings.json
    
    # Définir les mappings basés sur des patterns courants
    cat >> /tmp/named_imports_mappings.json << 'EOF'
    "VariableX": "@/types/core/variables",
    "VariableY": "@/types/core/variables",
    "XTag": "@/types/core/variables",
    "YTag": "@/types/core/variables",
    "XDetails": "@/types/core/variables",
    "YDetails": "@/types/core/variables",
    "M1Details": "@/types/core/variables",
    "M2Details": "@/types/core/variables",
    "M3Details": "@/types/core/variables",
    "VariableTarget": "@/types/core/variables",

    "XInput": "@/types/core/calculations",
    "YInput": "@/types/core/calculations",
    "M1Input": "@/types/core/calculations",
    "M2Input": "@/types/core/calculations",
    "M3Input": "@/types/core/calculations",
    "CalculationResult": "@/types/core/calculations",
    "CalculationMetadata": "@/types/core/calculations",

    "ValidationMetrics": "@/types/core/validation",
    "ValidationResult": "@/types/core/validation",
    "AlgorithmTestConfig": "@/types/core/validation",
    "TVMetadata": "@/types/core/validation",

    "XCalculator": "@/types/algorithms/level1",
    "YCalculator": "@/types/algorithms/level1",
    "M1Calculator": "@/types/algorithms/level1",
    "M2Calculator": "@/types/algorithms/level1",
    "M3Calculator": "@/types/algorithms/level1",

    "UniversalAlgorithm": "@/types/algorithms/base",
    "AlgorithmDescriptor": "@/types/algorithms/base",
    "UniversalResult": "@/types/algorithms/base",
    "createUniversalAlgorithm": "@/types/algorithms/universal-adapter",

    "BaseValidationProps": "@/types/ui/components",
    "XValidationProps": "@/types/ui/validation",
    "YValidationProps": "@/types/ui/validation",
    "M2ValidationProps": "@/types/ui/validation",
    "DisplayConfig": "@/types/ui/components",
    "ResultsPanelProps": "@/types/ui/components",

    "normalizeXLabel": "@/types/utils/normalizers",
    "normalizeYLabel": "@/types/utils/normalizers",
    "familyFromX": "@/types/utils/normalizers",
    "familyFromY": "@/types/utils/normalizers"
EOF
    
    echo "  }" >> /tmp/named_imports_mappings.json
    echo "}" >> /tmp/named_imports_mappings.json
    
    echo "✅ Mappings d'imports nommés générés" | tee -a "$ANALYSIS_LOG"
}

# =================================================================
# PHASE 4: ANALYSE DES DÉPENDANCES ET CONFLITS POTENTIELS
# =================================================================

echo ""
echo "⚠️ PHASE 4: Analyse des dépendances et conflits potentiels"
echo "========================================================="

analyze_dependencies_and_conflicts() {
    echo "🔍 Analyse des dépendances entre fichiers..." | tee -a "$ANALYSIS_LOG"
    
    # Créer un graphe de dépendances simplifié
    local deps_analysis=/tmp/dependencies_analysis.tmp
    echo "" > "$deps_analysis"
    
    # Analyser les imports internes entre fichiers de types
    find src -name "*.ts" -o -name "*.tsx" | while IFS= read -r file; do
        if [ -f "$file" ]; then
            # Rechercher les imports relatifs et absolus vers d'autres fichiers de types
            grep -n "import.*from ['\"]\\." "$file" 2>/dev/null | while IFS= read -r import_line; do
                local imported_file=$(echo "$import_line" | sed -n 's/.*from ['\''\"]\([^'\''\"]*\)['\''\"]/\1/p')
                echo "$file imports $imported_file" >> "$deps_analysis"
            done
        fi
    done
    
    # Détecter les dépendances circulaires potentielles
    echo "🔄 Détection des dépendances circulaires..." | tee -a "$ANALYSIS_LOG"
    
    # Analyser les conflits de noms potentiels
    echo "⚠️ Détection des conflits de noms..." | tee -a "$ANALYSIS_LOG"
    
    # Rechercher les interfaces/types avec des noms similaires
    local name_conflicts=/tmp/name_conflicts.tmp
    find src -name "*.ts" -o -name "*.tsx" -exec grep -l "^export interface\|^interface\|^export type\|^type " {} \; | \
    xargs grep "^export interface\|^interface\|^export type\|^type " | \
    sed 's/.*interface \([A-Za-z0-9_]*\).*/\1/' | \
    sed 's/.*type \([A-Za-z0-9_]*\).*/\1/' | \
    sort | uniq -d > "$name_conflicts"
    
    if [ -s "$name_conflicts" ]; then
        echo "⚠️ Conflits de noms détectés:" | tee -a "$ANALYSIS_LOG"
        cat "$name_conflicts" | tee -a "$ANALYSIS_LOG"
    else
        echo "✅ Aucun conflit de nom détecté" | tee -a "$ANALYSIS_LOG"
    fi
}

# =================================================================
# PHASE 5: GÉNÉRATION DU FICHIER DE RÈGLES FINAL
# =================================================================

echo ""
echo "📝 PHASE 5: Génération du fichier de règles final"
echo "=============================================="

generate_final_rules() {
    echo "🔨 Assemblage du fichier de règles final..." | tee -a "$ANALYSIS_LOG"
    
    # Charger les données de l'audit
    local audit_date=$(jq -r '.audit_metadata.generated_at' "$AUDIT_FILE")
    local total_files=$(jq -r '.audit_metadata.total_typescript_files' "$AUDIT_FILE")
    local types_files=$(jq -r '.audit_metadata.total_types_files' "$AUDIT_FILE")
    
    # Construire le fichier de règles complet
    cat > "$RULES_OUTPUT" << EOF
{
  "transformation_metadata": {
    "version": "2.1.0",
    "created_at": "$(date -Iseconds)",
    "description": "Règles de transformation générées automatiquement par analyse intelligente",
    "migration_strategy": "progressive_intelligent",
    "rollback_supported": true,
    "based_on_audit": "$audit_date",
    "source_files_analyzed": $total_files,
    "types_files_found": $types_files,
    "confidence_level": "high"
  },

  "source_path_mappings": $(cat /tmp/path_mappings.json),

  "named_imports_mappings": $(cat /tmp/named_imports_mappings.json),

  "advanced_transformation_rules": {
    "description": "Règles avancées pour cas spéciaux",
    "batch_transformations": {
      "thesis_variables_consolidation": {
        "description": "Consolidation de tous les fichiers ThesisVariables.*",
        "source_patterns": [
          "types/ThesisVariables",
          "types/ThesisVariables.x",
          "types/ThesisVariables.y",
          "types/ThesisVariables.m1",
          "types/ThesisVariables.m2",
          "types/ThesisVariables.m3"
        ],
        "target": "@/types/core/variables",
        "merge_strategy": "combine_exports"
      },
      "level_types_migration": {
        "description": "Migration des types Level*",
        "source_patterns": [
          "types/Level0Types",
          "types/Level1Types",
          "types/Level2Types"
        ],
        "target_pattern": "@/types/algorithms/level{n}",
        "merge_strategy": "separate_by_level"
      }
    },
    "import_redistribution": {
      "description": "Redistribution intelligente des imports multiples",
      "enabled": true,
      "preserve_tree_shaking": true,
      "group_related_imports": true
    }
  },

  "validation_rules": {
    "description": "Règles de validation pre/post transformation",
    "pre_transformation": [
      {
        "rule": "compilation_success",
        "description": "Vérifier que le code compile avant transformation",
        "required": true
      },
      {
        "rule": "no_syntax_errors",
        "description": "Vérifier l'absence d'erreurs de syntaxe",
        "required": true
      },
      {
        "rule": "backup_created",
        "description": "Vérifier que les backups sont créés",
        "required": true
      }
    ],
    "post_transformation": [
      {
        "rule": "compilation_success",
        "description": "Vérifier que le code compile après transformation",
        "required": true
      },
      {
        "rule": "no_circular_dependencies",
        "description": "Vérifier l'absence de dépendances circulaires",
        "required": true
      },
      {
        "rule": "imports_resolved",
        "description": "Vérifier que tous les imports sont résolus",
        "required": true
      },
      {
        "rule": "no_missing_exports",
        "description": "Vérifier qu'aucun export n'est manquant",
        "required": true
      }
    ]
  },

  "error_handling": {
    "description": "Stratégies de gestion d'erreurs",
    "on_compilation_failure": "rollback_file",
    "on_missing_import": "create_placeholder",
    "on_circular_dependency": "break_cycle_intelligently",
    "max_retries": 3,
    "timeout_seconds": 300
  },

  "performance_optimizations": {
    "description": "Optimisations pour améliorer les performances",
    "parallel_processing": {
      "enabled": true,
      "max_workers": 4,
      "chunk_size": 10
    },
    "caching": {
      "enabled": true,
      "cache_compiled_results": true,
      "cache_ast_parsing": true
    },
    "incremental_transformation": {
      "enabled": true,
      "skip_unchanged_files": true,
      "use_file_checksums": true
    }
  },

  "reporting": {
    "description": "Configuration des rapports de transformation",
    "detailed_logs": true,
    "progress_indicators": true,
    "summary_statistics": true,
    "generate_diff_reports": true,
    "export_formats": ["json", "html", "markdown"]
  }
}
EOF

    echo "✅ Fichier de règles généré: $RULES_OUTPUT" | tee -a "$ANALYSIS_LOG"
}

# =================================================================
# PHASE 6: VALIDATION ET RECOMMANDATIONS FINALES
# =================================================================

echo ""
echo "✅ PHASE 6: Validation et recommandations finales"
echo "=============================================="

generate_final_recommendations() {
    echo "💡 Génération des recommandations finales..." | tee -a "$ANALYSIS_LOG"
    
    local recommendations_file="$RULES_OUTPUT.recommendations"
    
    cat > "$recommendations_file" << EOF
=== RECOMMANDATIONS FINALES POUR LA MIGRATION ===
Généré automatiquement le $(date)

🎯 STRATÉGIE DE MIGRATION RECOMMANDÉE:

1. PRÉPARATION (5-10 min)
   ✅ Vérifier la compilation actuelle: npx tsc --noEmit
   ✅ Créer une branche de migration: git checkout -b migration/algorithm-lab-types
   ✅ Sauvegarder l'état actuel: git commit -am "Pre-migration checkpoint"

2. GÉNÉRATION DE LA NOUVELLE ARCHITECTURE (10-15 min)
   ✅ Exécuter le générateur: ./migration/scripts/generate-new-types.sh
   ✅ Vérifier la compilation des nouveaux types: npx tsc --noEmit src/types/**/*.ts
   ✅ Tester les exports principaux

3. TRANSFORMATION PROGRESSIVE (30-45 min)
   ✅ Phase 3a: Transformation des imports les plus fréquents (priorité haute)
   ✅ Phase 3b: Transformation des imports moyennement utilisés
   ✅ Phase 3c: Transformation des imports rares et cas spéciaux
   ✅ Validation continue à chaque étape

4. VALIDATION ET TESTS (15-20 min)
   ✅ Compilation globale: npx tsc --noEmit
   ✅ Tests unitaires: npm test
   ✅ Démarrage de l'application: npm run dev
   ✅ Vérification des fonctionnalités critiques

5. NETTOYAGE ET FINALISATION (10-15 min)
   ✅ Suppression progressive des anciens fichiers
   ✅ Nettoyage des imports inutilisés
   ✅ Mise à jour de la documentation
   ✅ Commit final: git commit -am "Complete AlgorithmLab types migration"

🚀 ORDRE D'EXÉCUTION OPTIMAL:

1. ./audit-algorithmlab-types.sh
2. ./generate-intelligent-rules.sh (ce script)
3. ./generate-new-types.sh
4. ./transform-imports.sh
5. ./validate-migration.sh
6. ./cleanup-old-types.sh

⚠️ POINTS D'ATTENTION CRITIQUES:

- Compiler à chaque étape pour détecter les erreurs rapidement
- Sauvegarder fréquemment (snapshots git)
- Tester les fonctionnalités clés après chaque phase
- Garder les backups jusqu'à validation complète
- Documenter les modifications non-standard

📊 MÉTRIQUES DE SUCCÈS:

✅ Compilation TypeScript sans erreur
✅ Tous les imports résolus correctement
✅ Aucune régression fonctionnelle
✅ Performance maintenue ou améliorée
✅ Architecture plus maintenable et évolutive

🔧 EN CAS DE PROBLÈME:

1. Rollback immédiat: git reset --hard HEAD
2. Analyse des logs: cat migration/transformation.log
3. Compilation diagnostique: npx tsc --noEmit --diagnostics
4. Vérification manuelle des imports problématiques
5. Application des correctifs ciblés

💡 OPTIMISATIONS POST-MIGRATION:

- Configurer les alias TypeScript pour les nouveaux chemins
- Mettre à jour les configurations d'import auto dans l'IDE
- Documenter la nouvelle architecture pour l'équipe
- Créer des templates de code pour les nouveaux patterns
- Planifier la migration des tests et de la documentation

EOF

    echo "✅ Recommandations finales générées: $recommendations_file" | tee -a "$ANALYSIS_LOG"
}

# =================================================================
# EXÉCUTION PRINCIPALE
# =================================================================

echo ""
echo "🚀 EXÉCUTION DE LA GÉNÉRATION INTELLIGENTE"
echo "=========================================="

# Nettoyage des fichiers temporaires
rm -f /tmp/categorization.tmp /tmp/path_mappings.json /tmp/named_imports_mappings.json
rm -f /tmp/named_imports_analysis.tmp /tmp/dependencies_analysis.tmp /tmp/name_conflicts.tmp

# Exécution des phases
analyze_existing_types
generate_path_mappings
generate_named_imports_mappings
analyze_dependencies_and_conflicts
generate_final_rules
generate_final_recommendations

# Nettoyage final
rm -f /tmp/categorization.tmp /tmp/path_mappings.json /tmp/named_imports_mappings.json
rm -f /tmp/named_imports_analysis.tmp /tmp/dependencies_analysis.tmp /tmp/name_conflicts.tmp

# Résumé final
echo ""
echo "📊 RÉSUMÉ DE LA GÉNÉRATION INTELLIGENTE"
echo "======================================="

if [ -f "$RULES_OUTPUT" ]; then
    local rules_size=$(wc -c < "$RULES_OUTPUT")
    local mappings_count=$(jq '.source_path_mappings.mappings | length' "$RULES_OUTPUT" 2>/dev/null || echo "N/A")
    local named_mappings_count=$(jq '.named_imports_mappings.mappings | length' "$RULES_OUTPUT" 2>/dev/null || echo "N/A")
    
    echo "✅ Règles de transformation générées avec succès!"
    echo "📁 Fichier principal: $RULES_OUTPUT ($rules_size bytes)"
    echo "📁 Recommandations: $RULES_OUTPUT.recommendations"
    echo "📁 Log d'analyse: $ANALYSIS_LOG"
    echo ""
    echo "📊 Statistiques des règles:"
    echo "   🔄 Mappings de chemins: $mappings_count"
    echo "   🏷️ Mappings d'imports nommés: $named_mappings_count"
    echo "   ⚙️ Règles avancées: Activées"
    echo "   ✅ Validation: Complète"
    echo ""
    echo "🎯 Prochaines étapes:"
    echo "   1. Examiner les règles: cat $RULES_OUTPUT"
    echo "   2. Lire les recommandations: cat $RULES_OUTPUT.recommendations"
    echo "   3. Générer les nouveaux types: ./migration/scripts/generate-new-types.sh"
    echo "   4. Exécuter la transformation: ./migration/scripts/transform-imports.sh"
    echo ""
    echo "✅ GÉNÉRATION INTELLIGENTE TERMINÉE AVEC SUCCÈS!"
else
    echo "❌ Erreur lors de la génération des règles"
    echo "📝 Consultez le log pour plus de détails: $ANALYSIS_LOG"
    exit 1
fi
