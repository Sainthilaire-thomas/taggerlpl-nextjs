// pages/api/calls/stats.ts
import { NextApiRequest, NextApiResponse } from "next";

interface StatsRequest {
  callIds?: string[];
  operations?: ("transcription" | "diarization")[];
  timeframe?: {
    startDate?: string;
    endDate?: string;
  };
  groupBy?: "day" | "week" | "month" | "origin";
}

interface StatsResponse {
  success: boolean;
  stats?: StatsPayload;
  error?: {
    message: string;
    code?: string;
  };
}

type TimeSeriesPoint = {
  period: string;
  transcriptionRequests: number;
  diarizationRequests: number;
  totalCost: number;
  successRate: number;
};

type StatsPayload = {
  transcription?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalMinutesProcessed: number;
    averageProcessingTime: number;
    successRate: number;
    totalCost: number;
    costPerMinute: number;
    lastUpdated: string;
    modelBreakdown?: Array<{
      model: string;
      requests: number;
      minutes: number;
      cost: number;
    }>;
    languageBreakdown?: Array<{
      language: string;
      requests: number;
      minutes: number;
      avgAccuracy?: number;
    }>;
  };

  diarization?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalMinutesProcessed: number;
    averageProcessingTime: number;
    successRate: number;
    totalCost: number;
    costPerMinute: number;
    lastUpdated: string;
    avgSpeakerCount: number;
    confidenceDistribution: {
      high: number;
      medium: number;
      low: number;
    };
  };

  combined?: {
    totalOperations: number;
    totalCost: number;
    peakUsageHours: string[];
    errorsByType: Array<{
      errorCode: string;
      count: number;
      percentage: number;
    }>;
  };

  timeSeries?: TimeSeriesPoint[]; // 👈 clé explicitement présente
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatsResponse>
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: {
        message: "Method not allowed",
        code: "METHOD_NOT_ALLOWED",
      },
    });
  }

  try {
    console.log("📊 [API] Getting calls statistics");

    // Récupération des paramètres
    const params: StatsRequest =
      req.method === "GET" ? (req.query as any) : req.body;

    const {
      callIds,
      operations = ["transcription", "diarization"],
      timeframe,
      groupBy,
    } = params;

    console.log("📋 [API] Stats request params:", {
      callIds: callIds?.length || "all",
      operations,
      timeframe,
      groupBy,
    });

    // Simulation des métriques (à remplacer par vraie logique)
    const stats = await generateStatsData(params);

    console.log("✅ [API] Stats generated successfully");

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("❌ [API] Stats generation failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    res.status(500).json({
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: "STATS_GENERATION_FAILED",
      },
    });
  }
}

/**
 * Génère les données statistiques
 * TODO: Remplacer par vraie logique de récupération depuis base de données
 */
async function generateStatsData(params: StatsRequest): Promise<StatsPayload> {
  const { operations, timeframe, groupBy } = params;

  const stats: StatsPayload = {}; // 👈 plus de NonNullable<StatsResponse["stats"]>
  // ...
  if (groupBy) {
    stats.timeSeries = generateTimeSeriesData(groupBy, timeframe);
  }
  return stats;
}

/**
 * Génère des données de série temporelle
 */
function generateTimeSeriesData(
  groupBy: "day" | "week" | "month" | "origin",
  timeframe?: { startDate?: string; endDate?: string }
): NonNullable<StatsPayload["timeSeries"]> {
  const now = new Date();
  const series: NonNullable<StatsPayload["timeSeries"]> = [];
  // ... (le corps reste identique)
  return series;
}
