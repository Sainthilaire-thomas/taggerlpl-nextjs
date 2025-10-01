## `initializeAlgorithms(): void`

Instancie et enregistre les algorithmes disponibles (X/Y/M1…); gère les clés/API options (ex. OpenAI).

## `getAlgorithmStatus(): Record<string, any>`

Résumé diagnostique par algo (clé, batch support, config valide, etc.).

## `testAllAlgorithms(names: string[], samples: any[]): Promise<Record<string, any>>>`

Exécute un test simple sur une liste d’algos.

## `benchmarkAlgorithms(names: string[], samples: any[]): Promise<Record<string, any>>>`

Mesure temps moyen, taux de succès, etc. pour comparaison rapide.

> Ces fonctions sont prévues pour l’écran  **Technical Validation / Comparison** .
>
