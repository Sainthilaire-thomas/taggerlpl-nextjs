"use client";
import React from "react";
import { Box, Typography, Tooltip, alpha, useTheme } from "@mui/material";

type Tone = "A" | "B" | "CURRENT";

const ToneLine: React.FC<{
  text?: string | null;
  prefix?: string;
  lines?: number;
  tone?: Tone;
  strong?: boolean;
  italic?: boolean;
  tooltip?: string;
}> = ({ text, prefix, lines = 1, tone = "A", strong, italic, tooltip }) => {
  const theme = useTheme();
  const content = text ?? "—";

  const base =
    tone === "CURRENT"
      ? theme.palette.primary.main
      : theme.palette.text.primary;

  const bg =
    tone === "CURRENT"
      ? alpha(base, theme.palette.mode === "dark" ? 0.26 : 0.16)
      : "transparent";

  const ring =
    tone === "CURRENT"
      ? `inset 0 0 0 1px ${alpha(
          base,
          theme.palette.mode === "dark" ? 0.45 : 0.22
        )}`
      : undefined;

  const color =
    tone === "CURRENT"
      ? theme.palette.text.primary
      : theme.palette.text.secondary;
  const fontVariant = strong || tone === "CURRENT" ? "body2" : "caption";

  const node = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        alignItems: "start",
        gap: 0.5,
      }}
    >
      <Box
        sx={{
          mt: 0.25,
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor:
            tone === "CURRENT"
              ? alpha(base, 0.5)
              : alpha(theme.palette.text.secondary, 0.35),
        }}
      />
      <Box
        sx={{
          px: 0.5,
          py: 0.25,
          borderRadius: 1,
          backgroundColor: bg,
          boxShadow: ring,
        }}
      >
        <Typography
          variant={fontVariant}
          sx={{
            color,
            display: "-webkit-box",
            overflow: "hidden",
            textOverflow: "ellipsis",
            WebkitLineClamp: lines,
            WebkitBoxOrient: "vertical",
            wordBreak: "break-word",
            lineHeight: 1.25,
            fontWeight: tone === "CURRENT" ? 700 : 400,
            fontStyle: italic ? "italic" : "normal",
          }}
        >
          {prefix ? `${prefix} ` : ""}
          {content}
        </Typography>
      </Box>
    </Box>
  );

  return tooltip ? (
    <Tooltip title={tooltip} arrow placement="top">
      <Box>{node}</Box>
    </Tooltip>
  ) : (
    node
  );
};

export interface TurnWithContextProps {
  prev2Text?: string | null;
  prev1Text?: string | null;
  currentText?: string | null;
  next1Text?: string | null;
  prev2Speaker?: string | null;
  prev1Speaker?: string | null;
  currentSpeaker?: string | null;
  next1Speaker?: string | null;
  /** Combien de lignes max pour le tour courant */
  currentLines?: number;
}

/** Affiche −2 / −1 / 0 / +1 avec le style ResultSample */
const TurnWithContext: React.FC<TurnWithContextProps> = ({
  prev2Text,
  prev1Text,
  currentText,
  next1Text,
  prev2Speaker,
  prev1Speaker,
  currentSpeaker,
  next1Speaker,
  currentLines = 2,
}) => {
  const p2prefix = prev2Speaker ? `[${prev2Speaker}]` : "−2";
  const p1prefix = prev1Speaker ? `[${prev1Speaker}]` : "−1";
  const c0prefix = currentSpeaker ? `[${currentSpeaker}]` : "0";
  const n1prefix = next1Speaker ? `[${next1Speaker}]` : "+1";

  return (
    <Box sx={{ display: "grid", gap: 0.5 }}>
      <ToneLine
        text={prev2Text}
        prefix={p2prefix}
        tone="A"
        italic
        tooltip={prev2Text || ""}
      />
      <ToneLine
        text={prev1Text}
        prefix={p1prefix}
        tone="B"
        tooltip={prev1Text || ""}
      />
      <ToneLine
        text={currentText}
        prefix={c0prefix}
        tone="CURRENT"
        strong
        lines={currentLines}
        tooltip={currentText || ""}
      />
      <ToneLine
        text={next1Text}
        prefix={n1prefix}
        tone="B"
        italic
        tooltip={next1Text || ""}
      />
    </Box>
  );
};


export { ToneLine };
export default TurnWithContext;
