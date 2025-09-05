"use client";
import React from "react";
import { BaseAlgorithmTesting } from "../BaseAlgorithmTesting";

export default function XValidationInterface() {
  return (
    <BaseAlgorithmTesting
      variableLabel="X — Stratégies Conseiller"
      defaultClassifier="RegexConseillerClassifier"
    />
  );
}
