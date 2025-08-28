// app/api/algolab/classifiers/route.ts

import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { getClassifierStatus } from "@/algorithms/level1/shared/initializeClassifiers";

export async function GET() {
  // Cette fonction exécute initializeClassifiers côté serveur
  const status = getClassifierStatus();
  return NextResponse.json(status);
}
