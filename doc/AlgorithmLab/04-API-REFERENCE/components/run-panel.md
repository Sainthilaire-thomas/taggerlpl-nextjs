# RunPanel

Panneau de configuration et lancement d’un test (TechnicalValidation).

## Props

```ts
interface RunPanelProps {
  algorithmName: string
  availableCount: number
  onRun: (sampleSize: number) => void
  configValid?: boolean
}
Fonctionnalités
Slider intelligent : min/max/step calculés sur corpus filtré.

Input numérique : ajustement précis.

Badges : config valide/invalide, support batch, target affichée.

Lancement : déclenche onRun(sampleSize).

Exemple
tsx
Copier le code
<RunPanel
  algorithmName="OpenAIConseiller"
  availableCount={3500}
  configValid={true}
  onRun={(n) => validateAlgorithm("OpenAIConseiller", n)}
/>
yaml
Copier le code

---
```
