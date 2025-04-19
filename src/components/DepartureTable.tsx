import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

interface Link {
  source: string;
  target: string;
  value: number;
}

interface DepartureTableProps {
  links: Link[];
}

interface GroupedData {
  [source: string]: {
    total: number;
    destinations: {
      [target: string]: number;
    };
  };
}

interface LabelTranslations {
  [key: string]: string;
}

const DepartureTable: React.FC<DepartureTableProps> = ({ links }) => {
  if (!links || links.length === 0) {
    return <Typography>Aucune donnée à afficher.</Typography>;
  }

  const labelTranslations: LabelTranslations = {
    OUVERTURE: "OPENING",
    ENGAGEMENT: "ENGAGEMENT",
    REFLET: "REFLECTION",
    EXPLICATION: "EXPLANATION",
    "CLIENT POSITIF": "POSITIVE CLIENT",
    "CLIENT NEUTRE": "NEUTRAL CLIENT",
    "CLIENT NEGATIF": "NEGATIVE CLIENT",
  };

  // Grouper les données par source et calculer les proportions
  const groupedBySource: GroupedData = links.reduce(
    (acc: GroupedData, link) => {
      if (!acc[link.source]) {
        acc[link.source] = { total: 0, destinations: {} };
      }
      acc[link.source].total += link.value;
      acc[link.source].destinations[link.target] =
        (acc[link.source].destinations[link.target] || 0) + link.value;
      return acc;
    },
    {}
  );

  // Extraire toutes les destinations possibles
  const allDestinations: string[] = Array.from(
    new Set(links.map((link) => link.target))
  ).sort();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>
            <strong>Source (Départ)</strong>
          </TableCell>
          {allDestinations.map((destination) => (
            <TableCell key={destination}>
              <strong>{labelTranslations[destination] || destination}</strong>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(groupedBySource).map(
          ([source, { total, destinations }]) => (
            <TableRow key={source}>
              <TableCell>{labelTranslations[source] || source}</TableCell>

              {allDestinations.map((destination) => (
                <TableCell key={destination}>
                  {(((destinations[destination] || 0) / total) * 100).toFixed(
                    2
                  )}
                  %
                </TableCell>
              ))}
            </TableRow>
          )
        )}
      </TableBody>
    </Table>
  );
};

export default DepartureTable;
