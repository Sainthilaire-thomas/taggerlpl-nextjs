import PersonIcon from "@mui/icons-material/Person";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import { ReactElement } from "react";

/**
 * Types d'icône disponibles
 */
export type IconType = "client" | "agent" | string;

/**
 * Retourne l'icône appropriée pour une famille donnée.
 * @param {IconType} iconType - Type de l'icône (client, agent, divers)
 * @returns {ReactElement} - Icône React
 */
export const getFamilyIcon = (iconType: IconType): ReactElement => {
  switch (iconType) {
    case "client":
      return <PersonIcon sx={{ marginRight: 1 }} />;
    case "agent":
      return <SupportAgentIcon sx={{ marginRight: 1 }} />;
    default:
      return <MoreHorizIcon sx={{ marginRight: 1 }} />;
  }
};
