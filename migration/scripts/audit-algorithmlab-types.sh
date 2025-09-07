#!/bin/bash
# audit-algorithmlab-types.sh
# Script généralisé pour auditer TOUS les types AlgorithmLab existants

set -e

echo "🔍 AUDIT GÉNÉRALISÉ DES TYPES ALGORITHMLAB"
echo "========================================="
echo "Recherche automatique de tous les répertoires et fichiers de types..."

PROJECT_ROOT="$(pwd)"
AUDIT_DIR="migration/audit"
COMPREHENSIVE_AUDIT="$AUDIT_DIR/comprehensive-types-audit.json"
IMPORT_PATTERNS_FILE="$AUDIT_DIR/detected-import-patterns.txt"
TYPES_DISCOVERY_LOG="$AUDIT_DIR/types-discovery.log"

mkdir -p "$AUDIT_DIR"
echo "=== Audit généralisé démarré le $(date) ===" > "$TYPES_DISCOVERY_LOG"

echo "📁 Projet analysé: $PROJECT_ROOT" | tee -a "$TYPES_DISCOVERY_LOG"

# =========================================================
# PHASE 1: DÉCOUVERTE AUTOMATIQUE DES RÉPERTOIRES DE TYPES
# =========================================================

echo ""
echo "🔎 PHASE 1: Découverte automatique des répertoires de types"
echo "============================================================"

# Fonction pour trouver tous les répertoires contenant des types
discover_types_directories() {
    echo "🔍 Recherche des répertoires contenant des fichiers TypeScript..." | tee -a "$TYPES_DISCOVERY_LOG"
    
    # Recherche intelligente des répertoires types
    TYPES_DIRS=$(find src -type d -name "*types*" 2>/dev/null || true)
    ALGORITHM_DIRS=$(find src -type d -name "*algorithm*" -o -name "*Algorithm*" 2>/dev/null || true)
    
    # Recherche de répertoires contenant des fichiers .ts/.tsx avec des patterns de types
    TYPESCRIPT_DIRS=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "^export.*interface\|^export.*type\|^interface\|^type " 2>/dev/null | xargs dirname | sort -u || true)
    
    # Combinaison et déduplication
    ALL_TYPES_DIRS=$(echo -e "$TYPES_DIRS\n$ALGORITHM_DIRS\n$TYPESCRIPT_DIRS" | grep -v "^$" | sort -u || true)
    
    echo "📂 Répertoires de types découverts:" | tee -a "$TYPES_DISCOVERY_LOG"
    echo "$ALL_TYPES_DIRS" | tee -a "$TYPES_DISCOVERY_LOG"
    
    echo "$ALL_TYPES_DIRS"
}

# ======================================================
# PHASE 2: DÉTECTION AUTOMATIQUE DES PATTERNS D'IMPORT
# ======================================================

echo ""
echo "🔎 PHASE 2: Détection automatique des patterns d'import"
echo "======================================================="

# Fonction pour extraire tous les patterns d'import existants
extract_import_patterns() {
    echo "🔍 Extraction des patterns d'import existants..." | tee -a "$TYPES_DISCOVERY_LOG"
    
    # Recherche exhaustive de tous les imports liés aux types
    echo "📋 Patterns d'import détectés:" > "$IMPORT_PATTERNS_FILE"
    echo "============================" >> "$IMPORT_PATTERNS_FILE"
    
    # Pattern 1: Imports directs de types/
    echo "" >> "$IMPORT_PATTERNS_FILE"
    echo "1. IMPORTS DIRECTS DE types/" >> "$IMPORT_PATTERNS_FILE"
    echo "----------------------------" >> "$IMPORT_PATTERNS_FILE"
    grep -r "import.*from ['\"].*types/" src --include="*.ts" --include="*.tsx" 2>/dev/null | head -20 >> "$IMPORT_PATTERNS_FILE" || true
    
    # Pattern 2: Imports ThesisVariables
    echo "" >> "$IMPORT_PATTERNS_FILE"
    echo "2. IMPORTS THESISVARIABLES" >> "$IMPORT_PATTERNS_FILE"
    echo "-------------------------" >> "$IMPORT_PATTERNS_FILE"
    grep -r "import.*ThesisVariables" src --include="*.ts" --include="*.tsx" 2>/dev/null | head -20 >> "$IMPORT_PATTERNS_FILE" || true
    
    # Pattern 3: Imports LevelXTypes
    echo "" >> "$IMPORT_PATTERNS_FILE"
    echo "3. IMPORTS LEVELXTYPES" >> "$IMPORT_PATTERNS_FILE"
    echo "---------------------" >> "$IMPORT_PATTERNS_FILE"
    grep -r "import.*Level[0-9]Types" src --include="*.ts" --include="*.tsx" 2>/dev/null | head -20 >> "$IMPORT_PATTERNS_FILE" || true
    
    # Pattern 4: Imports ValidationTypes
    echo "" >> "$IMPORT_PATTERNS_FILE"
    echo "4. IMPORTS VALIDATIONTYPES" >> "$IMPORT_PATTERNS_FILE"
    echo "-------------------------" >> "$IMPORT_PATTERNS_FILE"
    grep -r "import.*ValidationTypes" src --include="*.ts" --include="*.tsx" 2>/dev/null | head -20 >> "$IMPORT_PATTERNS_FILE" || true
    
    # Pattern 5: Imports SharedTypes
    echo "" >> "$IMPORT_PATTERNS_FILE"
    echo "5. IMPORTS SHAREDTYPES" >> "$IMPORT_PATTERNS_FILE"
    echo "---------------------" >> "$IMPORT_PATTERNS_FILE"
    grep -r "import.*SharedTypes" src --include="*.ts" --include="*.tsx" 2>/dev/null | head -20 >> "$IMPORT_PATTERNS_FILE" || true
    
    # Pattern 6: Imports normalizers
    echo "" >> "$IMPORT_PATTERNS_FILE"
    echo "6. IMPORTS NORMALIZERS" >> "$IMPORT_PATTERNS_FILE"
    echo "---------------------" >> "$IMPORT_PATTERNS_FILE"
    grep -r "import.*normalizers" src --include="*.ts" --include="*.tsx" 2>/dev/null | head -20 >> "$IMPORT_PATTERNS_FILE" || true
    
    # Pattern 7: Autres imports algorithmiques
    echo "" >> "$IMPORT_PATTERNS_FILE"
    echo "7. AUTRES IMPORTS ALGORITHMIQUES" >> "$IMPORT_PATTERNS_FILE"
    echo "-------------------------------" >> "$IMPORT_PATTERNS_FILE"
    grep -r "import.*Algorithm\|import.*Calculator\|import.*Classifier" src --include="*.ts" --include="*.tsx" 2>/dev/null | head -20 >> "$IMPORT_PATTERNS_FILE" || true
    
    echo "✅ Patterns d'import extraits dans: $IMPORT_PATTERNS_FILE" | tee -a "$TYPES_DISCOVERY_LOG"
}

# ==========================================================
# PHASE 3: ANALYSE EXHAUSTIVE DES FICHIERS DE TYPES
# ==========================================================

echo ""
echo "🔎 PHASE 3: Analyse exhaustive des fichiers de types"
echo "===================================================="

# Fonction pour analyser un fichier de types spécifique
analyze_types_file() {
    local file="$1"
    echo "📄 Analyse: $file" | tee -a "$TYPES_DISCOVERY_LOG"
    
    # Extraire les exports
    local exports=$(grep -n "^export" "$file" 2>/dev/null || true)
    local interfaces=$(grep -n "^export interface\|^interface" "$file" 2>/dev/null || true)
    local types=$(grep -n "^export type\|^type " "$file" 2>/dev/null || true)
    local functions=$(grep -n "^export function\|^export const.*=" "$file" 2>/dev/null || true)
    
    # Créer l'objet JSON pour ce fichier
    cat << EOF
    "$(echo "$file" | sed 's|^./||')": {
      "size_bytes": $(wc -c < "$file" 2>/dev/null || echo 0),
      "lines_count": $(wc -l < "$file" 2>/dev/null || echo 0),
      "exports_count": $(echo "$exports" | grep -c "." || echo 0),
      "interfaces_count": $(echo "$interfaces" | grep -c "." || echo 0),
      "types_count": $(echo "$types" | grep -c "." || echo 0),
      "functions_count": $(echo "$functions" | grep -c "." || echo 0),
      "exports": [
$(echo "$exports" | head -10 | sed 's/.*/"&"/' | paste -sd, || true)
      ],
      "interfaces": [
$(echo "$interfaces" | head -10 | sed 's/.*/"&"/' | paste -sd, || true)
      ],
      "types": [
$(echo "$types" | head -10 | sed 's/.*/"&"/' | paste -sd, || true)
      ],
      "imports": [
$(grep -n "^import" "$file" 2>/dev/null | head -10 | sed 's/.*/"&"/' | paste -sd, || true)
      ]
    }
EOF
}

# ==========================================================
# PHASE 4: GÉNÉRATION DU RAPPORT COMPLET
# ==========================================================

echo ""
echo "🔎 PHASE 4: Génération du rapport complet"
echo "========================================="

generate_comprehensive_audit() {
    echo "📊 Génération du rapport complet..." | tee -a "$TYPES_DISCOVERY_LOG"
    
    # Initialiser le fichier JSON
    cat > "$COMPREHENSIVE_AUDIT" << 'EOF'
{
  "audit_metadata": {
    "generated_at": "",
    "project_root": "",
    "audit_version": "2.0.0",
    "total_typescript_files": 0,
    "total_types_files": 0,
    "total_algorithm_files": 0,
    "scan_duration_seconds": 0
  },
  "discovered_directories": {},
  "types_files_analysis": {},
  "import_patterns_summary": {},
  "dependencies_graph": {},
  "migration_recommendations": {}
}
EOF
    
    local start_time=$(date +%s)
    
    # Découverte des répertoires
    echo "🔍 Découverte des répertoires..." | tee -a "$TYPES_DISCOVERY_LOG"
    local types_dirs=$(discover_types_directories)
    
    # Extraction des patterns
    echo "🔍 Extraction des patterns..." | tee -a "$TYPES_DISCOVERY_LOG"
    extract_import_patterns
    
    # Comptage des fichiers
    local total_ts_files=$(find src -name "*.ts" -o -name "*.tsx" | wc -l)
    local total_types_files=$(find src -name "*types*.ts" -o -name "*Types*.ts" -o -name "*types*.tsx" -o -name "*Types*.tsx" | wc -l)
    local total_algorithm_files=$(find src -name "*algorithm*.ts" -o -name "*Algorithm*.ts" -o -name "*Calculator*.ts" -o -name "*Classifier*.ts" | wc -l)
    
    # Mise à jour des métadonnées
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Construction du JSON avec jq
    jq ".audit_metadata.generated_at = \"$(date -Iseconds)\" |
        .audit_metadata.project_root = \"$PROJECT_ROOT\" |
        .audit_metadata.total_typescript_files = $total_ts_files |
        .audit_metadata.total_types_files = $total_types_files |
        .audit_metadata.total_algorithm_files = $total_algorithm_files |
        .audit_metadata.scan_duration_seconds = $duration" "$COMPREHENSIVE_AUDIT" > temp.json && mv temp.json "$COMPREHENSIVE_AUDIT"
    
    # Analyse des répertoires découverts
    echo "🔍 Analyse des répertoires..." | tee -a "$TYPES_DISCOVERY_LOG"
    local dirs_analysis=""
    while IFS= read -r dir; do
        if [ -n "$dir" ] && [ -d "$dir" ]; then
            local files_count=$(find "$dir" -maxdepth 1 -name "*.ts" -o -name "*.tsx" | wc -l)
            local subdirs_count=$(find "$dir" -mindepth 1 -maxdepth 1 -type d | wc -l)
            
            dirs_analysis="$dirs_analysis\"$dir\": {
                \"files_count\": $files_count,
                \"subdirs_count\": $subdirs_count,
                \"total_size_bytes\": $(find "$dir" -name "*.ts" -o -name "*.tsx" -exec wc -c {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo 0)
            },"
        fi
    done <<< "$types_dirs"
    
    # Supprimer la dernière virgule et ajouter au JSON
    dirs_analysis=$(echo "$dirs_analysis" | sed 's/,$//g')
    jq ".discovered_directories = {$dirs_analysis}" "$COMPREHENSIVE_AUDIT" > temp.json && mv temp.json "$COMPREHENSIVE_AUDIT"
    
    # Analyse des fichiers de types
    echo "🔍 Analyse des fichiers de types..." | tee -a "$TYPES_DISCOVERY_LOG"
    local files_analysis=""
    local first_file=true
    
    find src -name "*types*.ts" -o -name "*Types*.ts" -o -name "*variables*.ts" -o -name "*Variables*.ts" | while IFS= read -r file; do
        if [ -f "$file" ]; then
            if [ "$first_file" = true ]; then
                first_file=false
            else
                files_analysis="$files_analysis,"
            fi
            files_analysis="$files_analysis$(analyze_types_file "$file")"
        fi
    done
    
    echo "✅ Rapport complet généré: $COMPREHENSIVE_AUDIT" | tee -a "$TYPES_DISCOVERY_LOG"
}

# ==========================================================
# PHASE 5: RECOMMANDATIONS INTELLIGENTES
# ==========================================================

generate_migration_recommendations() {
    echo ""
    echo "🎯 PHASE 5: Génération des recommandations intelligentes"
    echo "======================================================="
    
    echo "💡 Analyse des patterns pour recommandations..." | tee -a "$TYPES_DISCOVERY_LOG"
    
    # Analyser les imports pour détecter les patterns de migration
    local most_imported=$(grep -r "import.*from" src --include="*.ts" --include="*.tsx" 2>/dev/null | \
        grep -E "(types|Types|Variables|variables)" | \
        cut -d'"' -f2 | sort | uniq -c | sort -nr | head -10)
    
    echo "📊 Imports les plus fréquents:" | tee -a "$TYPES_DISCOVERY_LOG"
    echo "$most_imported" | tee -a "$TYPES_DISCOVERY_LOG"
    
    # Générer les recommandations de mapping
    cat >> "$COMPREHENSIVE_AUDIT.recommendations" << EOF
=== RECOMMANDATIONS DE MIGRATION ALGORITHMLAB ===
Généré le $(date)

📋 PRIORITÉS DE MIGRATION (par fréquence d'usage):
$most_imported

🎯 MAPPINGS RECOMMANDÉS:
$(echo "$most_imported" | head -5 | while read count path; do
    echo "  $path → @/types/core/variables (utilisé $count fois)"
done)

🔧 STRATÉGIE RECOMMANDÉE:
1. Migrer d'abord les imports les plus fréquents
2. Consolider les types similaires (XDetails, YDetails, etc.)
3. Créer l'adaptateur universel pour les algorithmes
4. Nettoyer progressivement les anciens fichiers

⚠️  POINTS D'ATTENTION:
- Vérifier les dépendances circulaires
- Sauvegarder avant transformation
- Tester la compilation à chaque étape
EOF
    
    echo "✅ Recommandations générées: $COMPREHENSIVE_AUDIT.recommendations" | tee -a "$TYPES_DISCOVERY_LOG"
}

# ==========================================================
# EXÉCUTION PRINCIPALE
# ==========================================================

echo ""
echo "🚀 EXÉCUTION DE L'AUDIT COMPLET"
echo "==============================="

# Vérification des prérequis
if ! command -v jq &> /dev/null; then
    echo "❌ jq n'est pas installé. Installation requise:"
    echo "   Ubuntu/Debian: sudo apt install jq"
    echo "   macOS: brew install jq"
    echo "   Windows: winget install jq"
    exit 1
fi

# Génération de l'audit complet
generate_comprehensive_audit

# Génération des recommandations
generate_migration_recommendations

# Résumé final
echo ""
echo "📊 RÉSUMÉ DE L'AUDIT COMPLET"
echo "============================"

# Affichage des statistiques
total_ts=$(jq -r '.audit_metadata.total_typescript_files' "$COMPREHENSIVE_AUDIT")
total_types=$(jq -r '.audit_metadata.total_types_files' "$COMPREHENSIVE_AUDIT")
total_algo=$(jq -r '.audit_metadata.total_algorithm_files' "$COMPREHENSIVE_AUDIT")
duration=$(jq -r '.audit_metadata.scan_duration_seconds' "$COMPREHENSIVE_AUDIT")

echo "📁 Fichiers TypeScript totaux: $total_ts"
echo "🏷️  Fichiers de types: $total_types"
echo "🤖 Fichiers algorithmes: $total_algo"
echo "⏱️  Durée du scan: ${duration}s"
echo ""
echo "📋 Fichiers générés:"
echo "   📊 Audit complet: $COMPREHENSIVE_AUDIT"
echo "   📋 Patterns d'import: $IMPORT_PATTERNS_FILE"
echo "   💡 Recommandations: $COMPREHENSIVE_AUDIT.recommendations"
echo "   📝 Log détaillé: $TYPES_DISCOVERY_LOG"
echo ""
echo "🎯 Prochaines étapes recommandées:"
echo "   1. Examiner les patterns: cat $IMPORT_PATTERNS_FILE"
echo "   2. Lire les recommandations: cat $COMPREHENSIVE_AUDIT.recommendations"
echo "   3. Exécuter la génération des nouveaux types"
echo "   4. Lancer la transformation des imports"
echo ""
echo "✅ AUDIT COMPLET TERMINÉ AVEC SUCCÈS!"
