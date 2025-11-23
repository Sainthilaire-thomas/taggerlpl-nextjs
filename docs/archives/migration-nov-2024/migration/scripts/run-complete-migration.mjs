#!/usr/bin/env node
// run-complete-migration.mjs
// Orchestrateur principal de la migration AlgorithmLab

import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

console.log("🚀 MIGRATION COMPLÈTE ALGORITHMLAB");
console.log("==================================");
console.log("Migration vers point d'entrée unifié: @/app/(protected)/analysis/components/AlgorithmLab/types");

const PROJECT_ROOT = process.cwd();
const SCRIPTS_DIR = path.join(PROJECT_ROOT, "migration", "scripts");

// Configuration de la migration
const MIGRATION_CONFIG = {
  target_entry_point: "@/app/(protected)/analysis/components/AlgorithmLab/types",
  backup_enabled: true,
  validation_strict: true,
  cleanup_legacy: false, // Sécurité: ne pas supprimer automatiquement
  
  steps: [
    {
      id: "analyze",
      name: "Analyse des types manquants",
      script: "1-analyze-missing-types.mjs",
      required: true,
      timeout: 60000
    },
    {
      id: "enrich",
      name: "Enrichissement structure cible",
      script: "2-enrich-target-structure.mjs", 
      required: true,
      timeout: 120000
    },
    {
      id: "transform",
      name: "Transformation des imports",
      script: "3-transform-imports.mjs",
      required: true,
      timeout: 180000
    },
    {
      id: "validate",
      name: "Validation finale",
      script: "4-validate-migration.mjs",
      required: false,
      timeout: 120000
    }
  ]
};

async function runCompleteMigration() {
  console.log("📋 Configuration de la migration:");
  console.log(`   🎯 Point d'entrée: ${MIGRATION_CONFIG.target_entry_point}`);
  console.log(`   📝 Étapes: ${MIGRATION_CONFIG.steps.length}`);
  console.log(`   💾 Sauvegarde: ${MIGRATION_CONFIG.backup_enabled ? 'Activée' : 'Désactivée'}`);
  
  const migrationResults = {
    started_at: new Date().toISOString(),
    config: MIGRATION_CONFIG,
    steps_results: [],
    overall_success: false,
    backup_info: null,
    final_status: ""
  };
  
  try {
    // Étape 0: Sauvegarde de sécurité
    if (MIGRATION_CONFIG.backup_enabled) {
      console.log("\n💾 Création de la sauvegarde de sécurité...");
      migrationResults.backup_info = await createSecurityBackup();
    }
    
    // Exécuter chaque étape
    for (const step of MIGRATION_CONFIG.steps) {
      console.log(`\n🔄 Étape ${step.id}: ${step.name}`);
      console.log(`   📝 Script: ${step.script}`);
      
      const stepResult = await executeStep(step);
      migrationResults.steps_results.push(stepResult);
      
      if (stepResult.success) {
        console.log(`   ✅ ${step.name} terminée avec succès`);
      } else {
        console.log(`   ❌ ${step.name} échouée: ${stepResult.error}`);
        
        if (step.required) {
          console.log("   🛑 Arrêt de la migration (étape requise échouée)");
          migrationResults.final_status = `FAILED_AT_${step.id.toUpperCase()}`;
          break;
        } else {
          console.log("   ⚠️ Poursuite de la migration (étape optionnelle)");
        }
      }
    }
    
    // Évaluer le succès global
    const requiredStepsSuccess = migrationResults.steps_results
      .filter((result, index) => MIGRATION_CONFIG.steps[index].required)
      .every(result => result.success);
    
    migrationResults.overall_success = requiredStepsSuccess;
    
    if (migrationResults.overall_success) {
      migrationResults.final_status = "SUCCESS";
      console.log("\n🎉 MIGRATION RÉUSSIE !");
    } else {
      migrationResults.final_status = migrationResults.final_status || "PARTIAL_SUCCESS";
      console.log("\n⚠️ MIGRATION PARTIELLEMENT RÉUSSIE");
    }
    
  } catch (error) {
    console.error(`\n❌ ERREUR CRITIQUE: ${error.message}`);
    migrationResults.final_status = "CRITICAL_ERROR";
    migrationResults.critical_error = error.message;
  }
  
  // Sauvegarder le rapport final
  await saveMigrationReport(migrationResults);
  
  // Afficher le résumé
  displayFinalSummary(migrationResults);
  
  return migrationResults;
}

async function createSecurityBackup() {
  const backupInfo = {
    created_at: new Date().toISOString(),
    backup_path: "",
    files_backed_up: 0,
    success: false
  };
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(PROJECT_ROOT, "migration", "backups", `backup-${timestamp}`);
    
    await fs.mkdir(backupDir, { recursive: true });
    
    // Sauvegarder le répertoire types complet
    const typesDir = path.join(
      PROJECT_ROOT,
      "src/app/(protected)/analysis/components/AlgorithmLab/types"
    );
    
    const backupTypesDir = path.join(backupDir, "types");
    await copyDirectory(typesDir, backupTypesDir);
    
    // Compter les fichiers sauvegardés
    backupInfo.files_backed_up = await countFilesRecursive(backupTypesDir);
    backupInfo.backup_path = backupDir;
    backupInfo.success = true;
    
    console.log(`   ✅ Sauvegarde créée: ${backupInfo.files_backed_up} fichiers dans ${backupDir}`);
    
  } catch (error) {
    console.log(`   ⚠️ Échec sauvegarde: ${error.message}`);
    backupInfo.error = error.message;
  }
  
  return backupInfo;
}

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function countFilesRecursive(dir) {
  let count = 0;
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        count += await countFilesRecursive(path.join(dir, entry.name));
      } else {
        count++;
      }
    }
  } catch (error) {
    // Ignorer les erreurs
  }
  
  return count;
}

async function executeStep(step) {
  const stepResult = {
    step_id: step.id,
    script: step.script,
    started_at: new Date().toISOString(),
    success: false,
    output: "",
    error: "",
    duration: 0
  };
  
  const startTime = Date.now();
  
  try {
    const scriptPath = path.join(SCRIPTS_DIR, step.script);
    
    // Vérifier que le script existe
    await fs.access(scriptPath);
    
    // Exécuter le script
    const output = await runScript(scriptPath, step.timeout);
    
    stepResult.success = true;
    stepResult.output = output;
    stepResult.duration = Date.now() - startTime;
    
  } catch (error) {
    stepResult.success = false;
    stepResult.error = error.message;
    stepResult.duration = Date.now() - startTime;
  }
  
  return stepResult;
}

function runScript(scriptPath, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath], {
      cwd: PROJECT_ROOT,
      stdio: 'pipe'
    });
    
    let output = '';
    let error = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data); // Afficher en temps réel
    });
    
    child.stderr.on('data', (data) => {
      error += data.toString();
      process.stderr.write(data); // Afficher en temps réel
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Script exited with code ${code}. Error: ${error}`));
      }
    });
    
    child.on('error', (err) => {
      reject(new Error(`Failed to start script: ${err.message}`));
    });
    
    // Timeout
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Script timeout after ${timeout}ms`));
    }, timeout);
    
    child.on('exit', () => {
      clearTimeout(timer);
    });
  });
}

async function saveMigrationReport(results) {
  const reportPath = path.join(
    PROJECT_ROOT,
    "migration", "audit", "complete-migration-report.json"
  );
  
  try {
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\n📊 Rapport complet sauvegardé: ${reportPath}`);
  } catch (error) {
    console.log(`⚠️ Impossible de sauvegarder le rapport: ${error.message}`);
  }
}

function displayFinalSummary(results) {
  console.log("\n" + "=".repeat(50));
  console.log("📊 RÉSUMÉ DE LA MIGRATION ALGORITHMLAB");
  console.log("=".repeat(50));
  
  console.log(`🎯 Statut final: ${results.final_status}`);
  console.log(`⏱️ Durée totale: ${Math.round((Date.now() - new Date(results.started_at).getTime()) / 1000)}s`);
  
  if (results.backup_info && results.backup_info.success) {
    console.log(`💾 Sauvegarde: ${results.backup_info.files_backed_up} fichiers sauvegardés`);
  }
  
  console.log("\n📋 Résultats par étape:");
  results.steps_results.forEach((stepResult, index) => {
    const step = MIGRATION_CONFIG.steps[index];
    const status = stepResult.success ? "✅ SUCCÈS" : "❌ ÉCHEC";
    const duration = stepResult.duration ? `(${Math.round(stepResult.duration / 1000)}s)` : "";
    
    console.log(`   ${status} ${step.name} ${duration}`);
    if (!stepResult.success && stepResult.error) {
      console.log(`      Erreur: ${stepResult.error.slice(0, 100)}...`);
    }
  });
  
  console.log("\n🎯 PROCHAINES ÉTAPES:");
  
  if (results.final_status === "SUCCESS") {
    console.log("   ✅ Migration terminée avec succès");
    console.log("   📚 Mettre à jour la documentation si nécessaire");
    console.log("   🧹 Considérer le nettoyage des fichiers legacy (manuel)");
    console.log("   🚀 Tester l'application pour vérifier le bon fonctionnement");
  } else if (results.final_status.startsWith
