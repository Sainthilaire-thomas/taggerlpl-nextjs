# Guide de Depannage - TaggerLPL

## Configuration Generation des Types Supabase

### Probleme : Le script `generate-types.ps1` ne fonctionne pas

**Symptomes :**
- Le script se bloque sur "Calling Supabase CLI..."
- Erreur : "Supabase CLI command failed"
- Timeout ou aucune reponse

**Solution :**

#### Etape 1 : Installer Supabase CLI avec Scoop
```powershell
# Installer Scoop (si pas deja installe)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Installer Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Verifier l'installation
supabase --version
```

#### Etape 2 : Authentification Supabase
```powershell
# Se connecter (une seule fois)
supabase login

# Suivre les instructions dans le navigateur
# Copier le code de verification affiche dans le terminal
```

#### Etape 3 : Modifier le script pour utiliser `supabase` au lieu de `npx supabase`

Le probleme vient du fait que `npx supabase` telecharge une version qui peut avoir des problemes d'authentification.

**Modification manuelle :**

1. Ouvrir `.\scripts\generate-types.ps1`
2. Remplacer ligne 36 :
   - AVANT : `npx supabase gen types typescript --project-id $PROJECT_ID`
   - APRES : `supabase gen types typescript --project-id $PROJECT_ID`

**Modification automatique :**
```powershell
$scriptPath = ".\scripts\generate-types.ps1"
$content = Get-Content $scriptPath -Raw
$content = $content -replace 'npx supabase', 'supabase'
Set-Content -Path $scriptPath -Value $content
```

#### Etape 4 : Executer le script
```powershell
# Via npm (recommande)
npm run generate:types

# Ou directement
.\scripts\generate-types.ps1

# Ou manuellement
supabase gen types typescript --project-id jregkxiwrnquslbocicz > src/types/database.types.ts
```

### Resultat attendu
```
[OK] Generating types from Supabase...
   Calling Supabase CLI...
[OK] Types generated successfully!
   File: src/types/database.types.ts
   Size: 91.7 KB
```

---

## Politique d'Execution PowerShell

### Probleme : Impossible d'executer des scripts `.ps1`

**Erreur :**
```
Le fichier n'est pas signe numeriquement. Vous ne pouvez pas executer ce script sur le systeme actuel.
```

**Solution :**
```powershell
# Temporaire (pour la session actuelle)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Permanent (pour l'utilisateur actuel)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Installation Supabase CLI - Methodes alternatives

### Methode 1 : Scoop (RECOMMANDE sur Windows)
```powershell
scoop install supabase
```

### Methode 2 : Telechargement direct
```powershell
Invoke-WebRequest -Uri "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip" -OutFile "supabase.zip"
Expand-Archive -Path "supabase.zip" -DestinationPath "$env:USERPROFILE\.supabase" -Force
Remove-Item "supabase.zip"
$env:Path += ";$env:USERPROFILE\.supabase"
```

### Methode 3 : npx (NON RECOMMANDE)

**ATTENTION :** `npm install -g supabase` ne fonctionne **PAS** - utilise Scoop a la place.

---

## Workflow de Developpement

### Quand regenerer les types ?

Regenere les types Supabase apres :
- Modification du schema de la base de donnees
- Ajout/suppression de tables
- Modification de colonnes
- Ajout de vues ou fonctions

### Commandes utiles
```powershell
# Generer les types
npm run generate:types

# Verifier la version de Supabase CLI
supabase --version

# Se reconnecter si necessaire
supabase login

# Lister les projets lies
supabase projects list
```

---

## Notes

- **Project ID actuel :** `jregkxiwrnquslbocicz`
- **Fichier genere :** `src/types/database.types.ts`
- **Taille typique :** ~90 KB
- **Authentification :** Token stocke dans `~/.supabase/access-token`

---

## En cas de probleme

1. Verifier que Supabase CLI est installe : `supabase --version`
2. Verifier l'authentification : `supabase login`
3. Tester la commande manuellement :
```powershell
   supabase gen types typescript --project-id jregkxiwrnquslbocicz
```
4. Verifier les variables d'environnement dans `.env.local`
5. Consulter les logs : Le script affiche des messages d'erreur detailles

---

**Derniere mise a jour :** 18 novembre 2025  
**Version Supabase CLI :** 2.58.5