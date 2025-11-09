# 📋 ÉTAPE 3 : PHASE 2 - ANNOTATION

**Date prévue :** Session suivante  
**Durée estimée :** 2-3h  
**Objectif :** Migrer les modules d'annotation (TranscriptLPL, tags, turns, supervision)  
**Statut :** 🔜 À VENIR  

---

## 🎯 Objectifs de l'Étape 3

Réorganiser tous les modules liés à l'**annotation manuelle** des transcriptions selon la Phase 2 du workflow de thèse :

```
PHASE 2: Annotation & Tagging
┌─────────────────────────────┐
│ • TranscriptLPL (TaggerLPL) │
│ • Tagging manuel            │
│ • Gestion tags (référentiel)│
│ • Supervision qualité       │
│ • Relations tours de parole │
└─────────────────────────────┘
```

---

## 📁 Structure cible

```
src/
├── features/phase2-annotation/          # 🆕 NOUVEAU
│   │
│   ├── transcript/                      # Module principal annotation
│   │   ├── components/
│   │   │   ├── TranscriptText.tsx
│   │   │   ├── TranscriptHeader.tsx
│   │   │   ├── TranscriptControls.tsx
│   │   │   ├── TranscriptAudioPlayer.tsx
│   │   │   └── TagSidePanel.tsx
│   │   ├── hooks/
│   │   │   ├── useTaggingLogic.tsx
│   │   │   ├── useTranscriptAudio.tsx
│   │   │   └── useRelationStatus.ts
│   │   ├── types.tsx
│   │   └── index.tsx                    # TaggerLPL principal
│   │
│   ├── tags/                            # Gestion référentiel tags
│   │   ├── domain/
│   │   │   └── services/
│   │   │       └── TagManagementService.ts
│   │   └── ui/
│   │       └── components/
│   │           ├── TagEditor.tsx
│   │           ├── TagSelector.tsx
│   │           ├── TagTreeView.tsx
│   │           └── TagStats.tsx
│   │
│   ├── turns/                           # Gestion tours de parole
│   │   ├── domain/
│   │   │   └── services/
│   │   │       └── TurnRelationsService.ts
│   │   └── ui/
│   │       └── components/
│   │           ├── TurnTagEditor.tsx
│   │           └── TurnTaggedTable.tsx
│   │
│   └── supervision/                     # Supervision qualité (TODO)
│       ├── domain/
│       │   └── services/
│       │       └── QualityControlService.ts
│       └── ui/
│           └── components/
│               └── SupervisionDashboard.tsx
│
└── app/(protected)/phase2-annotation/   # Routes
    ├── layout.tsx
    ├── transcript/
    │   ├── [callId]/
    │   │   └── page.tsx                 # TaggerLPL
    │   └── page.tsx                     # Liste appels à annoter
    ├── tags-management/
    │   └── page.tsx                     # Gestion référentiel tags
    └── supervision/
        └── page.tsx                     # Dashboard supervision
```

---

## 📋 Plan de travail détaillé

### ⏱️ Étape 3.1 : Créer structure Phase 2 (20min)

**Objectif :** Créer l'arborescence de base pour Phase 2

**Actions :**
```powershell
# 1. Créer dossier principal
New-Item -ItemType Directory -Path "src/features/phase2-annotation" -Force

# 2. Créer sous-dossiers features
New-Item -ItemType Directory -Path "src/features/phase2-annotation/transcript" -Force
New-Item -ItemType Directory -Path "src/features/phase2-annotation/tags" -Force
New-Item -ItemType Directory -Path "src/features/phase2-annotation/turns" -Force
New-Item -ItemType Directory -Path "src/features/phase2-annotation/supervision" -Force

# 3. Créer dossiers routes
New-Item -ItemType Directory -Path "src/app/(protected)/phase2-annotation" -Force
New-Item -ItemType Directory -Path "src/app/(protected)/phase2-annotation/transcript" -Force
New-Item -ItemType Directory -Path "src/app/(protected)/phase2-annotation/transcript/[callId]" -Force
New-Item -ItemType Directory -Path "src/app/(protected)/phase2-annotation/tags-management" -Force
New-Item -ItemType Directory -Path "src/app/(protected)/phase2-annotation/supervision" -Force
```

**Validation :**
- [ ] Structure créée
- [ ] Commit : `feat(phase2): create base structure for annotation phase (Step 3.1)`

---

### ⏱️ Étape 3.2 : Migrer TranscriptLPL (1h)

**Objectif :** Déplacer le module principal d'annotation

**Fichiers à migrer :**
```
src/components/TranscriptLPL/ → src/features/phase2-annotation/transcript/
```

**Actions :**
```powershell
# 1. Copier le module entier
Copy-Item -Path "src/components/TranscriptLPL/*" -Destination "src/features/phase2-annotation/transcript/" -Recurse -Force

# 2. Mettre à jour les imports dans le nouveau module
Get-ChildItem -Path "src/features/phase2-annotation/transcript" -Recurse -Include "*.ts","*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match '@/components/TranscriptLPL') {
        $newContent = $content -replace '@/components/TranscriptLPL', '@/features/phase2-annotation/transcript'
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Updated: $($_.FullName)"
    }
}

# 3. Trouver et mettre à jour les fichiers externes qui importent TranscriptLPL
Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | Select-String "@/components/TranscriptLPL" | Select-Object Path -Unique

# 4. Supprimer l'ancien répertoire
Remove-Item -Path "src/components/TranscriptLPL" -Recurse -Force -Verbose
```

**Validation :**
- [ ] Module copié avec structure préservée
- [ ] Imports mis à jour (internes + externes)
- [ ] Ancien répertoire supprimé
- [ ] Compilation TypeScript OK
- [ ] Commit : `refactor(phase2): migrate TranscriptLPL to phase2-annotation (Step 3.2)`

---

### ⏱️ Étape 3.3 : Organiser gestion des Tags (45min)

**Objectif :** Créer feature dédiée pour la gestion des tags

**Fichiers à déplacer :**
```
src/components/
├── TagEditor.tsx         → tags/ui/components/
├── TagSelector.tsx       → tags/ui/components/
├── TagTreeView.tsx       → tags/ui/components/
└── TagStats.tsx          → tags/ui/components/
```

**Actions :**
```powershell
# 1. Créer structure tags
New-Item -ItemType Directory -Path "src/features/phase2-annotation/tags/ui/components" -Force

# 2. Déplacer les composants tags
$tagFiles = @(
    "TagEditor.tsx",
    "TagSelector.tsx", 
    "TagTreeView.tsx",
    "TagStats.tsx"
)

foreach ($file in $tagFiles) {
    if (Test-Path "src/components/$file") {
        Copy-Item -Path "src/components/$file" -Destination "src/features/phase2-annotation/tags/ui/components/" -Force
        Write-Host "Copied: $file"
    }
}

# 3. Créer barrel export
$barrel = @'
export { default as TagEditor } from "./TagEditor";
export { default as TagSelector } from "./TagSelector";
export { default as TagTreeView } from "./TagTreeView";
export { default as TagStats } from "./TagStats";
'@
Set-Content -Path "src/features/phase2-annotation/tags/ui/components/index.ts" -Value $barrel

# 4. Mettre à jour les imports dans les fichiers qui utilisent ces composants
# (à adapter selon les vrais imports trouvés)
Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | Select-String "@/components/Tag" | Select-Object Path -Unique

# 5. Supprimer les anciens fichiers
foreach ($file in $tagFiles) {
    if (Test-Path "src/components/$file") {
        Remove-Item "src/components/$file" -Force -Verbose
    }
}
```

**Validation :**
- [ ] Composants tags déplacés
- [ ] Barrel export créé
- [ ] Imports mis à jour
- [ ] Anciens fichiers supprimés
- [ ] Compilation TypeScript OK
- [ ] Commit : `refactor(phase2): organize tag management feature (Step 3.3)`

---

### ⏱️ Étape 3.4 : Organiser gestion des Turns (30min)

**Objectif :** Créer feature pour les tours de parole

**Fichiers à déplacer :**
```
src/components/
├── TurnTagEditor.tsx     → turns/ui/components/
└── TurnTaggedTable.tsx   → turns/ui/components/
```

**Actions :**
```powershell
# 1. Créer structure turns
New-Item -ItemType Directory -Path "src/features/phase2-annotation/turns/ui/components" -Force

# 2. Déplacer les composants turns
$turnFiles = @(
    "TurnTagEditor.tsx",
    "TurnTaggedTable.tsx"
)

foreach ($file in $turnFiles) {
    if (Test-Path "src/components/$file") {
        Copy-Item -Path "src/components/$file" -Destination "src/features/phase2-annotation/turns/ui/components/" -Force
        Write-Host "Copied: $file"
    }
}

# 3. Créer barrel export
$barrel = @'
export { default as TurnTagEditor } from "./TurnTagEditor";
export { default as TurnTaggedTable } from "./TurnTaggedTable";
'@
Set-Content -Path "src/features/phase2-annotation/turns/ui/components/index.ts" -Value $barrel

# 4. Mettre à jour imports et supprimer anciens fichiers
```

**Validation :**
- [ ] Composants turns déplacés
- [ ] Imports mis à jour
- [ ] Compilation TypeScript OK
- [ ] Commit : `refactor(phase2): organize turn management feature (Step 3.4)`

---

### ⏱️ Étape 3.5 : Créer structure Supervision (15min)

**Objectif :** Préparer feature supervision (implémentation future)

**Actions :**
```powershell
# 1. Créer structure supervision
New-Item -ItemType Directory -Path "src/features/phase2-annotation/supervision/domain/services" -Force
New-Item -ItemType Directory -Path "src/features/phase2-annotation/supervision/ui/components" -Force

# 2. Créer fichier placeholder pour service
$serviceContent = @'
// src/features/phase2-annotation/supervision/domain/services/QualityControlService.ts
// TODO: Implémenter service de contrôle qualité
export class QualityControlService {
  // À implémenter
}
'@
Set-Content -Path "src/features/phase2-annotation/supervision/domain/services/QualityControlService.ts" -Value $serviceContent

# 3. Créer composant placeholder
$componentContent = @'
// src/features/phase2-annotation/supervision/ui/components/SupervisionDashboard.tsx
"use client";
import React from "react";

export const SupervisionDashboard: React.FC = () => {
  return (
    <div>
      <h1>Supervision Dashboard</h1>
      <p>TODO: Implémenter dashboard de supervision qualité</p>
    </div>
  );
};
'@
Set-Content -Path "src/features/phase2-annotation/supervision/ui/components/SupervisionDashboard.tsx" -Value $componentContent
```

**Validation :**
- [ ] Structure créée
- [ ] Placeholders créés
- [ ] Commit : `feat(phase2): create supervision feature structure (Step 3.5)`

---

### ⏱️ Étape 3.6 : Créer routes Phase 2 (30min)

**Objectif :** Créer les pages de navigation Phase 2

**Routes à créer :**
1. `layout.tsx` - Layout Phase 2
2. `transcript/[callId]/page.tsx` - TaggerLPL (annotation d'un appel)
3. `transcript/page.tsx` - Liste des appels à annoter
4. `tags-management/page.tsx` - Gestion du référentiel de tags
5. `supervision/page.tsx` - Dashboard supervision

**Actions :**
```powershell
# 1. Créer layout Phase 2
$layoutContent = @'
// src/app/(protected)/phase2-annotation/layout.tsx
import { ReactNode } from "react";

interface Phase2LayoutProps {
  children: ReactNode;
}

export default function Phase2AnnotationLayout({ children }: Phase2LayoutProps) {
  return (
    <div>
      {children}
    </div>
  );
}
'@
[System.IO.File]::WriteAllText("$PWD/src/app/(protected)/phase2-annotation/layout.tsx", $layoutContent, [System.Text.UTF8Encoding]::new($false))

# 2. Créer page TaggerLPL (annotation d'un appel spécifique)
$taggerContent = @'
// src/app/(protected)/phase2-annotation/transcript/[callId]/page.tsx
"use client";

import TaggerLPL from "@/features/phase2-annotation/transcript";

interface TaggerPageProps {
  params: {
    callId: string;
  };
}

export default function TaggerPage({ params }: TaggerPageProps) {
  return <TaggerLPL callId={params.callId} />;
}
'@
[System.IO.File]::WriteAllText("$PWD/src/app/(protected)/phase2-annotation/transcript/[callId]/page.tsx", $taggerContent, [System.Text.UTF8Encoding]::new($false))

# 3. Créer page liste des appels à annoter
$listContent = @'
// src/app/(protected)/phase2-annotation/transcript/page.tsx
"use client";

import React from "react";

export default function TranscriptListPage() {
  return (
    <div>
      <h1>Appels à annoter</h1>
      <p>TODO: Liste des appels prêts pour annotation</p>
    </div>
  );
}
'@
[System.IO.File]::WriteAllText("$PWD/src/app/(protected)/phase2-annotation/transcript/page.tsx", $listContent, [System.Text.UTF8Encoding]::new($false))

# 4. Créer page gestion tags
$tagsContent = @'
// src/app/(protected)/phase2-annotation/tags-management/page.tsx
"use client";

import React from "react";

export default function TagsManagementPage() {
  return (
    <div>
      <h1>Gestion des Tags</h1>
      <p>TODO: Interface de gestion du référentiel de tags</p>
    </div>
  );
}
'@
[System.IO.File]::WriteAllText("$PWD/src/app/(protected)/phase2-annotation/tags-management/page.tsx", $tagsContent, [System.Text.UTF8Encoding]::new($false))

# 5. Créer page supervision
$supervisionContent = @'
// src/app/(protected)/phase2-annotation/supervision/page.tsx
"use client";

import { SupervisionDashboard } from "@/features/phase2-annotation/supervision/ui/components/SupervisionDashboard";

export default function SupervisionPage() {
  return <SupervisionDashboard />;
}
'@
[System.IO.File]::WriteAllText("$PWD/src/app/(protected)/phase2-annotation/supervision/page.tsx", $supervisionContent, [System.Text.UTF8Encoding]::new($false))
```

**Validation :**
- [ ] Layout créé
- [ ] Page TaggerLPL créée (route dynamique)
- [ ] Page liste appels créée
- [ ] Page gestion tags créée
- [ ] Page supervision créée
- [ ] Commit : `feat(phase2): create navigation routes for annotation phase (Step 3.6)`

---

### ⏱️ Étape 3.7 : Tests & Validation (30min)

**Objectif :** Vérifier que tout fonctionne

**Routes à tester :**
```
http://localhost:3000/phase2-annotation/transcript/[un-call-id]    # TaggerLPL
http://localhost:3000/phase2-annotation/transcript                 # Liste appels
http://localhost:3000/phase2-annotation/tags-management            # Gestion tags
http://localhost:3000/phase2-annotation/supervision                # Supervision
```

**Actions de validation :**
```powershell
# 1. Vérifier qu'il ne reste pas d'imports cassés
Get-ChildItem -Path "src/features","src/components","src/app" -Recurse -Include "*.ts","*.tsx" -Exclude "*legacy*" | Select-String "@/components/TranscriptLPL|@/components/Tag|@/components/Turn" | Select-Object Path -Unique

# 2. Compiler le projet
npm run build -- --no-lint

# 3. Lancer le serveur de dev
npm run dev

# 4. Tester chaque route manuellement dans le navigateur
```

**Checklist de validation :**
- [ ] Aucun import cassé vers anciens chemins
- [ ] Compilation TypeScript réussie
- [ ] Route TaggerLPL accessible et fonctionnelle
- [ ] Autres routes Phase 2 accessibles
- [ ] Aucune erreur console navigateur
- [ ] Commit : `test(phase2): validate annotation phase migration (Step 3.7)`

---

## 📊 Estimation détaillée

| Sous-étape | Durée | Complexité |
|------------|-------|------------|
| 3.1 - Structure | 20 min | 🟢 Faible |
| 3.2 - TranscriptLPL | 60 min | 🟡 Moyenne |
| 3.3 - Tags | 45 min | 🟡 Moyenne |
| 3.4 - Turns | 30 min | 🟢 Faible |
| 3.5 - Supervision | 15 min | 🟢 Faible |
| 3.6 - Routes | 30 min | 🟢 Faible |
| 3.7 - Tests | 30 min | 🟢 Faible |
| **TOTAL** | **3h50** | 🟡 Moyenne |

**Note :** Estimation haute pour prévoir les imprévus. Durée réelle probable : **2h30-3h**

---

## ⚠️ Points d'attention

### Imports TranscriptLPL
- TranscriptLPL est utilisé dans plusieurs endroits (TaggerLPL, supervision, etc.)
- Bien identifier tous les fichiers qui l'importent
- Vérifier les imports relatifs vs absolus

### Types partagés
- Les types de `transcript/types.tsx` sont peut-être utilisés ailleurs
- Vérifier s'ils doivent être dans `@/types` au lieu de rester dans le module

### Composants Tags/Turns
- Certains peuvent être utilisés dans d'autres modules (analysis?)
- Vérifier l'usage avant de déplacer

### Route dynamique [callId]
- S'assurer que le paramètre est bien passé au composant TaggerLPL
- Tester avec un vrai call_id

---

## 🎯 Critères de succès

### Technique ✅
- [ ] Tous les modules Phase 2 dans `features/phase2-annotation/`
- [ ] Aucun fichier annotation restant dans `src/components/`
- [ ] Compilation TypeScript sans erreurs
- [ ] Toutes les routes Phase 2 accessibles

### Architecture ✅
- [ ] Structure reflète workflow annotation
- [ ] Séparation claire transcript / tags / turns / supervision
- [ ] Imports propres via `@/features/phase2-annotation/`

### Fonctionnel ✅
- [ ] TaggerLPL fonctionne sur `/phase2-annotation/transcript/[callId]`
- [ ] Navigation entre pages Phase 2 fluide
- [ ] Aucune régression sur fonctionnalités existantes

---

## 📝 Checklist de préparation

Avant de commencer la session :

- [ ] Phase 1 (Étape 2) complétée et committée ✅
- [ ] Branche `refactor/architecture-phases` à jour
- [ ] Environnement de dev fonctionnel
- [ ] Base de données accessible
- [ ] Cache `.next` nettoyé si nécessaire
- [ ] Ce document lu et compris

---

## 🔄 Ordre d'exécution recommandé

1. ✅ Créer structure (3.1)
2. ✅ Migrer TranscriptLPL (3.2) - **Le plus gros module**
3. ✅ Organiser Tags (3.3)
4. ✅ Organiser Turns (3.4)
5. ✅ Structure Supervision (3.5)
6. ✅ Créer routes (3.6)
7. ✅ Valider (3.7)

**Approche :** Migrer feature par feature, valider, commiter, continuer.

---

## 🚀 Après l'Étape 3

Une fois Phase 2 terminée, nous aurons :

```
✅ Phase 1 - Corpus (Import, Gestion, WorkDrive)
✅ Phase 2 - Annotation (TranscriptLPL, Tags, Turns, Supervision)
⏳ Phase 3 - Analysis (AlgorithmLab, Level 0/1/2, H1/H2)
```

**Prochaine session :** Étape 4 - Phase 3 Analysis (la plus grosse, 150+ fichiers)

---

## 📞 Support

**Documents de référence :**
- `ARCHITECTURE_CIBLE_WORKFLOW.md` - Architecture finale visée
- `SESSION_ARCHITECTURE_REFACTORING.md` - Plan global
- `ETAPE_2_PHASE1_BILAN.md` - Retour d'expérience Phase 1

**En cas de problème :**
1. Vérifier compilation TypeScript
2. Consulter les erreurs d'imports
3. Nettoyer cache `.next` si nécessaire
4. Revenir au dernier commit stable

---

**Date création :** 2025-11-09  
**Auteur :** Thomas + Claude  
**Statut :** 📋 PLAN PRÊT

**Bonne migration Phase 2 ! 🚀**
