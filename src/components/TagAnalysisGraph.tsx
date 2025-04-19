"use client";

import { useEffect, useState, useRef, FC } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import * as echarts from "echarts";
import { supabase } from "@/lib/supabaseClient";
import TurnTagEditor from "./TurnTagEditor";
import ArrivalTable from "./ArrivalTable";
import DepartureTable from "./DepartureTable";

// Constants
const allowedFamilies: string[] = [
  "EXPLICATION",
  "ENGAGEMENT",
  "OUVERTURE",
  "REFLET",
];
const allowedDestinations: string[] = [
  "CLIENT POSITIF",
  "CLIENT NEUTRE",
  "CLIENT NEGATIF",
];

const familyColors: Record<string, string> = {
  ENGAGEMENT: "green",
  OUVERTURE: "green",
  REFLET: "green",
  EXPLICATION: "red",
};

const destinationColors: Record<string, string> = {
  "CLIENT POSITIF": "green",
  "CLIENT NEUTRE": "gray",
  "CLIENT NEGATIF": "red",
};

// Types
interface TurnTaggedItem {
  id: string;
  call_id: string;
  tag: string;
  next_turn_tag: string;
  verbatim: string;
  next_turn_verbatim: string;
  next_turn_tag_auto: string;
  score_auto: number | null;
}

interface SankeyNode {
  name: string;
  rawName?: string;
  itemStyle: {
    color: string;
  };
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  detailedData?: TurnTaggedItem[];
  proportionFromSource?: string;
  proportionInTarget?: string;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface TagAnalysisGraphsProps {
  // Ajoutez ici des props si nécessaire
}

const labelTranslations: Record<string, string> = {
  OUVERTURE: "OPENING",
  ENGAGEMENT: "ENGAGEMENT",
  REFLET: "REFLECTION",
  EXPLICATION: "EXPLANATION",
  "CLIENT POSITIF": "POSITIVE CLIENT",
  "CLIENT NEUTRE": "NEUTRAL CLIENT",
  "CLIENT NEGATIF": "NEGATIVE CLIENT",
};

const TagAnalysisGraphs: FC<TagAnalysisGraphsProps> = () => {
  const [data, setData] = useState<SankeyData>({ nodes: [], links: [] });
  const [refletData, setRefletData] = useState<SankeyData>({
    nodes: [],
    links: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [detailedData, setDetailedData] = useState<TurnTaggedItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedTurnTag, setSelectedTurnTag] = useState<TurnTaggedItem | null>(
    null
  );
  const sankeyRef = useRef<HTMLDivElement>(null);
  const refletSankeyRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [origins, setOrigins] = useState<string[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [clickedPath, setClickedPath] = useState<string>(""); // Stocke le chemin cliqué

  useEffect(() => {
    const fetchOrigins = async () => {
      try {
        const { data: originsData, error: originsError } = await supabase
          .from("call")
          .select("origine");

        if (originsError) {
          console.error(
            "Erreur lors de la récupération des origines :",
            originsError.message
          );
          throw originsError;
        }
        console.log("originsData", originsData);

        const uniqueOrigins = [
          ...new Set(originsData.map((item) => item.origine)),
        ].filter(Boolean) as string[];

        console.log("Origines récupérées :", uniqueOrigins);
        setOrigins(uniqueOrigins);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        console.error(
          "Erreur inattendue lors de la récupération des origines :",
          errorMessage
        );
        setOrigins([]);
      }
    };

    fetchOrigins();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tags
      const { data: tagsData, error: tagsError } = await supabase
        .from("lpltag")
        .select("label, family")
        .in("family", allowedFamilies);

      if (tagsError) throw new Error(tagsError.message);

      const tagToFamily = Object.fromEntries(
        tagsData.map(({ label, family }) => [label, family])
      );

      // Fetch call_ids by origin if an origin is selected
      let callIds: string[] | null = null;
      if (selectedOrigin) {
        const { data: callsData, error: callsError } = await supabase
          .from("call")
          .select("callid")
          .eq("origine", selectedOrigin);

        if (callsError) throw new Error(callsError.message);

        callIds = callsData.map((call) => call.callid);
      }

      // Fetch turntagged data
      const query = supabase.from("turntagged").select(`
        id,
        call_id,
        tag,
        next_turn_tag,
        verbatim,
        next_turn_verbatim, 
        next_turn_tag_auto, 
        score_auto
      `);

      if (callIds) {
        query.in("call_id", callIds);
      }

      const { data: turnTaggedData, error: turnTaggedError } = await query;
      console.log("Données récupérées depuis Supabase :", turnTaggedData);

      if (turnTaggedError) throw new Error(turnTaggedError.message);

      // Process main Sankey data
      const aggregatedData: Record<
        string,
        { count: number; verbatim: { verbatim: string }[] }
      > = (turnTaggedData as TurnTaggedItem[]).reduce(
        (acc, { tag, next_turn_tag, verbatim }) => {
          const family = tagToFamily[tag];
          if (family && allowedDestinations.includes(next_turn_tag)) {
            const key = `${family}-${next_turn_tag}`;
            acc[key] = acc[key] || { count: 0, verbatim: [] };
            acc[key].count += 1;
            acc[key].verbatim.push({ verbatim });
          }
          return acc;
        },
        {} as Record<
          string,
          { count: number; verbatim: { verbatim: string }[] }
        >
      );

      const sankeyNodes: SankeyNode[] = Array.from(
        new Set([...Object.values(tagToFamily), ...allowedDestinations])
      ).map((name) => ({
        name: labelTranslations[name] || name, // traduction ici
        rawName: name, // optionnel si besoin de garder la version FR pour un mapping
        itemStyle: {
          color: familyColors[name] || destinationColors[name] || "gray",
        },
      }));

      const sankeyLinks: SankeyLink[] = Object.entries(aggregatedData).map(
        ([key, value]) => {
          const [source, target] = key.split("-");
          return {
            source: labelTranslations[source] || source, // traduit ici
            target: labelTranslations[target] || target, // traduit ici
            value: value.count,
            detailedData: (turnTaggedData as TurnTaggedItem[])
              .filter(
                (tag) =>
                  tagToFamily[tag.tag] === source &&
                  tag.next_turn_tag === target
              )
              .map((tag) => ({
                id: tag.id,
                call_id: tag.call_id,
                tag: tag.tag,
                verbatim: tag.verbatim,
                next_turn_tag: tag.next_turn_tag,
                next_turn_verbatim: tag.next_turn_verbatim,
                next_turn_tag_auto: tag.next_turn_tag_auto,
                score_auto: tag.score_auto,
              })),
          };
        }
      );

      // Process REFLET-specific Sankey data
      const refletData: Record<string, { count: number }> = (
        turnTaggedData as TurnTaggedItem[]
      )
        .filter(
          ({ tag, next_turn_tag }) =>
            tagToFamily[tag] === "REFLET" &&
            allowedDestinations.includes(next_turn_tag)
        )
        .reduce((acc, { tag, next_turn_tag }) => {
          const key = `${tag}-${next_turn_tag}`;
          acc[key] = acc[key] || { count: 0 };
          acc[key].count += 1;
          return acc;
        }, {} as Record<string, { count: number }>);

      const sortedDestinations = [
        "CLIENT POSITIF",
        "CLIENT NEUTRE",
        "CLIENT NEGATIF",
      ];

      const refletNodes: SankeyNode[] = Array.from(
        new Set([
          ...Object.keys(refletData).map((key) => key.split("-")[0]),
          ...sortedDestinations, // Ajoutez les destinations explicitement
        ])
      )
        .sort((a, b) => {
          const indexA = sortedDestinations.indexOf(a);
          const indexB = sortedDestinations.indexOf(b);

          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.localeCompare(b);
        })
        .map((name) => ({
          name,
          itemStyle: {
            color:
              tagToFamily[name] === "REFLET"
                ? "green"
                : destinationColors[name] || "gray",
          },
        }));

      const refletLinks: SankeyLink[] = Object.entries(refletData).map(
        ([key, value]) => {
          const [source, target] = key.split("-");
          const detailed = (turnTaggedData as TurnTaggedItem[])
            .filter(
              (tag) =>
                tag.tag === source &&
                tag.next_turn_tag === target &&
                tagToFamily[tag.tag] === "REFLET"
            )
            .map((tag) => ({
              id: tag.id,
              call_id: tag.call_id,
              tag: tag.tag,
              verbatim: tag.verbatim,
              next_turn_tag: tag.next_turn_tag,
              next_turn_verbatim: tag.next_turn_verbatim,
              next_turn_tag_auto: tag.next_turn_tag_auto,
              score_auto: tag.score_auto,
            }));

          return {
            source,
            target,
            value: value.count,
            detailedData: detailed,
          };
        }
      );

      setData({ nodes: sankeyNodes, links: sankeyLinks });
      setRefletData({ nodes: refletNodes, links: refletLinks });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      console.error("Erreur lors du fetch :", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedOrigin]);

  const configureSankey = (
    chartRef: HTMLDivElement | null,
    graphData: SankeyData,
    chartTitle: string
  ) => {
    if (!chartRef || !graphData.nodes || !graphData.links) return;

    // Calculer les proportions pour chaque lien
    const totalSourceCounts: Record<string, number> = {};
    const totalTargetCounts: Record<string, number> = {};

    // Total par source et cible
    graphData.links.forEach((link) => {
      totalSourceCounts[link.source] =
        (totalSourceCounts[link.source] || 0) + link.value;
      totalTargetCounts[link.target] =
        (totalTargetCounts[link.target] || 0) + link.value;
    });

    // Ajouter les proportions dans les liens
    const linksWithProportions = graphData.links.map((link) => {
      const totalSource = totalSourceCounts[link.source] || 1;
      const totalTarget = totalTargetCounts[link.target] || 1;

      return {
        ...link,
        proportionFromSource: ((link.value / totalSource) * 100).toFixed(2), // %
        proportionInTarget: ((link.value / totalTarget) * 100).toFixed(2), // %
      };
    });

    const chart = echarts.init(chartRef);

    chart.setOption({
      title: {
        text: chartTitle,
        left: "center",
        textStyle: { color: "#000000" },
      },
      backgroundColor: "#ffffff",
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          if (params.dataType === "edge") {
            const {
              source,
              target,
              value,
              proportionFromSource,
              proportionInTarget,
            } = params.data;
            return `
              <b>${source} → ${target}</b><br/>
              Total : ${value}<br/>
              ${proportionFromSource}% du total de "${source}"<br/>
              ${proportionInTarget}% du total de "${target}"<br/>
            `;
          }
          return params.name;
        },
      },
      series: [
        {
          type: "sankey",
          data: graphData.nodes,
          links: linksWithProportions, // Utiliser les liens mis à jour
          lineStyle: { color: "gradient", opacity: 0.8, curveness: 0.5 },
          emphasis: {
            focus: "adjacency",
          },
          label: {
            show: true,
            fontSize: 20,
            fontWeight: "bold",
            color: "#141414",
            position: "inside",
          },
        },
      ],
    });

    chart.on("click", (params: any) => {
      if (params.dataType === "edge") {
        setDetailedData(params.data.detailedData || []); // Associe les verbatim au Drawer
        setClickedPath(`${params.data.source} → ${params.data.target}`);
        setDrawerOpen(true);
      }
    });
  };

  useEffect(() => {
    if (data.nodes.length > 0 && sankeyRef.current)
      configureSankey(sankeyRef.current, data, "");

    if (refletData.nodes.length > 0 && refletSankeyRef.current)
      configureSankey(refletSankeyRef.current, refletData, "Détail REFLET");
  }, [data, refletData]);

  const handleVerbatimClick = (item: TurnTaggedItem) => {
    setSelectedTurnTag(item); // Passe les données sélectionnées à TurnTagEditor
  };

  const handleOriginChange = (event: SelectChangeEvent<string>) => {
    setSelectedOrigin(event.target.value || null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", marginTop: 4 }}>
        <Typography variant="h6" color="error">
          Erreur : {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxHeight: "100vh",
        overflowY: "auto",
        padding: 2,
        backgroundColor: "#ffffff",
        color: "#000000",
      }}
    >
      <Box sx={{ marginBottom: 2 }}>
        <Typography variant="h6">Filtrer par origine</Typography>
        <Select
          value={selectedOrigin || ""}
          onChange={handleOriginChange}
          displayEmpty
          fullWidth
        >
          <MenuItem value="">
            <em>Tout afficher</em>
          </MenuItem>
          {origins.map((origin) => (
            <MenuItem key={origin} value={origin}>
              {origin}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <Box ref={sankeyRef} sx={{ width: "100%", height: 600, ml: 10 }} />
      <DepartureTable links={data.links} />
      <ArrivalTable links={data.links} />
      <Box ref={refletSankeyRef} sx={{ width: "100%", height: 300 }} />
      <DepartureTable links={refletData.links} />
      <ArrivalTable links={refletData.links} />
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 400, p: 2 }}>
          <IconButton
            onClick={() => setDrawerOpen(false)}
            sx={{ float: "right" }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" gutterBottom>
            Données Sous-jacentes
          </Typography>
          {/* Affichage du chemin cliqué */}
          <Typography
            variant="body1"
            sx={{
              fontStyle: "italic",
              color: theme.palette.text.secondary,
              mb: 2,
            }}
          >
            Parcours : {clickedPath}
          </Typography>

          <List>
            {detailedData.map((item, idx) => (
              <ListItem
                key={idx}
                onClick={() => handleVerbatimClick(item)}
                sx={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  mb: 2,
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? theme.palette.background.paper
                      : "#f5f5f5", // Fond clair ou sombre
                  borderRadius: 2,
                  p: 2,
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0px 2px 5px rgba(255,255,255,0.1)"
                      : "0px 2px 5px rgba(0,0,0,0.1)", // Ombres adaptées
                }}
              >
                {/* Verbatim en évidence */}
                <Typography
                  variant="body1" // Vous pouvez choisir "body1" pour une taille plus standard
                  sx={{
                    // fontStyle: "italic", // Met la police en italique
                    fontSize: "1.05rem", // Ajustez la taille ici (plus petit que par défaut)
                    color: theme.palette.text.primary, // Couleur adaptée au mode sombre/clair
                    mb: 1,
                  }}
                >
                  {item.verbatim || "Verbatim non disponible"}
                </Typography>

                {/* Champs secondaires dans un Grid */}
                <Box sx={{ width: "100%" }}>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                    gutterBottom
                  >
                    <strong>Next Turn Tag :</strong>{" "}
                    {item.next_turn_tag || "Non disponible"}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                    gutterBottom
                  >
                    <strong>Next Turn Verbatim :</strong>{" "}
                    {item.next_turn_verbatim || "Non disponible"}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                    gutterBottom
                  >
                    <strong>Next Turn Tag (Auto) :</strong>{" "}
                    {item.next_turn_tag_auto || "Non disponible"}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                    gutterBottom
                  >
                    <strong>Score (Auto) :</strong>{" "}
                    {item.score_auto !== null
                      ? item.score_auto
                      : "Non disponible"}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      {selectedTurnTag && (
        <TurnTagEditor
          turnTag={selectedTurnTag}
          onClose={() => setSelectedTurnTag(null)}
          onSave={() => console.log("Données mises à jour")}
        />
      )}
    </Box>
  );
};

export default TagAnalysisGraphs;
