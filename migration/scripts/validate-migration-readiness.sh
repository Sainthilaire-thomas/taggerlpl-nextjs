#!/bin/bash
# validate-migration-readiness.sh
# Script de validation complète avant de lancer la migration

set -e

echo "🛡️ VALIDATION DE LA PRÉPARATION À LA MIGRATION"
echo "=============================================="
echo "Vérification complète de l'état du projet avant migration..."

PROJECT_ROOT="$(pwd)"
VALIDATION_LOG="migration/audit/validation-report.log"
VALIDATION_REPORT="migration/audit/validation-report.json"

mkdir -p "$(dirname "$VALIDATION_LOG")"

echo "=== Validation pré-migration démarrée le $(date) ===" > "$VALIDATION_LOG"

# Initialisation du rapport JSON
cat > "$VALIDATION_REPORT" << 'EOF'
{
  "validation_metadata": {
    "timestamp": "",
    "project_root": "",
    "validation_version": "1.0.0"
  },
  "checks": {},
  "summary": {
    "total_checks": 0,
    "passed_checks": 0,
    "failed_checks": 0,
    "warnings": 0,
    "overall_status": "unknown"
  },
  "recommendations": []
}
EOF

# Variables de comptage
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Fonction pour ajouter un résultat de vérification
add_check_result() {
    local check_name="$1"
    local status="$2"
    local message="$3"
    local details="$4"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    case "$status" in
        "PASS")
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            echo "✅ $check_name: $message" | tee -a "$VALIDATION_LOG"
            ;;
        "FAIL")
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            echo "❌ $check_name: $message" | tee -a "$VALIDATION_LOG"
            ;;
        "WARN")
            WARNINGS=$((WARNINGS + 1))
            echo "⚠️ $check_name: $message" | tee -a "$VALIDATION_LOG"
            ;;
    esac
    
    if [ -n "$details" ]; then
        echo "   📋 Détails: $details" | tee -a "$VALIDATION_LOG"
    fi
    
    # Ajouter au rapport JSON
    local temp_file=$(mktemp)
    jq ".checks[\"$check_name\"] = {
        \"status\": \"$status\",
        \"message\": \"$message\",
        \"details\": \"$details\",
        \"timestamp\": \"$(date -Iseconds)\"
    }" "$VALIDATION_REPORT" > "$temp_file" && mv "$temp_file" "$VALIDATION_REPORT"
}

echo ""
echo "🔍 PHASE 1: Vérifications des prérequis"
echo "======================================="

# Vérification 1: Node.js et npm
check_nodejs() {
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        local major_version=$(echo "$node_version" | cut -d'.' -f1 | sed 's/v//')
        
        if [ "$major_version" -ge 18 ]; then
            add_check_result "nodejs_version" "PASS" "Node.js $node_version est compatible" ""
        else
            add_check_result "nodejs_version" "FAIL" "Node.js $node_version est trop ancien (requis: >= 18)" "Mise à jour recommandée"
        fi
    else
        add_check_result "nodejs_version" "FAIL" "Node.js n'est pas installé" "Installation requise"
    fi
}

# Vérification 2: TypeScript
check_typescript() {
    if command -v npx >/dev/null 2>&1 && npx tsc --version >/dev/null 2>&1; then
        local ts_version=$(npx tsc --version)
        add_check_result "typescript_available" "PASS" "TypeScript disponible: $ts_version" ""
    else
        add_check_result "typescript_available" "FAIL" "TypeScript n'est pas disponible" "Installation: npm install -g typescript"
    fi
}

# Vérification 3: jq pour manipulation JSON
check_jq() {
    if command -v jq >/dev/null 2>&1; then
        local jq_version=$(jq --version)
        add_check_result "jq_available" "PASS" "jq disponible: $jq_version" ""
    else
        add_check_result "jq_available" "FAIL" "jq n'est pas installé" "Installation requise pour les scripts de migration"
    fi
}

# Vérification 4: Git pour versioning
check_git() {
    if command -v git >/dev/null 2>&1; then
        if git rev-parse --git-dir >/dev/null 2>&1; then
            local git_status=$(git status --porcelain)
            if [ -z "$git_status" ]; then
                add_check_result "git_clean" "PASS" "Répertoire git propre" ""
            else
                add_check_result "git_clean" "WARN" "Modifications non commitées détectées" "Recommandé de commiter avant migration"
            fi
        else
            add_check_result "git_repository" "WARN" "Pas un répertoire git" "Recommandé d'initialiser git pour le versioning"
        fi
    else
        add_check_result "git_available" "WARN" "Git n'est pas installé" "Recommandé pour le versioning durant la migration"
    fi
}

echo ""
echo "🔍 PHASE 2: Vérifications de l'état du projet"
echo "============================================="

# Vérification 5: Compilation actuelle
check_current_compilation() {
    echo "🔄 Test de compilation actuelle..." | tee -a "$VALIDATION_LOG"
    
    if npx tsc --noEmit >/dev/null 2>&1; then
        add_check_result "current_compilation" "PASS" "Le projet compile sans erreur" ""
    else
        local errors=$(npx tsc --noEmit 2>&1 | head -10)
        add_check_result "current_compilation" "FAIL" "Erreurs de compilation détectées" "$errors"
    fi
}

# Vérification 6: Structure des fichiers src/
check_src_structure() {
    if [ -d "src" ]; then
        local ts_files_count=$(find src -name "*.ts" -o -name "*.tsx" | wc -l)
        add_check_result "src_structure" "PASS" "Répertoire src/ trouvé avec $ts_files_count fichiers TypeScript" ""
    else
        add_check_result "src_structure" "FAIL" "Répertoire src/ non trouvé" "Structure de projet Next.js attendue"
    fi
}

# Vérification 7: Existence des types AlgorithmLab
check_algorithm_lab_types() {
    local types_found=0
    
    # Chercher les fichiers de types connus
    local common_types=(
        "types/ThesisVariables.ts"
        "types/Level1Types.ts"
        "types/ValidationTypes.ts"
        "types/SharedTypes.ts"
        "types/normalizers.ts"
    )
    
    for type_file in "${common_types[@]}"; do
        if [ -f "src/$type_file" ]; then
            types_found=$((types_found + 1))
        fi
    done
    
    if [ $types_found -gt 0 ]; then
        add_check_result "algorithm_lab_types" "PASS" "$types_found fichiers de types AlgorithmLab trouvés" ""
    else
        # Recherche plus large
        local any_types=$(find src -name "*types*.ts" -o -name "*Types*.ts" | wc -l)
        if [ $any_types -gt 0 ]; then
            add_check_result "algorithm_lab_types" "WARN" "Aucun type AlgorithmLab standard, mais $any_types fichiers de types trouvés" "Structure non-standard détectée"
        else
            add_check_result "algorithm_lab_types" "FAIL" "Aucun fichier de types trouvé" "Migration non applicable"
        fi
    fi
}

# Vérification 8: Analyse des imports existants
check_existing_imports() {
    local algorithm_imports=$(grep -r "import.*from.*types" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo 0)
    
    if [ $algorithm_imports -gt 0 ]; then
        add_check_result "existing_imports" "PASS" "$algorithm_imports imports de types détectés" "Migration nécessaire"
    else
        add_check_result "existing_imports" "WARN" "Peu ou pas d'imports de types détectés" "Vérifier la nécessité de migration"
    fi
}

echo ""
echo "🔍 PHASE 3: Vérifications des scripts de migration"
echo "================================================="

# Vérification 9: Scripts de migration disponibles
check_migration_scripts() {
    local scripts_dir="migration/scripts"
    local required_scripts=(
        "audit-algorithmlab-types.sh"
        "generate-intelligent-rules.sh"
        "generate-new-types.sh"
        "transform-imports.sh"
    )
    
    local scripts_found=0
    local missing_scripts=""
    
    for script in "${required_scripts[@]}"; do
        if [ -f "$scripts_dir/$script" ]; then
            scripts_found=$((scripts_found + 1))
            if [ -x "$scripts_dir/$script" ]; then
                echo "  ✅ $script (exécutable)" | tee -a "$VALIDATION_LOG"
            else
                echo "  ⚠️ $script (non exécutable)" | tee -a "$VALIDATION_LOG"
                chmod +x "$scripts_dir/$script"
                echo "    🔧 Permissions d'exécution ajoutées" | tee -a "$VALIDATION_LOG"
            fi
        else
            missing_scripts="$missing_scripts $script"
        fi
    done
    
    if [ $scripts_found -eq ${#required_scripts[@]} ]; then
        add_check_result "migration_scripts" "PASS" "Tous les scripts de migration sont disponibles" ""
    else
        add_check_result "migration_scripts" "FAIL" "Scripts manquants:$missing_scripts" "Créer les scripts manquants"
    fi
}

# Vérification 10: Espace disque suffisant
check_disk_space() {
    local available_space=$(df . | tail -1 | awk '{print $4}')
    local available_mb=$((available_space / 1024))
    
    if [ $available_mb -gt 100 ]; then
        add_check_result "disk_space" "PASS" "${available_mb}MB d'espace disponible" ""
    else
        add_check_result "disk_space" "WARN" "Seulement ${available_mb}MB d'espace disponible" "Au moins 100MB recommandés"
    fi
}

echo ""
echo "🔍 PHASE 4: Vérifications des dépendances"
echo "========================================="

# Vérification 11: package.json et dépendances
check_dependencies() {
    if [ -f "package.json" ]; then
        # Vérifier Next.js
        if grep -q "next" package.json; then
            add_check_result "nextjs_project" "PASS" "Projet Next.js détecté" ""
        else
            add_check_result "nextjs_project" "WARN" "Next.js non détecté dans package.json" "Vérifier le type de projet"
        fi
        
        # Vérifier TypeScript dans les dépendances
        if grep -q "typescript" package.json; then
            add_check_result "typescript_dependency" "PASS" "TypeScript configuré dans les dépendances" ""
        else
            add_check_result "typescript_dependency" "WARN" "TypeScript non trouvé dans package.json" "Ajouter TypeScript aux dépendances"
        fi
    else
        add_check_result "package_json" "FAIL" "package.json non trouvé" "Projet npm/Node.js requis"
    fi
}

# Vérification 12: Configuration TypeScript
check_tsconfig() {
    if [ -f "tsconfig.json" ]; then
        # Vérifier la configuration des alias de chemins
        if grep -q "paths" tsconfig.json; then
            add_check_result "typescript_paths" "PASS" "Configuration des chemins TypeScript détectée" ""
        else
            add_check_result "typescript_paths" "WARN" "Pas de configuration de chemins dans tsconfig.json" "Recommandé pour les nouveaux alias @/types/*"
        fi
    else
        add_check_result "tsconfig_exists" "FAIL" "tsconfig.json non trouvé" "Configuration TypeScript requise"
    fi
}

echo ""
echo "🔍 PHASE 5: Recommandations et préparation"
echo "=========================================="

# Génération des recommandations basées sur les résultats
generate_recommendations() {
    local recommendations=()
    
    # Recommandations basées sur les échecs
    if [ $FAILED_CHECKS -gt 0 ]; then
        recommendations+=("🚨 CRITIQUE: Corriger les $FAILED_CHECKS échecs avant de continuer")
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        recommendations+=("⚠️ Examiner les $WARNINGS avertissements pour optimiser la migration")
    fi
    
    # Recommandations spécifiques
    if ! command -v jq >/dev/null 2>&1; then
        recommendations+=("📦 Installer jq: sudo apt install jq (Ubuntu) ou brew install jq (macOS)")
    fi
    
    if ! npx tsc --noEmit >/dev/null 2>&1; then
        recommendations+=("🔧 Corriger les erreurs TypeScript avant la migration")
    fi
    
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        recommendations+=("📚 Initialiser git pour le versioning: git init")
    fi
    
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        recommendations+=("💾 Commiter les modifications: git add . && git commit -m 'Pre-migration state'")
    fi
    
    # Recommandations générales
    recommendations+=("🎯 Créer une branche de migration: git checkout -b migration/algorithm-lab-types")
    recommendations+=("📋 Exécuter l'audit complet: ./migration/scripts/audit-algorithmlab-types.sh")
    recommendations+=("🤖 Générer les règles intelligentes: ./migration/scripts/generate-intelligent-rules.sh")
    
    # Ajouter les recommandations au rapport JSON
    local temp_file=$(mktemp)
    local recommendations_json=$(printf '%s\n' "${recommendations[@]}" | jq -R . | jq -s .)
    jq ".recommendations = $recommendations_json" "$VALIDATION_REPORT" > "$temp_file" && mv "$temp_file" "$VALIDATION_REPORT"
    
    echo "💡 Recommandations générées:" | tee -a "$VALIDATION_LOG"
    for rec in "${recommendations[@]}"; do
        echo "   $rec" | tee -a "$VALIDATION_LOG"
    done
}

# Finalisation du rapport
finalize_report() {
    local overall_status="READY"
    
    if [ $FAILED_CHECKS -gt 0 ]; then
        overall_status="NOT_READY"
    elif [ $WARNINGS -gt 3 ]; then
        overall_status="READY_WITH_WARNINGS"
    fi
    
    # Mettre à jour le rapport final
    local temp_file=$(mktemp)
    jq ".validation_metadata.timestamp = \"$(date -Iseconds)\" |
        .validation_metadata.project_root = \"$PROJECT_ROOT\" |
        .summary.total_checks = $TOTAL_CHECKS |
        .summary.passed_checks = $PASSED_CHECKS |
        .summary.failed_checks = $FAILED_CHECKS |
        .summary.warnings = $WARNINGS |
        .summary.overall_status = \"$overall_status\"" "$VALIDATION_REPORT" > "$temp_file" && mv "$temp_file" "$VALIDATION_REPORT"
}

# =================================================================
# EXÉCUTION DE TOUTES LES VÉRIFICATIONS
# =================================================================

echo "🚀 Démarrage des vérifications..."

# Phase 1: Prérequis
check_nodejs
check_typescript
check_jq
check_git

# Phase 2: État du projet
check_current_compilation
check_src_structure
check_algorithm_lab_types
check_existing_imports

# Phase 3: Scripts de migration
check_migration_scripts
check_disk_space

# Phase 4: Dépendances
check_dependencies
check_tsconfig

# Phase 5: Recommandations
generate_recommendations
finalize_report

# =================================================================
# RAPPORT FINAL
# =================================================================

echo ""
echo "📊 RAPPORT FINAL DE VALIDATION"
echo "=============================="

local overall_status=$(jq -r '.summary.overall_status' "$VALIDATION_REPORT")

case "$overall_status" in
    "READY")
        echo "✅ STATUT: PRÊT POUR LA MIGRATION"
        echo "🎯 Le projet est prêt pour la migration AlgorithmLab"
        ;;
    "READY_WITH_WARNINGS")
        echo "⚠️ STATUT: PRÊT AVEC AVERTISSEMENTS"
        echo "🎯 Migration possible mais optimisations recommandées"
        ;;
    "NOT_READY")
        echo "❌ STATUT: NON PRÊT"
        echo "🚨 Corriger les problèmes critiques avant de continuer"
        ;;
esac

echo ""
echo "📊 Résumé des vérifications:"
echo "   ✅ Réussies: $PASSED_CHECKS/$TOTAL_CHECKS"
echo "   ❌ Échecs: $FAILED_CHECKS/$TOTAL_CHECKS"
echo "   ⚠️ Avertissements: $WARNINGS"

echo ""
echo "📁 Fichiers générés:"
echo "   📊 Rapport JSON: $VALIDATION_REPORT"
echo "   📝 Log détaillé: $VALIDATION_LOG"

if [ "$overall_status" = "READY" ] || [ "$overall_status" = "READY_WITH_WARNINGS" ]; then
    echo ""
    echo "🚀 PROCHAINES ÉTAPES RECOMMANDÉES:"
    echo "=================================="
    echo "1. 🔍 Audit complet:"
    echo "   ./migration/scripts/audit-algorithmlab-types.sh"
    echo ""
    echo "2. 🤖 Génération des règles intelligentes:"
    echo "   ./migration/scripts/generate-intelligent-rules.sh"
    echo ""
    echo "3. 🏗️ Génération de la nouvelle architecture:"
    echo "   ./migration/scripts/generate-new-types.sh"
    echo ""
    echo "4. 🔄 Transformation des imports:"
    echo "   ./migration/scripts/transform-imports.sh"
    echo ""
    echo "⏱️ Durée estimée totale: 2h30-3h30"
    echo "📚 Documentation complète dans migration/audit/"
else
    echo ""
    echo "🔧 ACTIONS REQUISES AVANT LA MIGRATION:"
    echo "======================================"
    echo "Consultez les recommandations dans $VALIDATION_REPORT"
    echo "Corrigez les problèmes critiques et relancez la validation"
fi

echo ""
echo "✅ VALIDATION TERMINÉE"

# Code de sortie basé sur le statut
case "$overall_status" in
    "READY") exit 0 ;;
    "READY_WITH_WARNINGS") exit 0 ;;
    "NOT_READY") exit 1 ;;
esac
