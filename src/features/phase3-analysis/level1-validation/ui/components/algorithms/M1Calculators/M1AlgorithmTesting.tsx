"use client";
import React from "react";
import { BaseAlgorithmTesting } from '../shared/BaseAlgorithmTesting';

export default function M1AlgorithmTesting() {
  return (
    <BaseAlgorithmTesting
      variableLabel="M1 — Densité de verbes d’action"
      defaultClassifier="RegexM1Calculator" // ex. ou "M1ActionVerbCounter"
      target="M1"
    />
  );
}
