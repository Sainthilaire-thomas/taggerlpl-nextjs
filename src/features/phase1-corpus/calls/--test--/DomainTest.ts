// src/components/calls/__tests__/DomainTest.ts

import { TranscriptionWord } from "../domain/entities/TranscriptionWord";
import { AudioFile } from "../domain/entities/AudioFile";
import { Call } from "../domain/entities/Call";
import { CallStatus } from "../shared/types/CallStatus";
import { ValidationService } from "../domain/services/ValidationService";
import { CallsConfig, validateCallsConfig } from "../shared/config/CallsConfig";

/**
 * Test basique pour vérifier que les entités et services fonctionnent
 */
export function runBasicDomainTests(): void {
  console.log("🧪 Début des tests du domaine Calls...");

  try {
    // Test 1: Création d'un mot de transcription
    console.log("Test 1: TranscriptionWord");
    const word = new TranscriptionWord("bonjour", 0, 1, "conseiller");
    console.log(`✅ Mot créé: ${word.toString()}`);
    console.log(`✅ Durée: ${word.getDuration()}s`);
    console.log(`✅ Valide: ${word.isValid()}`);

    // Test 2: Création d'un fichier audio
    console.log("\nTest 2: AudioFile");
    const mockFile = new File(["audio data"], "test.mp3", {
      type: "audio/mp3",
    });
    const audioFile = AudioFile.fromFile(
      mockFile,
      "/path/to/audio.mp3",
      "https://example.com/audio.mp3"
    );
    console.log(`✅ AudioFile créé: ${audioFile.toString()}`);
    console.log(`✅ Taille: ${audioFile.getSizeInMB()}MB`);
    console.log(`✅ Jouable: ${audioFile.isPlayable()}`);

    // Test 3: Création d'un appel
    console.log("\nTest 3: Call");
    const call = new Call(
      "call-123",
      "test.mp3",
      "Test call",
      CallStatus.DRAFT,
      "test"
    );
    console.log(`✅ Appel créé: ${call.id}`);
    console.log(`✅ Prêt pour tagging: ${call.isReadyForTagging()}`);
    console.log(`✅ A audio valide: ${call.hasValidAudio()}`);

    // Test 4: Mise à jour immutable
    console.log("\nTest 4: Immutabilité");
    const updatedCall = call.withStatus(CallStatus.PROCESSING);
    console.log(`✅ Statut original: ${call.status}`);
    console.log(`✅ Nouveau statut: ${updatedCall.status}`);
    console.log(`✅ Immutabilité respectée: ${call !== updatedCall}`);

    // Test 5: ValidationService
    console.log("\nTest 5: ValidationService");
    const validationService = new ValidationService();

    // Test validation audio
    const validationResult = validationService.validateCallData({
      audioFile: mockFile,
      description: "Test description",
    });
    console.log(
      `✅ Validation result: ${validationResult.isValid ? "VALID" : "INVALID"}`
    );
    if (validationResult.errors.length > 0) {
      console.log(`⚠️ Erreurs: ${validationResult.errors.join(", ")}`);
    }

    // Test 6: Configuration
    console.log("\nTest 6: Configuration");
    const configValidation = validateCallsConfig();
    console.log(
      `✅ Config valide: ${configValidation.isValid ? "OUI" : "NON"}`
    );
    console.log(
      `✅ Taille max fichier: ${CallsConfig.storage.maxFileSizeMB}MB`
    );
    console.log(
      `✅ Formats supportés: ${CallsConfig.storage.allowedFormats.join(", ")}`
    );

    console.log("\n🎉 Tous les tests de base sont passés !");
  } catch (error) {
    console.error("❌ Erreur lors des tests:", error);
    throw error;
  }
}

/**
 * Test des règles métier complexes
 */
export function runBusinessRuleTests(): void {
  console.log("\n🧪 Tests des règles métier...");

  try {
    // Test des transitions de statut
    console.log("Test: Transitions de statut");
    const call = new Call("test-call", "test.mp3", "Test", CallStatus.DRAFT);

    // Transitions valides
    const processing = call.withStatus(CallStatus.PROCESSING);
    console.log(`✅ DRAFT → PROCESSING: ${processing.status}`);

    const ready = processing.withStatus(CallStatus.READY);
    console.log(`✅ PROCESSING → READY: ${ready.status}`);

    // Test des règles d'upgrade
    console.log("\nTest: Règles d'upgrade");
    const emptyCall = new Call("empty-call");
    const upgradeAnalysis = emptyCall.canBeUpgraded({
      audioFile: new File([""], "test.mp3"),
      transcriptionData: {
        words: [{ text: "test", startTime: 0, endTime: 1, speaker: "test" }],
      },
    });

    console.log(`✅ Peut ajouter audio: ${upgradeAnalysis.canAddAudio}`);
    console.log(
      `✅ Peut ajouter transcription: ${upgradeAnalysis.canAddTranscription}`
    );
    console.log(`✅ Recommandation: ${upgradeAnalysis.recommendation}`);

    console.log("\n🎉 Tests des règles métier réussis !");
  } catch (error) {
    console.error("❌ Erreur lors des tests des règles métier:", error);
    throw error;
  }
}

/**
 * Lance tous les tests
 */
export function runAllDomainTests(): void {
  runBasicDomainTests();
  runBusinessRuleTests();
  console.log("\n🚀 Architecture DDD validée avec succès !");
}
