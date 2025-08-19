// 📋 TYPES - shared/atoms/types.ts

export interface IndicatorHeaderProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
}

export interface ScoreChipProps {
  value: number;
  suffix?: string;
  precision?: number;
  thresholds?: {
    excellent: number;
    good: number;
  };
}

export interface ColorLegendProps {
  items?: Array<{
    color: string;
    label: string;
  }>;
  thresholds?: {
    excellent: number;
    good: number;
  };
}

export interface AlgorithmDetailDialogProps {
  algorithm: import("../hooks/useAlgorithmDialog").AlgorithmDetail | null;
  isOpen: boolean;
  onClose: () => void;
  icon?: React.ElementType;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
}
