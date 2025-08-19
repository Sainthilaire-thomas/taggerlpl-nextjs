// ============= shared/atoms/AlgorithmChip.tsx =============
import React from "react";
import { Chip, Tooltip } from "@mui/material";

interface AlgorithmChipProps {
  id: string;
  name: string;
  description?: string;
  accuracy?: number;
  time?: number;
  differential?: number;
  isSelected?: boolean;
  onClick?: (id: string) => void;
}

export const AlgorithmChip: React.FC<AlgorithmChipProps> = ({
  id,
  name,
  description,
  accuracy,
  time,
  differential,
  isSelected = false,
  onClick,
}) => {
  const chipContent = (
    <Chip
      label={name}
      variant={isSelected ? "filled" : "outlined"}
      color={isSelected ? "primary" : "default"}
      size="small"
      onClick={() => onClick?.(id)}
      sx={{
        cursor: onClick ? "pointer" : "default",
        fontSize: "0.75rem",
      }}
    />
  );

  if (description || accuracy || time || differential) {
    const tooltipContent = (
      <div>
        {description && <div>{description}</div>}
        {accuracy && <div>Précision: {accuracy}%</div>}
        {time && <div>Temps: {time}ms</div>}
        {differential && <div>Différentiel: +{differential}%</div>}
      </div>
    );

    return (
      <Tooltip title={tooltipContent} arrow>
        {chipContent}
      </Tooltip>
    );
  }

  return chipContent;
};

export default AlgorithmChip;
