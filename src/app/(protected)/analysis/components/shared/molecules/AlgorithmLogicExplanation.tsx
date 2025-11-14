// AlgorithmLogicExplanation.tsx - Version enrichie complète
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Psychology as PsychologyIcon,
  Lightbulb as LightbulbIcon,
  MenuBook as MenuBookIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Launch as LaunchIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

// Types étendus
export interface ExtendedAlgorithmLogicProps {
  algorithmName: string;
  description: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    example: string;
    technical: string;
    lexicons?: {
      [sentiment: string]: {
        mots: string[];
        expressions: string[];
      };
    };
  }>;
  metrics: Array<{
    name: string;
    description: string;
    formula: string;
    interpretation: string;
  }>;
  theoreticalBackground: {
    theory: string;
    source: string;
    keyPrinciples: string[];
  };
  interpretation: {
    scoreRanges: Array<{
      range: string;
      label: string;
      color: "success" | "info" | "warning" | "error";
      meaning: string;
    }>;
    practicalAdvice: string[];
  };
  lexiconDetails?: {
    title: string;
    description: string;
    categories: Array<{
      name: string;
      color: string;
      description: string;
      wordCount: string;
      expressionCount: string;
      examples: string[];
    }>;
    technicalNotes: string[];
  };
}

// Composant pour afficher une catégorie de lexique
const LexiconCategory: React.FC<{
  category: any;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ category, isExpanded, onToggle }) => (
  <Card
    variant="outlined"
    sx={{ 
      flex: "1 1 300px", 
      cursor: "pointer",
      transition: "all 0.2s",
      '&:hover': { 
        boxShadow: 2,
        transform: 'translateY(-2px)'
      }
    }}
    onClick={onToggle}
  >
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Chip
          label={category.name}
          sx={{ 
            bgcolor: category.color, 
            color: "white",
            fontWeight: 'bold'
          }}
          size="small"
        />
        <Typography variant="body2" color="text.secondary">
          {category.wordCount} • {category.expressionCount}
        </Typography>
        <IconButton size="small" sx={{ ml: 'auto' }}>
          {isExpanded ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
      </Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {category.description}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {isExpanded ? "Cliquer pour masquer" : "Cliquer pour voir les détails"}
      </Typography>
    </CardContent>
  </Card>
);

// Composant pour afficher les détails d'un lexique
const DetailedLexicon: React.FC<{
  sentiment: string;
  data: { mots: string[]; expressions: string[] };
  color: string;
}> = ({ sentiment, data, color }) => (
  <Box sx={{ mb: 3 }}>
    <Typography
      variant="h6"
      gutterBottom
      sx={{ color, display: 'flex', alignItems: 'center', gap: 1 }}
    >
      <MenuBookIcon />
      {sentiment} ({data.mots.length + data.expressions.length} patterns)
    </Typography>

    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        🔤 Mots-clés ({data.mots.length}):
      </Typography>
      <Box sx={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: 0.5,
        maxHeight: '120px',
        overflowY: 'auto',
        p: 1,
        bgcolor: 'grey.50',
        borderRadius: 1
      }}>
        {data.mots.map((mot, index) => (
          <Chip
            key={index}
            label={mot}
            size="small"
            variant="outlined"
            color={
              sentiment === "POSITIF"
                ? "success"
                : sentiment === "NEGATIF"
                ? "error"
                : "info"
            }
          />
        ))}
      </Box>
    </Box>

    <Box>
      <Typography variant="subtitle2" gutterBottom>
        💬 Expressions ({data.expressions.length}):
      </Typography>
      <Box sx={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: 0.5,
        maxHeight: '120px',
        overflowY: 'auto',
        p: 1,
        bgcolor: 'grey.50',
        borderRadius: 1
      }}>
        {data.expressions.map((expression, index) => (
          <Chip
            key={index}
            label={`"${expression}"`}
            size="small"
            color={
              sentiment === "POSITIF"
                ? "success"
                : sentiment === "NEGATIF"
                ? "error"
                : "info"
            }
            sx={{ fontStyle: 'italic' }}
          />
        ))}
      </Box>
    </Box>
  </Box>
);

// Composant principal
const AlgorithmLogicExplanation: React.FC<ExtendedAlgorithmLogicProps> = ({
  algorithmName,
  description,
  steps,
  metrics,
  theoreticalBackground,
  interpretation,
  lexiconDetails,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showLexicons, setShowLexicons] = useState(false);
  const [expandedLexicon, setExpandedLexicon] = useState<string | null>(null);
  const [lexiconDialogOpen, setLexiconDialogOpen] = useState(false);

  const handleStepClick = (step: number) => {
    setActiveStep(activeStep === step ? -1 : step);
  };

  const getLexiconStep = () => {
    return steps.find(step => step.lexicons);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "POSITIF": return "success.main";
      case "NEGATIF": return "error.main";
      case "NEUTRE": return "info.main";
      default: return "text.primary";
    }
  };

  return (
    <Card sx={{ mt: 3, mb: 3 }}>
      <CardContent>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <PsychologyIcon color="primary" />
          {algorithmName}
        </Typography>

        <Typography variant="body1" paragraph color="text.secondary">
          {description}
        </Typography>

        {/* Section Lexiques améliorée */}
        {lexiconDetails && (
          <Card variant="outlined" sx={{ mb: 4, bgcolor: 'background.default' }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <MenuBookIcon color="secondary" />
                  {lexiconDetails.title}
                </Typography>
                <Button
                  size="small"
                  variant={showLexicons ? "contained" : "outlined"}
                  startIcon={showLexicons ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  onClick={() => setShowLexicons(!showLexicons)}
                  color="secondary"
                >
                  {showLexicons ? "Masquer" : "Afficher"} les lexiques
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<LaunchIcon />}
                  onClick={() => setLexiconDialogOpen(true)}
                  color="info"
                >
                  Vue détaillée
                </Button>
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                {lexiconDetails.description}
              </Typography>

              <Collapse in={showLexicons}>
                <Box sx={{ mt: 2 }}>
                  {/* Vue d'ensemble des lexiques */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
                    {lexiconDetails.categories.map((category) => (
                      <LexiconCategory
                        key={category.name}
                        category={category}
                        isExpanded={expandedLexicon === category.name}
                        onToggle={() =>
                          setExpandedLexicon(
                            expandedLexicon === category.name ? null : category.name
                          )
                        }
                      />
                    ))}
                  </Box>

                  {/* Détails du lexique sélectionné */}
                  <Collapse in={!!expandedLexicon}>
                    {expandedLexicon && (
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          {(() => {
                            const category = lexiconDetails.categories.find(
                              (cat) => cat.name === expandedLexicon
                            );
                            return category ? (
                              <>
                                <Typography
                                  variant="h6"
                                  gutterBottom
                                  sx={{ color: category.color }}
                                >
                                  📋 Lexique {category.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                  {category.description}
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                  {category.examples.map((example, index) => (
                                    <Alert key={index} severity="info" sx={{ p: 1 }}>
                                      <Typography variant="body2">{example}</Typography>
                                    </Alert>
                                  ))}
                                </Box>
                              </>
                            ) : null;
                          })()}
                        </CardContent>
                      </Card>
                    )}
                  </Collapse>

                  {/* Notes techniques */}
                  {lexiconDetails.technicalNotes.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          ⚙️ Notes Techniques sur l'Analyse Sémantique
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {lexiconDetails.technicalNotes.map((note, index) => (
                            <Alert key={index} severity="info" sx={{ p: 1 }}>
                              <Typography variant="body2">{note}</Typography>
                            </Alert>
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Processus algorithmique */}
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <CodeIcon color="primary" />
          Processus Algorithmique
        </Typography>

        <Stepper orientation="vertical" sx={{ mt: 2 }}>
          {steps.map((step, index) => (
            <Step key={step.id} active={true} expanded={activeStep === index}>
              <StepLabel
                sx={{ cursor: "pointer" }}
                onClick={() => handleStepClick(index)}
              >
                <Typography variant="subtitle1">
                  {step.title}
                  {step.lexicons && <MenuBookIcon sx={{ ml: 1, fontSize: '1rem' }} color="secondary" />}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" paragraph>
                  {step.description}
                </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Exemple :</strong> {step.example}
                  </Typography>
                </Alert>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Détails techniques</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", mb: 2 }}>
                      {step.technical}
                    </Typography>

                    {/* Affichage condensé des lexiques dans l'étape */}
                    {step.lexicons && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          🔤 Aperçu des lexiques utilisés:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {Object.entries(step.lexicons).map(([sentiment, data]) => (
                            <Chip
                              key={sentiment}
                              label={`${sentiment}: ${data.mots.length + data.expressions.length} patterns`}
                              color={
                                sentiment === "POSITIF" ? "success" :
                                sentiment === "NEGATIF" ? "error" : "info"
                              }
                              variant="outlined"
                              size="small"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        <Divider sx={{ my: 3 }} />

        {/* Métriques */}
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <CodeIcon color="secondary" />
          Métriques Calculées
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Métrique</strong></TableCell>
                <TableCell><strong>Formule</strong></TableCell>
                <TableCell><strong>Interprétation</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.map((metric, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="subtitle2">{metric.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {metric.description}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                    {metric.formula}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{metric.interpretation}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 3 }} />

        {/* Fondements théoriques */}
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <PsychologyIcon color="info" />
          Fondements Théoriques
        </Typography>

        <Typography variant="body2" paragraph>
          {theoreticalBackground.theory}
        </Typography>

        <Typography variant="caption" color="text.secondary" paragraph>
          <strong>Source :</strong> {theoreticalBackground.source}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Principes clés :
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {theoreticalBackground.keyPrinciples.map((principle, index) => (
              <Box key={index} sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                <Typography variant="body2">• {principle}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Interprétation des résultats */}
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <LightbulbIcon color="warning" />
          Guide d'Interprétation
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {interpretation.scoreRanges.map((range, index) => (
            <Chip
              key={index}
              label={`${range.range}: ${range.label}`}
              color={range.color}
              variant="outlined"
            />
          ))}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Conseils pratiques :
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {interpretation.practicalAdvice.map((advice, index) => (
              <Alert key={index} severity="info" sx={{ p: 1 }}>
                <Typography variant="body2">{advice}</Typography>
              </Alert>
            ))}
          </Box>
        </Box>

        {/* Interprétation des scores */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Signification des scores :
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {interpretation.scoreRanges.map((range, index) => (
              <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Chip
                  label={range.range}
                  color={range.color}
                  size="small"
                  sx={{ minWidth: "80px" }}
                />
                <Typography variant="body2">
                  <strong>{range.label}:</strong> {range.meaning}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>

      {/* Dialog pour vue détaillée des lexiques */}
      <Dialog 
        open={lexiconDialogOpen} 
        onClose={() => setLexiconDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBookIcon color="secondary" />
            Lexiques Complets - Vue Détaillée
          </Box>
          <IconButton onClick={() => setLexiconDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {(() => {
            const lexiconStep = getLexiconStep();
            return lexiconStep?.lexicons ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {Object.entries(lexiconStep.lexicons).map(([sentiment, data]) => (
                  <DetailedLexicon
                    key={sentiment}
                    sentiment={sentiment}
                    data={data}
                    color={getSentimentColor(sentiment)}
                  />
                ))}
              </Box>
            ) : (
              <Typography>Aucun lexique disponible</Typography>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLexiconDialogOpen(false)} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AlgorithmLogicExplanation;
