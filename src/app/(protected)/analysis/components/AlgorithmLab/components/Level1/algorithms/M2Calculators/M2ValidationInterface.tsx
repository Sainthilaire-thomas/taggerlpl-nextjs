"use client";

import React from "react";

// M2ValidationInterface.tsx - APRÈS (FIX CRITIQUE)
import { BaseAlgorithmTesting } from "../BaseAlgorithmTesting";
export default function M2ValidationInterface() {
  return (
    <BaseAlgorithmTesting
      variableLabel="M2 — Alignement conseiller ↔ client"
      defaultClassifier="M2CompositeAlignment"
      target="M2"
    />
  );
}
