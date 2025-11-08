# Proposition de restructuration TaggerLPL

## 🎯 Objectifs
1. Séparer clairement navigation (app/) et logique métier (features/)
2. Garder les composants UI réutilisables dans components/
3. Éliminer les fichiers obsolètes
4. Améliorer la découvrabilité du code

---

## 📁 Nouvelle structure proposée

```
src/
├── app/                                    # Navigation et routes Next.js
│   ├── (protected)/
│   │   ├── calls/                         # 🔄 DÉPLACER depuis components/calls/
│   │   │   ├── import/
│   │   │   │   └── page.tsx              # CallImportPage
│   │   │   ├── management/
│   │   │   │   └── page.tsx              # CallManagementPage
│   │   │   └── layout.tsx
│   │   │
│   │   ├── transcription/                 # 🔄 DÉPLACER depuis components/TranscriptLPL/
│   │   │   ├── [callId]/
│   │   │   │   └── page.tsx              # TaggerLPL
│   │   │   └── layout.tsx
│   │   │
│   │   ├── analysis/                      # ✅ GARDER mais réorganiser
│   │   │   ├── tags/
│   │   │   │   └── page.tsx              # TagAnalysisGraph, TagAnalysisReport
│   │   │   └── page.tsx
│   │   │
│   │   ├── algorithm-lab/                 # 🔄 DÉPLACER depuis analysis/components/AlgorithmLab/
│   │   │   ├── level0/
│   │   │   │   └── page.tsx
│   │   │   ├── level1/
│   │   │   │   └── page.tsx
│   │   │   ├── level2/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   └── workdrive/                     # 🔄 DÉPLACER depuis components/SimpleWorkdriveExplorer/
│   │       └── page.tsx
│   │
│   └── layout/
│       └── GlobalNavbar.tsx               # ✅ GARDER
│
├── features/                               # 🆕 NOUVEAU - Logique métier par feature
│   ├── calls/                             # DDD architecture
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   └── workflows/
│   │   ├── infrastructure/
│   │   │   ├── api/
│   │   │   ├── asr/
│   │   │   ├── diarization/
│   │   │   └── supabase/
│   │   ├── ui/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   └── sections/
│   │   └── shared/
│   │
│   ├── transcription/
│   │   ├── hooks/
│   │   │   ├── useTaggingLogic.tsx
│   │   │   ├── useTranscriptAudio.tsx
│   │   │   └── useRelationStatus.ts
│   │   ├── components/
│   │   │   ├── TranscriptText.tsx
│   │   │   ├── TranscriptHeader.tsx
│   │   │   ├── TranscriptControls.tsx
│   │   │   ├── TranscriptAudioPlayer.tsx
│   │   │   └── TagSidePanel.tsx
│   │   └── types.tsx
│   │
│   ├── workdrive/
│   │   ├── components/
│   │   │   ├── AuthPrompt.tsx
│   │   │   ├── FileList.tsx
│   │   │   ├── NavigationControls.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── hooks/
│   │   │   ├── useWorkdriveFiles.tsx
│   │   │   ├── useWorkdriveSearch.tsx
│   │   │   └── useWorkdriveDuplicateCheck.ts
│   │   └── utils/
│   │
│   └── algorithm-lab/                      # Module AlgorithmLab
│       ├── algorithms/
│       │   └── level1/
│       │       ├── clientclassifiers/
│       │       ├── conseillerclassifiers/
│       │       ├── M1Algorithms/
│       │       ├── M2Algorithms/
│       │       ├── M3Algorithms/
│       │       └── shared/
│       ├── components/
│       │   ├── level0/
│       │   ├── level1/
│       │   ├── level2/
│       │   └── shared/
│       ├── hooks/
│       ├── types/
│       └── utils/
│
├── components/                             # Composants UI réutilisables UNIQUEMENT
│   ├── ui/                                # 🆕 Composants de base
│   │   ├── Button/
│   │   ├── Dialog/
│   │   ├── Input/
│   │   └── Table/
│   │
│   ├── layout/                            # Composants de layout
│   │   ├── DeleteConfirmationDialog.tsx
│   │   └── SnackBarManager.tsx
│   │
│   ├── auth/                              # Composants d'authentification
│   │   ├── AuthButton.tsx
│   │   └── AuthStatus.tsx
│   │
│   └── filters/                           # Composants de filtrage
│       └── FilterInput.tsx
│
├── context/                                # ✅ GARDER tel quel
│   ├── SupabaseContext.tsx
│   ├── TaggingDataContext.tsx
│   ├── ThemeContext.tsx
│   └── ZohoContext.tsx
│
├── lib/                                    # ✅ GARDER tel quel
│   ├── config/
│   └── supabaseClient.tsx
│
├── types/                                  # ✅ GARDER mais enrichir
│   ├── common.tsx
│   ├── calls.ts                           # 🆕 Types pour calls
│   ├── transcription.ts                   # 🆕 Types pour transcription
│   └── algorithm-lab.ts                   # 🆕 Types pour algorithm-lab
│
└── utils/                                  # 🆕 NOUVEAU - Utils globaux
    ├── api/
    │   └── callApiUtils.tsx
    ├── validation/
    │   ├── validateTranscriptionJSON.ts
    │   └── callTypeGuards.ts
    └── transforms/
        └── transcriptionProcessor.tsx
```

---

## 🔄 Plan de migration étape par étape

### Phase 1 : Nettoyage (1-2h)
1. ✅ Supprimer fichiers obsolètes
   - `CallManagementPage copy.tsx`
   - `SimpleWorkdriveExplorer_old.tsx`
   - `CallTableList_old.tsx`
   - `supabaseClient_old.tsx`

### Phase 2 : Créer structure features/ (2-3h)
2. ✅ Créer `src/features/calls/`
   - Déplacer tout le contenu de `src/components/calls/`
   - Mettre à jour les imports dans les fichiers

3. ✅ Créer `src/features/transcription/`
   - Déplacer `TranscriptLPL/` depuis components
   - Restructurer en hooks/components/types

4. ✅ Créer `src/features/workdrive/`
   - Déplacer `SimpleWorkdriveExplorer/`

5. ✅ Créer `src/features/algorithm-lab/`
   - Déplacer depuis `app/(protected)/analysis/components/AlgorithmLab/`

### Phase 3 : Réorganiser app/ (2-3h)
6. ✅ Créer routes dans app/
   - `app/(protected)/calls/` avec pages import et management
   - `app/(protected)/transcription/[callId]/` pour TaggerLPL
   - `app/(protected)/algorithm-lab/` avec level0/level1/level2

### Phase 4 : Nettoyer components/ (1-2h)
7. ✅ Garder uniquement composants réutilisables
   - Créer `components/ui/` pour composants de base
   - Organiser par catégorie (auth, layout, filters)

8. ✅ Déplacer utils globaux
   - Créer `src/utils/` pour fonctions partagées
   - Réorganiser par domaine (api, validation, transforms)

### Phase 5 : Vérification (1h)
9. ✅ Vérifier tous les imports
10. ✅ Tester la compilation TypeScript
11. ✅ Tester les pages principales

---

## 📊 Comparaison avant/après

### AVANT (structure actuelle)
```
src/components/
├── calls/                  ❌ Feature complète dans components
├── SimpleWorkdriveExplorer/ ❌ Feature complète
├── TranscriptLPL/          ❌ Feature complète
├── TaggerLPL.tsx           ❌ Page dans components
├── CallUploaderTaggerLPL.tsx ❌ Page dans components
├── ArrivalTable.tsx        ❌ Composant de page spécifique
├── TagAnalysisGraph.tsx    ❌ Page d'analyse
└── ... 20+ autres fichiers mélangés
```

### APRÈS (structure proposée)
```
src/
├── app/                    ✅ Routes et navigation
├── features/               ✅ Logique métier isolée
├── components/             ✅ Composants UI réutilisables uniquement
├── context/                ✅ Contextes globaux
├── lib/                    ✅ Configuration
├── types/                  ✅ Types partagés
└── utils/                  ✅ Fonctions utilitaires
```

---

## 🎁 Bénéfices attendus

1. **Clarté mentale**
   - Savoir où chercher chaque type de code
   - Séparation navigation vs logique métier

2. **Maintenabilité**
   - Modifications isolées par feature
   - Moins de risques de casser autre chose

3. **Réutilisabilité**
   - Composants UI vraiment réutilisables
   - Features auto-contenues

4. **Onboarding**
   - Nouveaux développeurs comprennent vite
   - Structure intuitive

5. **Scalabilité**
   - Facile d'ajouter nouvelles features
   - Pas de pollution du répertoire components

---

## ⚠️ Points d'attention

1. **Migration progressive**
   - Ne pas tout casser d'un coup
   - Feature par feature avec tests

2. **Imports à vérifier**
   - Beaucoup d'imports à mettre à jour
   - Utiliser search & replace intelligent

3. **Tests à adapter**
   - Chemins des fichiers changent
   - Vérifier les mocks

4. **Documentation à jour**
   - Mettre à jour les guides dans doc/
   - Expliquer la nouvelle structure

---

## 🚀 Prochaines étapes recommandées

1. **Valider cette proposition** avec l'équipe
2. **Créer une branche** `refactor/project-structure`
3. **Commencer par Phase 1** (nettoyage) - risque faible
4. **Migrer feature par feature** en testant à chaque étape
5. **Mettre à jour la documentation** au fur et à mesure

---

## 📝 Scripts utiles à créer

```typescript
// scripts/validate-structure.ts
// Vérifie que la structure est cohérente

// scripts/update-imports.ts
// Met à jour automatiquement les imports après migration

// scripts/find-orphan-files.ts
// Trouve les fichiers non utilisés
```

---

**Estimation totale** : 8-12h de travail sur 2-3 jours
**Risque** : Moyen (beaucoup d'imports à changer)
**Impact** : Très positif à long terme
