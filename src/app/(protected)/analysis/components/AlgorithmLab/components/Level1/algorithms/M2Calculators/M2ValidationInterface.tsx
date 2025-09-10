"use client";

import React from "react";

// Import du pattern unifié
import { BaseAlgorithmTesting } from "../BaseAlgorithmTesting";

export default function M2ValidationInterface() {
  return (
    <BaseAlgorithmTesting
      target="M2"
      availableAlgorithms={[
        "M2CompositeAlignment",
        "M2LexicalAlignment",
        "M2SemanticAlignment",
      ]}
      defaultAlgorithm="M2CompositeAlignment"
      domainLabel="Alignement M2"
      description="Test des algorithmes d'alignement interactionnel (lexical + sémantique + composite)"
    />
  );
}
