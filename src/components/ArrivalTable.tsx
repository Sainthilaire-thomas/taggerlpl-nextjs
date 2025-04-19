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

interface ArrivalTableProps {
  links: Link[];
}

interface GroupedData {
  [target: string]: {
    total: number;
    sources: {
      [source: string]: number;
    };
  };
}

const ArrivalTable: React.FC<ArrivalTableProps> = ({ links }) => {
  if (!links || links.length === 0) {
    return <Typography>Aucune donnée à afficher.</Typography>;
  }

  // Grouper les données par cible et calculer les proportions
  const groupedByTarget: GroupedData = links.reduce(
    (acc: GroupedData, link) => {
      if (!acc[link.target]) {
        acc[link.target] = { total: 0, sources: {} };
      }
      acc[link.target].total += link.value;
      acc[link.target].sources[link.source] =
        (acc[link.target].sources[link.source] || 0) + link.value;
      return acc;
    },
    {}
  );

  // Extraire toutes les sources possibles
  const allSources: string[] = Array.from(
    new Set(links.map((link) => link.source))
  ).sort();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>
            <strong>Destination (Arrivée)</strong>
          </TableCell>
          {allSources.map((source) => (
            <TableCell key={source}>
              <strong>{source}</strong>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(groupedByTarget).map(([target, { total, sources }]) => (
          <TableRow key={target}>
            <TableCell>{target}</TableCell>
            {allSources.map((source) => (
              <TableCell key={source}>
                {(((sources[source] || 0) / total) * 100).toFixed(2)}%
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ArrivalTable;
