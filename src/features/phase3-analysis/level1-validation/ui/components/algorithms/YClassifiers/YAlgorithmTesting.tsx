"use client";
import React from "react";
import { BaseAlgorithmTesting } from '../shared/BaseAlgorithmTesting';

const YAlgorithmTesting: React.FC = () => (
  <BaseAlgorithmTesting
    variableLabel="Y — Réactions Client"
    defaultClassifier="RegexYClassifier" // tu l'as déjà enregistré
    target="Y"
  />
);

export default YAlgorithmTesting;
