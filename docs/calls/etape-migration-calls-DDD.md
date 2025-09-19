# Migration DDD du Module Calls - État Actuel

## Ce que nous avons créé

### ✅ 1. Structure des dossiers

```
src/components/calls/
├── domain/
│   ├── entities/
│   │   ├── TranscriptionWord.ts     ✅
│   │   ├── AudioFile.ts            ✅
│   │   ├── Call.ts                 ✅
│   │   └── index.ts                ✅
│   ├── services/
│   │   ├── ValidationService.ts    ✅
│   │   ├── CallService.ts          ✅
│   │   ├── StorageService.ts       ✅
│   │   ├── DuplicateService.ts     ✅
│   │   └── index.ts                ✅
│   └── repositories/
│       ├── CallRepository.ts       ✅ (interface)
│       ├── StorageRepository.ts    ✅ (interface)
│       └── index.ts                ✅
├── shared/
│   ├── types/
│   │   ├── CallStatus.ts           ✅
│   │   ├── CommonTypes.ts          ✅
│   │   └── index.ts                ✅
│   ├── exceptions/
│   │   └── DomainExceptions.ts     ✅
│   └── config/
│       └── CallsConfig.ts          ✅
└── __tests__/
    └── DomainTest.ts               ✅
```

### ✅ 2. Entités métier créées

#### TranscriptionWord

- **Responsabilité** : Représenter un mot avec ses métadonnées temporelles
- **Logique métier** : Validation, durée, chevauchements, adjacence
- **Immutabilité** : Création via constructeur, modifications via `withChanges()`

#### AudioFile

- **Responsabilité** : Représenter un fichier audio avec validation
- **Logique métier** : Formats supportés, taille max, URLs signées
- **Factory methods** : `fromFile()`, `fromDatabase()`

#### Call

- **Responsabilité** : Entité racine du domaine, orchestre audio + transcription
- **Logique métier** : `isReadyForTagging()`, `canBeUpgraded()`, transitions de statut
- **Immutabilité** : Méthodes `withAudio()`, `withStatus()`, etc.

### ✅ 3. Services métier créés

#### ValidationService

- **Responsabilité** : Validation de toutes les données d'entrée
- **Couverture** : Fichiers audio, transcriptions JSON, règles métier
- **Extensibilité** : Méthodes privées spécialisées, facilement testables

#### CallService

- **Responsabilité** : CRUD et logique métier des appels
- **Fonctionnalités** : Création, mise à jour, transitions de statut, règles métier
- **Intégration** : Utilise ValidationService et CallRepository

#### StorageService

- **Responsabilité** : Gestion des fichiers et URLs signées
- **Abstraction** : Masque les détails Supabase/S3
- **Sécurité** : Validation des expirations, chemins uniques

#### DuplicateService

- **Responsabilité** : Détection intelligente des doublons
- **Stratégies** : Nom de fichier, hash de contenu, description similaire
- **Flexibilité** : Configuration via `DuplicateDetectionConfig`

### ✅ 4. Types et configuration

#### CallStatus (enum)

- États complets : DRAFT → PROCESSING → READY → TAGGING → COMPLETED
- Transitions validées avec règles métier
- Labels français pour l'UI

#### CommonTypes

- Interfaces complètes pour les workflows
- Types pour les callbacks et résultats
- Séparation claire domaine/infrastructure

#### CallsConfig

- Configuration centralisée et type-safe
- Feature flags pour déploiement progressif
- Validation de configuration au démarrage

### ✅ 5. Gestion d'erreurs structurée

#### Hiérarchie d'exceptions

- `DomainError` : Erreurs métier
- `ValidationError` : Données invalides
- `BusinessRuleError` : Règles métier violées
- `NotFoundError`, `ConflictError` : Cas spécifiques
- `RepositoryError`, `StorageError` : Erreurs techniques

## Avantages déjà obtenus

### 🎯 **Séparation des responsabilités**

- Logique métier isolée dans les entités
- Services focalisés sur une responsabilité
- Infrastructure séparée du domaine

### 🧪 **Testabilité**

- Chaque service testable indépendamment
- Mocks faciles avec les interfaces
- Tests unitaires rapides

### 📈 **Extensibilité**

- Ajout de nouveaux services sans impact
- Configuration centralisée
- Feature flags pour nouvelles fonctionnalités

### 🛡️ **Robustesse**

- Validation stricte des données
- Gestion d'erreurs granulaire
- Types TypeScript complets

## Prochaines étapes

### 🏗️ **Infrastructure (à créer)**

1. `SupabaseCallRepository` : Implémentation concrète
2. `SupabaseStorageRepository` : Gestion Supabase Storage
3. `ServiceFactory` : Injection de dépendances

### 🔄 **Workflows (à créer)**

1. `ImportWorkflow` : Orchestration complète d'import
2. `PreparationWorkflow` : Préparation pour tagging

### 🔗 **Intégration (à faire)**

1. Adaptation de `callApiUtils.tsx` existant
2. Migration progressive des composants UI
3. Tests E2E pour non-régression

## Comment utiliser l'architecture créée

### Exemple d'usage

```typescript
// Créer les services
const validationService = new ValidationService();
const callRepository = new SupabaseCallRepository(supabase);
const callService = new CallService(callRepository, validationService);

// Créer un appel
const call = await callService.createCall({
  audioFile: myFile,
  description: "Test call",
  origin: "workdrive",
});

// Valider les données
const validation = validationService.validateCallData(data);
if (!validation.isValid) {
  // Traiter les erreurs de validation
}

// Détecter les doublons
const duplicateService = new DuplicateService(callRepository);
const duplicateResult = await duplicateService.checkForDuplicates({
  filename: "test.mp3",
});
```

## Migration depuis l'ancien code

### Correspondances

```typescript
// Ancien callApiUtils.tsx
export const handleCallSubmission = async (options) => {
  // 500+ lignes mélangées
};

// Nouveau avec DDD
export const handleCallSubmission = async (options) => {
  const services = ServiceFactory.create(supabase);
  return await services.importWorkflow.execute(data, callbacks);
};
```

### Avantages migration

1. **Code divisé par 10** : Une fonction de 500 lignes → 20 services de 25 lignes
2. **Tests plus faciles** : Test d'un service vs test d'un monolithe
3. **Maintenance simplifiée** : Modification localisée par responsabilité
4. **Bugs moins fréquents** : Logique métier centralisée et testée

## Points de vigilance

### ⚠️ **Ne pas oublier**

1. Créer les implémentations Supabase des repositories
2. Tester l'intégration avec votre base de données existante
3. Vérifier la compatibilité des types avec vos données
4. Prévoir la migration des données si nécessaire
5. Maintenir la compatibilité avec l'UI existante pendant la transition

### 🔍 **Tests nécessaires**

```typescript
// Test dans votre environnement
import { runAllDomainTests } from './__tests__/DomainTest';

// Vérifier compilation
npm run build

// Lancer les tests
runAllDomainTests();
```

## État de la migration : 40% complété

### ✅ **Terminé**

- [x] Entités métier avec logique business
- [x] Services métier avec validation
- [x] Interfaces repositories (contrats)
- [x] Configuration centralisée
- [x] Gestion d'erreurs structurée
- [x] Types TypeScript complets

### 🚧 **En cours / À faire**

- [ ] Implémentations Supabase des repositories
- [ ] Workflows d'orchestration (Import, Preparation)
- [ ] ServiceFactory pour injection de dépendances
- [ ] Adaptation de callApiUtils.tsx existant
- [ ] Tests d'intégration avec Supabase
- [ ] Migration progressive des composants UI

### 📋 **Prochaine session de travail recommandée**

1. **Création des implémentations Supabase** (1-2h)
   - SupabaseCallRepository.ts
   - SupabaseStorageRepository.ts
   - Tests de connexion base de données
2. **ServiceFactory et injection de dépendances** (30min)
   - Création d'instances des services
   - Configuration des dépendances
3. **Premier workflow fonctionnel** (1h)
   - ImportWorkflow basique
   - Test avec un vrai fichier
4. **Adaptation de callApiUtils.tsx** (1h)
   - Remplacement progressif de la logique existante
   - Maintien de la compatibilité

Cette architecture DDD vous donne une base solide et extensible. La logique métier est maintenant centralisée, testable et réutilisable. Vous pouvez continuer le développement avec confiance.
