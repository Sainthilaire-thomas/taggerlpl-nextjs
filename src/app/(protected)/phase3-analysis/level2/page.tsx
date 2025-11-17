"use client";

import { Level2Interface } from "@/features/phase3-analysis/level2-hypotheses/ui/components/Level2Interface";
import { Box, Typography, Breadcrumbs, Link } from "@mui/material";
import NextLink from "next/link";

export default function Level2Page() {
  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={NextLink} href="/phase3-analysis" underline="hover">
          Phase 3
        </Link>
        <Typography color="text.primary">Level 2: Hypotheses Testing</Typography>
      </Breadcrumbs>
      
      <Level2Interface />
    </Box>
  );
}
