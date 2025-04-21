"use client";

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";

export default function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader title="Appels" />
            <CardContent>
              <Typography variant="h3" align="center">
                16
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                Appels disponibles pour tagging
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader title="Tags" />
            <CardContent>
              <Typography variant="h3" align="center">
                42
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                Tags dans le référentiel
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader title="Tours taggés" />
            <CardContent>
              <Typography variant="h3" align="center">
                324
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                Tours de parole taggés
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader title="Famille la plus utilisée" />
            <CardContent>
              <Typography variant="h3" align="center">
                REFLET
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                84 utilisations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Appels récemment taggés
      </Typography>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="body2" color="textSecondary">
            Cette section sera développée pour afficher les appels récemment
            traités.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
