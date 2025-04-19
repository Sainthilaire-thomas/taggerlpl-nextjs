// components/layout/GlobalNavbar.jsx
"use client";

import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import Link from "next/link";
import AuthStatus from "../AuthStatus";

export default function GlobalNavbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" style={{ color: "white", textDecoration: "none" }}>
            Tagging App
          </Link>
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Link
            href="/tagging"
            style={{ color: "white", textDecoration: "none" }}
          >
            Tagging
          </Link>
          <AuthStatus />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
