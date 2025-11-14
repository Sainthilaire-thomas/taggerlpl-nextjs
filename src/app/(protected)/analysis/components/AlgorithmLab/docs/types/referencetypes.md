# Reference — Types normalisés AlgorithmLab

> Ce document fige les **contrats de types** et **points d’entrée** utilisés par AlgorithmLab.
>
> Périmètre : `algorithms/`, `core/`, `ui/`, `utils/`.
>
> Objectifs : imports **stables** , **coexistence** avec l’existant, **extensibilité** (M4, nouveaux algos).

---

## Sommaire

- [0) Conventions &amp; imports](#0-conventions--imports)
- [1) `algorithms/` — Contrats algorithmiques](#1-algorithms--contrats-algorithmiques)
  - [1.1 Exports (`base.ts`)](#11-exports-basets)
  - [1.2 Adaptateur (`universal-adapter.ts`)](#12-adaptateur-universal-adapterts)
  - [1.3 Index (`index.ts`)](#13-index-indexts)
- [2) `core/` — Variables, calculs, validation](#2-core--variables-calculs-validation)
  - [2.1 `variables.ts`](#21-variablests)
  - [2.2 `calculations.ts`](#22-calculationsts)
  - [2.3 `validation.ts`](#23-validationts)
  - [2.4 `index.ts`](#24-indexts)
- [3) `ui/` — Types pour composants](#3-ui--types-pour-composants)
  - [3.1 `components.ts`](#31-componentsts)
  - [3.2 `validation.ts`](#32-validationts-1)
  - [3.3 `index.ts`](#33-indexts-1)
- [4) `utils/` — Normalisation &amp; conversions](#4-utils--normalisation--conversions)
  - [4.1 `normalizers.ts`](#41-normalizersts)
  - [4.2 `converters.ts`](#42-convertersts)
  - [4.3 `index.ts`](#43-indexts-2)
- [5) Exemples complets](#5-exemples-complets)
  - [5.1 De `CalculationResult<M1Details>` à `UniversalResult`](#51-de-calculationresultm1details-%C3%A0-universalresult)
  - [5.2 De `UniversalResult` à `TVValidationResultCore` (UI)](#52-de-universalresult-%C3%A0-tvvalidationresultcore-ui)
  - [5.3 Pont local `ResultsPanel/types.ts` (extension sûre)](#53-pont-local-resultspaneltypests-extension-s%C3%BBre)
- [6) Règles d’architecture](#6-r%C3%A8gles-darchitecture)
- [7) Checklists de validation](#7-checklists-de-validation)
- [8) Notes de migration](#8-notes-de-migration)

---

## 0) Conventions & imports

**Alias recommandé (tsconfig.json) :**

<pre class="overflow-visible!" data-start="2152" data-end="2304"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-json"><span><span>{</span><span>
  </span><span>"compilerOptions"</span><span>:</span><span></span><span>{</span><span>
    </span><span>"baseUrl"</span><span>:</span><span></span><span>"."</span><span>,</span><span>
    </span><span>"paths"</span><span>:</span><span></span><span>{</span><span>
      </span><span>"AlgorithmLab/types/*"</span><span>:</span><span></span><span>[</span><span>"<chemin/vers>/AlgorithmLab/types/*"</span><span>]</span><span>
    </span><span>}</span><span>
  </span><span>}</span><span>
</span><span>}</span><span>
</span></span></code></div></div></pre>

**Exemples d’import :**

<pre class="overflow-visible!" data-start="2330" data-end="2587"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>import</span><span> { </span><span>UniversalAlgorithm</span><span> } </span><span>from</span><span></span><span>"AlgorithmLab/types/algorithms"</span><span>;
</span><span>import</span><span> { </span><span>ValidationMetrics</span><span> } </span><span>from</span><span></span><span>"AlgorithmLab/types/core"</span><span>;
</span><span>import</span><span> { </span><span>ResultsPanelProps</span><span> } </span><span>from</span><span></span><span>"AlgorithmLab/types/ui"</span><span>;
</span><span>import</span><span> { normalizeXLabel } </span><span>from</span><span></span><span>"AlgorithmLab/types/utils"</span><span>;
</span></span></code></div></div></pre>

---

## 1) `algorithms/` — Contrats algorithmiques

### 1.1 Exports (`base.ts`)

<pre class="overflow-visible!" data-start="2669" data-end="4002"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>type</span><span></span><span>AlgorithmType</span><span> = </span><span>"rule-based"</span><span> | </span><span>"ml"</span><span> | </span><span>"llm"</span><span> | </span><span>"hybrid"</span><span>;
</span><span>export</span><span></span><span>type</span><span></span><span>VariableTarget</span><span> = </span><span>"X"</span><span> | </span><span>"Y"</span><span> | </span><span>"M1"</span><span> | </span><span>"M2"</span><span> | </span><span>"M3"</span><span>;

</span><span>export</span><span></span><span>interface</span><span></span><span>ParameterDescriptor</span><span> {
  </span><span>label</span><span>: </span><span>string</span><span>;
  </span><span>type</span><span>: </span><span>"boolean"</span><span> | </span><span>"number"</span><span> | </span><span>"string"</span><span> | </span><span>"select"</span><span>;
  required?: </span><span>boolean</span><span>;
  min?: </span><span>number</span><span>;
  max?: </span><span>number</span><span>;
  step?: </span><span>number</span><span>;
  options?: </span><span>Array</span><span><{ </span><span>label</span><span>: </span><span>string</span><span>; </span><span>value</span><span>: </span><span>string</span><span> }>;
  description?: </span><span>string</span><span>;
}

</span><span>export</span><span></span><span>interface</span><span></span><span>AlgorithmDescriptor</span><span> {
  </span><span>name</span><span>: </span><span>string</span><span>;
  </span><span>displayName</span><span>: </span><span>string</span><span>;
  </span><span>version</span><span>: </span><span>string</span><span>;
  </span><span>type</span><span>: </span><span>AlgorithmType</span><span>;
  </span><span>target</span><span>: </span><span>VariableTarget</span><span>;
  </span><span>batchSupported</span><span>: </span><span>boolean</span><span>;
  </span><span>requiresContext</span><span>: </span><span>boolean</span><span>;
  description?: </span><span>string</span><span>;
  parameters?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>ParameterDescriptor</span><span>>;
  examples?: </span><span>Array</span><span><{ </span><span>input</span><span>: </span><span>unknown</span><span>; output?: </span><span>unknown</span><span>; note?: </span><span>string</span><span> }>;
}

</span><span>export</span><span></span><span>interface</span><span></span><span>UniversalResult</span><span> {
  </span><span>prediction</span><span>: </span><span>string</span><span>;
  </span><span>confidence</span><span>: </span><span>number</span><span>;
  processingTime?: </span><span>number</span><span>;
  algorithmVersion?: </span><span>string</span><span>;
  metadata?: {
    inputSignature?: </span><span>string</span><span>;
    inputType?: </span><span>string</span><span>;
    executionPath?: </span><span>string</span><span>[];
    warnings?: </span><span>string</span><span>[];
    details?: </span><span>unknown</span><span>; </span><span>// spécifique X/Y/M1/M2/M3</span><span>
  };
}

</span><span>export</span><span></span><span>interface</span><span></span><span>UniversalAlgorithm</span><span> {
  </span><span>describe</span><span>(): </span><span>AlgorithmDescriptor</span><span>;
  </span><span>validateConfig</span><span>(): </span><span>boolean</span><span>;
  </span><span>classify</span><span>(</span><span>input</span><span>: </span><span>string</span><span>): </span><span>Promise</span><span><</span><span>UniversalResult</span><span>>;
  </span><span>run</span><span>(</span><span>input</span><span>: </span><span>unknown</span><span>): </span><span>Promise</span><span><</span><span>UniversalResult</span><span>>;
  batchRun?(</span><span>inputs</span><span>: </span><span>unknown</span><span>[]): </span><span>Promise</span><span><</span><span>UniversalResult</span><span>[]>;
}
</span></span></code></div></div></pre>

### 1.2 Adaptateur (`universal-adapter.ts`)

<pre class="overflow-visible!" data-start="4048" data-end="5230"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>import</span><span></span><span>type</span><span> {
  </span><span>AlgorithmDescriptor</span><span>, </span><span>AlgorithmType</span><span>, </span><span>VariableTarget</span><span>,
  </span><span>UniversalAlgorithm</span><span>, </span><span>UniversalResult</span><span>
} </span><span>from</span><span></span><span>"./base"</span><span>;

</span><span>// Calculateur “métier” minimal</span><span>
</span><span>export</span><span></span><span>interface</span><span></span><span>BaseCalculator</span><span><</span><span>TInput</span><span>, </span><span>TDetails</span><span>> {
  </span><span>describe</span><span>(): </span><span>Omit</span><span><</span><span>AlgorithmDescriptor</span><span>, </span><span>"type"</span><span> | </span><span>"target"</span><span> | </span><span>"batchSupported"</span><span> | </span><span>"requiresContext"</span><span>>;
  </span><span>run</span><span>(</span><span>input</span><span>: </span><span>TInput</span><span>): </span><span>Promise</span><span><{
    </span><span>prediction</span><span>: </span><span>string</span><span>; </span><span>confidence</span><span>: </span><span>number</span><span>; details?: </span><span>TDetails</span><span>; processingTime?: </span><span>number</span><span>;
  }>;
  batchRun?(</span><span>inputs</span><span>: </span><span>TInput</span><span>[]): </span><span>Promise</span><span><</span><span>Array</span><span><{
    </span><span>prediction</span><span>: </span><span>string</span><span>; </span><span>confidence</span><span>: </span><span>number</span><span>; details?: </span><span>TDetails</span><span>; processingTime?: </span><span>number</span><span>;
  }>>;
  validateConfig?(): </span><span>boolean</span><span>;
}

</span><span>// Fabrique un UniversalAlgorithm</span><span>
</span><span>export</span><span></span><span>function</span><span> createUniversalAlgorithm<</span><span>TInput</span><span>, </span><span>TDetails</span><span>>(
  </span><span>calculator</span><span>: </span><span>BaseCalculator</span><span><</span><span>TInput</span><span>, </span><span>TDetails</span><span>>,
  </span><span>target</span><span>: </span><span>VariableTarget</span><span>,
  config?: {
    </span><span>type</span><span>?: </span><span>AlgorithmType</span><span>;
    requiresContext?: </span><span>boolean</span><span>;
    supportsBatch?: </span><span>boolean</span><span>;
    inputValidator?: </span><span>(input: unknown</span><span>) => input is </span><span>TInput</span><span>;
    inputConverter?: </span><span>(input: string</span><span>) => </span><span>TInput</span><span>; </span><span>// pour .classify()</span><span>
    resultMapper?: (r: {
      prediction: </span><span>string</span><span>; confidence: </span><span>number</span><span>; details?: TDetails; processingTime?: </span><span>number</span><span>;
    }) => </span><span>UniversalResult</span><span>;
  }
): </span><span>UniversalAlgorithm</span><span>;
</span></span></code></div></div></pre>

### 1.3 Index (`index.ts`)

<pre class="overflow-visible!" data-start="5259" data-end="5329"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span> * </span><span>from</span><span></span><span>"./base"</span><span>;
</span><span>export</span><span> * </span><span>from</span><span></span><span>"./universal-adapter"</span><span>;
</span></span></code></div></div></pre>

---

## 2) `core/` — Variables, calculs, validation

### 2.1 `variables.ts`

<pre class="overflow-visible!" data-start="5407" data-end="6049"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>type</span><span></span><span>VariableTarget</span><span> = </span><span>"X"</span><span> | </span><span>"Y"</span><span> | </span><span>"M1"</span><span> | </span><span>"M2"</span><span> | </span><span>"M3"</span><span>;

</span><span>export</span><span></span><span>interface</span><span></span><span>XDetails</span><span> {
  family?: </span><span>string</span><span>;
  evidences?: </span><span>string</span><span>[];
  topProbs?: </span><span>Array</span><span><{ </span><span>label</span><span>: </span><span>string</span><span>; </span><span>prob</span><span>: </span><span>number</span><span> }>;
}
</span><span>export</span><span></span><span>interface</span><span></span><span>YDetails</span><span> {
  family?: </span><span>string</span><span>;
  evidences?: </span><span>string</span><span>[];
  topProbs?: </span><span>Array</span><span><{ </span><span>label</span><span>: </span><span>string</span><span>; </span><span>prob</span><span>: </span><span>number</span><span> }>;
}
</span><span>export</span><span></span><span>interface</span><span> M1Details { value?: </span><span>number</span><span>; actionVerbCount?: </span><span>number</span><span>; totalTokens?: </span><span>number</span><span>; verbsFound?: </span><span>string</span><span>[]; }
</span><span>export</span><span></span><span>interface</span><span> M2Details { value?: </span><span>string</span><span> | </span><span>number</span><span>; scale?: </span><span>string</span><span>; }
</span><span>export</span><span></span><span>interface</span><span> M3Details { value?: </span><span>number</span><span>; unit?: </span><span>"ms"</span><span> | </span><span>"s"</span><span>; }

</span><span>export</span><span></span><span>const</span><span></span><span>VARIABLE_LABELS</span><span>: </span><span>Record</span><span><</span><span>VariableTarget</span><span>, </span><span>string</span><span>>;
</span></span></code></div></div></pre>

### 2.2 `calculations.ts`

<pre class="overflow-visible!" data-start="6077" data-end="6644"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>XInput</span><span> { </span><span>text</span><span>: </span><span>string</span><span>; context?: </span><span>string</span><span>[]; }
</span><span>export</span><span></span><span>interface</span><span></span><span>YInput</span><span> { </span><span>text</span><span>: </span><span>string</span><span>; context?: </span><span>string</span><span>[]; }
</span><span>export</span><span></span><span>interface</span><span> M1Input { </span><span>text</span><span>: </span><span>string</span><span>; }
</span><span>export</span><span></span><span>interface</span><span> M2Input { </span><span>t0</span><span>: </span><span>string</span><span>; </span><span>t1</span><span>: </span><span>string</span><span>; }
</span><span>export</span><span></span><span>interface</span><span> M3Input { tokens?: </span><span>Array</span><span><{ </span><span>t</span><span>: </span><span>string</span><span>; ts?: </span><span>number</span><span> }>; }

</span><span>export</span><span></span><span>interface</span><span></span><span>CalculationResult</span><span><</span><span>TDetails</span><span> = </span><span>unknown</span><span>> {
  </span><span>prediction</span><span>: </span><span>string</span><span>;
  </span><span>confidence</span><span>: </span><span>number</span><span>;
  details?: </span><span>TDetails</span><span>;
  processingTime?: </span><span>number</span><span>;
}

</span><span>export</span><span></span><span>interface</span><span></span><span>CalculationMetadata</span><span> {
  </span><span>name</span><span>: </span><span>string</span><span>;
  </span><span>version</span><span>: </span><span>string</span><span>;
  params?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>>;
}
</span></span></code></div></div></pre>

### 2.3 `validation.ts`

<pre class="overflow-visible!" data-start="6670" data-end="7455"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>TVMetadataCore</span><span> {
  turnId?: </span><span>number</span><span> | </span><span>string</span><span>;
  id?: </span><span>number</span><span> | </span><span>string</span><span>;
}

</span><span>export</span><span></span><span>interface</span><span></span><span>TVValidationResultCore</span><span> {
  </span><span>verbatim</span><span>: </span><span>string</span><span>;
  </span><span>goldStandard</span><span>: </span><span>string</span><span>;
  </span><span>predicted</span><span>: </span><span>string</span><span>;
  </span><span>confidence</span><span>: </span><span>number</span><span>;
  </span><span>correct</span><span>: </span><span>boolean</span><span>;
  processingTime?: </span><span>number</span><span>;
  metadata?: </span><span>TVMetadataCore</span><span> | </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>>;
}

</span><span>export</span><span></span><span>interface</span><span></span><span>ValidationMetrics</span><span> {
  </span><span>accuracy</span><span>: </span><span>number</span><span>;
  </span><span>correct</span><span>: </span><span>number</span><span>;
  </span><span>total</span><span>: </span><span>number</span><span>;
  avgProcessingTime?: </span><span>number</span><span>;
  avgConfidence?: </span><span>number</span><span>;
  kappa?: </span><span>number</span><span>;
}

</span><span>export</span><span></span><span>interface</span><span></span><span>ValidationResult</span><span> {
  </span><span>classifierName</span><span>: </span><span>string</span><span>;
  </span><span>metrics</span><span>: </span><span>ValidationMetrics</span><span>;
  confusionMatrix?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>Record</span><span><</span><span>string</span><span>, </span><span>number</span><span>>>;
  byLabel?: </span><span>Array</span><span><{
    </span><span>label</span><span>: </span><span>string</span><span>;
    precision?: </span><span>number</span><span>;
    recall?: </span><span>number</span><span>;
    f1?: </span><span>number</span><span>;
    support?: </span><span>number</span><span>;
  }>;
}
</span></span></code></div></div></pre>

### 2.4 `index.ts`

<pre class="overflow-visible!" data-start="7476" data-end="7576"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span> * </span><span>from</span><span></span><span>"./variables"</span><span>;
</span><span>export</span><span> * </span><span>from</span><span></span><span>"./calculations"</span><span>;
</span><span>export</span><span> * </span><span>from</span><span></span><span>"./validation"</span><span>;
</span></span></code></div></div></pre>

---

## 3) `ui/` — Types pour composants

### 3.1 `components.ts`

<pre class="overflow-visible!" data-start="7644" data-end="8207"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>BaseValidationProps</span><span> {
  title?: </span><span>string</span><span>;
  subtitle?: </span><span>string</span><span>;
  loading?: </span><span>boolean</span><span>;
}

</span><span>export</span><span></span><span>interface</span><span></span><span>DisplayConfig</span><span> {
  showConfidence?: </span><span>boolean</span><span>;
  showProcessingTime?: </span><span>boolean</span><span>;
  compact?: </span><span>boolean</span><span>;
  pageSizeOptions?: </span><span>number</span><span>[];
  defaultPageSize?: </span><span>number</span><span>;
}

</span><span>export</span><span></span><span>interface</span><span></span><span>ResultsPanelProps</span><span> {
  </span><span>results</span><span>: </span><span>Array</span><span><{
    </span><span>verbatim</span><span>: </span><span>string</span><span>;
    </span><span>goldStandard</span><span>: </span><span>string</span><span>;
    </span><span>predicted</span><span>: </span><span>string</span><span>;
    </span><span>confidence</span><span>: </span><span>number</span><span>;
    </span><span>correct</span><span>: </span><span>boolean</span><span>;
    processingTime?: </span><span>number</span><span>;
    metadata?: </span><span>Record</span><span><</span><span>string</span><span>, </span><span>unknown</span><span>>;
  }>;
  display?: </span><span>DisplayConfig</span><span>;
}
</span></span></code></div></div></pre>

### 3.2 `validation.ts`

<pre class="overflow-visible!" data-start="8233" data-end="8871"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>TechnicalValidationProps</span><span> {
  </span><span>classifierName</span><span>: </span><span>string</span><span>;
  </span><span>sampleSize</span><span>: </span><span>number</span><span>;
  </span><span>onRun</span><span>: </span><span>(classifierName: string</span><span>, sampleSize: </span><span>number</span><span>) => </span><span>void</span><span> | </span><span>Promise</span><span><</span><span>void</span><span>>;
  isRunning?: </span><span>boolean</span><span>;
  display?: </span><span>import</span><span>(</span><span>"./components"</span><span>).</span><span>DisplayConfig</span><span>;
}

</span><span>export</span><span></span><span>interface</span><span></span><span>ComparisonEntry</span><span> {
  </span><span>classifierName</span><span>: </span><span>string</span><span>;
  </span><span>accuracy</span><span>: </span><span>number</span><span>;
  avgProcessingTime?: </span><span>number</span><span>;
  avgConfidence?: </span><span>number</span><span>;
  </span><span>type</span><span>?: </span><span>"rule-based"</span><span> | </span><span>"ml"</span><span> | </span><span>"llm"</span><span> | </span><span>"hybrid"</span><span>;
  version?: </span><span>string</span><span>;
}

</span><span>export</span><span></span><span>interface</span><span></span><span>AlgorithmComparisonProps</span><span> {
  </span><span>entries</span><span>: </span><span>ComparisonEntry</span><span>[];
  onSelect?: </span><span>(classifierName: string</span><span>) => </span><span>void</span><span>;
  display?: </span><span>import</span><span>(</span><span>"./components"</span><span>).</span><span>DisplayConfig</span><span>;
}
</span></span></code></div></div></pre>

### 3.3 `index.ts`

<pre class="overflow-visible!" data-start="8892" data-end="8961"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span> * </span><span>from</span><span></span><span>"./components"</span><span>;
</span><span>export</span><span> * </span><span>from</span><span></span><span>"./validation"</span><span>;
</span></span></code></div></div></pre>

---

## 4) `utils/` — Normalisation & conversions

### 4.1 `normalizers.ts`

<pre class="overflow-visible!" data-start="9039" data-end="9679"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>/** Normalize un label X (espaces, casse, variantes) → label canonique */</span><span>
</span><span>export</span><span></span><span>function</span><span></span><span>normalizeXLabel</span><span>(</span><span>input: string</span><span>): </span><span>string</span><span>;

</span><span>/** Normalize un label Y → label canonique */</span><span>
</span><span>export</span><span></span><span>function</span><span></span><span>normalizeYLabel</span><span>(</span><span>input: string</span><span>): </span><span>string</span><span>;

</span><span>/** Détermine la famille (catégorie) d’un label X */</span><span>
</span><span>export</span><span></span><span>function</span><span></span><span>familyFromX</span><span>(</span><span>labelX: string</span><span>): </span><span>string</span><span> | </span><span>undefined</span><span>;

</span><span>/** Nettoie un verbatim pour calcul M1 (tokens, ponctuation minimale, etc.) */</span><span>
</span><span>export</span><span></span><span>function</span><span></span><span>normalizeForM1</span><span>(</span><span>input: string</span><span>): </span><span>string</span><span>;

</span><span>/** Clamp & format d’un score [0..1] avec décimales contrôlées */</span><span>
</span><span>export</span><span></span><span>function</span><span></span><span>normalizeConfidence</span><span>(</span><span>value: number</span><span>, digits?: </span><span>number</span><span>): </span><span>number</span><span>;
</span></span></code></div></div></pre>

### 4.2 `converters.ts`

<pre class="overflow-visible!" data-start="9705" data-end="10631"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>import</span><span></span><span>type</span><span> { </span><span>CalculationResult</span><span> } </span><span>from</span><span></span><span>"../core"</span><span>;
</span><span>import</span><span></span><span>type</span><span> { </span><span>UniversalResult</span><span> } </span><span>from</span><span></span><span>"../algorithms"</span><span>;
</span><span>import</span><span></span><span>type</span><span> { </span><span>TVValidationResultCore</span><span> } </span><span>from</span><span></span><span>"../core"</span><span>;

</span><span>/** Mappe un CalculationResult<T> vers UniversalResult (pour UI homogène) */</span><span>
</span><span>export</span><span></span><span>function</span><span> toUniversalResult<</span><span>TDetails</span><span>>(
  </span><span>r</span><span>: </span><span>CalculationResult</span><span><</span><span>TDetails</span><span>>,
  extras?: </span><span>Partial</span><span><</span><span>Pick</span><span><</span><span>UniversalResult</span><span>, </span><span>"algorithmVersion"</span><span> | </span><span>"metadata"</span><span>>>
): </span><span>UniversalResult</span><span>;

</span><span>/** Construit un TVValidationResultCore à partir de prédiction brute */</span><span>
</span><span>export</span><span></span><span>function</span><span></span><span>toTVValidationResultCore</span><span>(params: {
  verbatim: </span><span>string</span><span>;
  goldStandard: </span><span>string</span><span>;
  prediction: </span><span>string</span><span>;
  confidence?: </span><span>number</span><span>;
  processingTime?: </span><span>number</span><span>;
  metadata?: Record<</span><span>string</span><span>, </span><span>unknown</span><span>>;
}): </span><span>TVValidationResultCore</span><span>;

</span><span>/** Merge/Augmente les metadata d’un TVValidationResultCore (immutabilité) */</span><span>
</span><span>export</span><span></span><span>function</span><span></span><span>withTVMetadata</span><span>(
  r: TVValidationResultCore,
  patch: Record<</span><span>string</span><span>, </span><span>unknown</span><span>>
): </span><span>TVValidationResultCore</span><span>;
</span></span></code></div></div></pre>

### 4.3 `index.ts`

<pre class="overflow-visible!" data-start="10652" data-end="10722"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span> * </span><span>from</span><span></span><span>"./normalizers"</span><span>;
</span><span>export</span><span> * </span><span>from</span><span></span><span>"./converters"</span><span>;
</span></span></code></div></div></pre>

---

## 5) Exemples complets

### 5.1 De `CalculationResult<M1Details>` à `UniversalResult`

<pre class="overflow-visible!" data-start="10816" data-end="11380"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>import</span><span> { toUniversalResult } </span><span>from</span><span></span><span>"AlgorithmLab/types/utils"</span><span>;
</span><span>import</span><span></span><span>type</span><span> { </span><span>CalculationResult</span><span>, M1Details } </span><span>from</span><span></span><span>"AlgorithmLab/types/core"</span><span>;

</span><span>const</span><span></span><span>lowLevel</span><span>: </span><span>CalculationResult</span><span><M1Details> = {
  </span><span>prediction</span><span>: </span><span>"M1_HIGH"</span><span>,
  </span><span>confidence</span><span>: </span><span>0.83</span><span>,
  </span><span>details</span><span>: { </span><span>value</span><span>: </span><span>0.42</span><span>, </span><span>actionVerbCount</span><span>: </span><span>7</span><span>, </span><span>totalTokens</span><span>: </span><span>85</span><span>, </span><span>verbsFound</span><span>: [</span><span>"aller"</span><span>, </span><span>"faire"</span><span>] },
  </span><span>processingTime</span><span>: </span><span>12</span><span>
};

</span><span>const</span><span> uni = </span><span>toUniversalResult</span><span>(lowLevel, {
  </span><span>algorithmVersion</span><span>: </span><span>"1.2.3"</span><span>,
  </span><span>metadata</span><span>: { </span><span>inputSignature</span><span>: </span><span>"sha256:..."</span><span>, </span><span>executionPath</span><span>: [</span><span>"tokenize"</span><span>, </span><span>"match"</span><span>] }
});
</span><span>// -> UniversalResult homogène pour l’UI</span><span>
</span></span></code></div></div></pre>

### 5.2 De `UniversalResult` à `TVValidationResultCore` (UI)

<pre class="overflow-visible!" data-start="11443" data-end="11998"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>import</span><span> { toTVValidationResultCore, withTVMetadata } </span><span>from</span><span></span><span>"AlgorithmLab/types/utils"</span><span>;
</span><span>import</span><span></span><span>type</span><span> { </span><span>TVValidationResultCore</span><span> } </span><span>from</span><span></span><span>"AlgorithmLab/types/core"</span><span>;

</span><span>const</span><span></span><span>row</span><span>: </span><span>TVValidationResultCore</span><span> = </span><span>toTVValidationResultCore</span><span>({
  </span><span>verbatim</span><span>: </span><span>"Je vais m'en occuper rapidement."</span><span>,
  </span><span>goldStandard</span><span>: </span><span>"ENGAGEMENT"</span><span>,
  </span><span>prediction</span><span>: </span><span>"ENGAGEMENT"</span><span>,
  </span><span>confidence</span><span>: </span><span>0.9</span><span>,
  </span><span>processingTime</span><span>: </span><span>18</span><span>,
  </span><span>metadata</span><span>: { </span><span>turnId</span><span>: </span><span>1234</span><span> }
});

</span><span>const</span><span> rowWithCtx = </span><span>withTVMetadata</span><span>(row, {
  </span><span>prev1_turn_verbatim</span><span>: </span><span>"Pouvez-vous faire quelque chose ?"</span><span>,
  </span><span>next_turn_verbatim</span><span>: </span><span>"Merci beaucoup."</span><span>
});
</span></span></code></div></div></pre>

### 5.3 Pont local `ResultsPanel/types.ts` (extension sûre)

<pre class="overflow-visible!" data-start="12060" data-end="12502"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>import</span><span></span><span>type</span><span> {
  </span><span>TVValidationResultCore</span><span></span><span>as</span><span></span><span>CoreTVResult</span><span>,
  </span><span>TVMetadataCore</span><span></span><span>as</span><span></span><span>CoreTVMeta</span><span>
} </span><span>from</span><span></span><span>"AlgorithmLab/types/core"</span><span>;

</span><span>export</span><span></span><span>interface</span><span></span><span>TVMetadata</span><span></span><span>extends</span><span></span><span>CoreTVMeta</span><span> {
  prev1_turn_verbatim?: </span><span>string</span><span>;
  next_turn_verbatim?: </span><span>string</span><span>;
  classifier?: </span><span>string</span><span>;
  model?: </span><span>string</span><span>;
  error?: </span><span>string</span><span>;
  </span><span>// … autres champs purement UI</span><span>
}

</span><span>export</span><span></span><span>interface</span><span></span><span>TVValidationResult</span><span></span><span>extends</span><span></span><span>Omit</span><span><</span><span>CoreTVResult</span><span>, "metadata"> {
  metadata?: </span><span>TVMetadata</span><span>;
}
</span></span></code></div></div></pre>

---

## 6) Règles d’architecture

- `ui` **consomme** `core`, **jamais** l’inverse.
- `algorithms` **consomme** `core`, **ne dépend pas** de `ui`.
- `utils` est **transversal** mais **pur** (pas de React / MUI).
- L’**adaptateur universel** (`createUniversalAlgorithm`) est l’unique point d’entrée des algorithmes vers l’UI.

---

## 7) Checklists de validation

- [ ] Aucun fichier `ui/` importé dans `algorithms/` ou `core/`.
- [ ] `utils/` n’importe pas `ui/`.
- [ ] Tous les algorithmes passent par `createUniversalAlgorithm` (plus de `wrapX/Y/M2`).
- [ ] `ResultsPanel` & co. n’utilisent que les types documentés ici.
- [ ] Les **normalizers** gèrent bien les labels actuels (tests rapides).
- [ ] Les conversions gardent l’immutabilité (pas de mutation d’objets d’entrée).

---

## 8) Notes de migration

- **Phase 1 (coexistence)** : conservez les **ponts locaux** dans les composants sensibles (ex: `ResultsPanel/types.ts`).
- **Phase 2 (imports)** : migrez les imports vers `AlgorithmLab/types/*` (scripts de remplacement + backup).
- **Phase 3 (nettoyage)** : supprimez progressivement les shims devenus inutiles et unifiez les chemins.
