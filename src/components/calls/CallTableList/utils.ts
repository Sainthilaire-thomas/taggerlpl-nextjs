import { Call, Order, OrderBy } from "./types";

// Fonction utilitaire pour formater la durée
export const formatDuration = (seconds: number | undefined): string => {
  if (!seconds || seconds === 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Fonction utilitaire pour obtenir la couleur du statut
export const getStatusColor = (
  status: string | undefined
):
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning" => {
  switch (status) {
    case "évalué":
      return "success";
    case "en_cours":
      return "warning";
    case "coaching_planifié":
      return "info";
    case "terminé":
      return "primary";
    case "non_supervisé":
    default:
      return "default";
  }
};

// Fonction de comparaison pour le tri
export const descendingComparator = (
  a: Call,
  b: Call,
  orderBy: OrderBy
): number => {
  const aValue = a[orderBy] || "";
  const bValue = b[orderBy] || "";

  if (orderBy === "duree") {
    return (b.duree || 0) - (a.duree || 0);
  }

  if (bValue < aValue) return -1;
  if (bValue > aValue) return 1;
  return 0;
};

// Fonction pour obtenir le comparateur
export const getComparator = (order: Order, orderBy: OrderBy) => {
  return order === "desc"
    ? (a: Call, b: Call) => descendingComparator(a, b, orderBy)
    : (a: Call, b: Call) => -descendingComparator(a, b, orderBy);
};

// Fonction de filtrage des appels
export const filterCalls = (
  calls: Call[],
  searchTerm: string,
  statusFilter: string,
  audioFilter: string,
  origineFilter: string
): Call[] => {
  return calls.filter((call) => {
    // Filtre de recherche
    const searchMatch =
      !searchTerm ||
      [call.filename, call.description, call.callid].some((field) => {
        if (!field) return false;
        const fieldStr = String(field).toLowerCase();
        return fieldStr.includes(searchTerm.toLowerCase());
      });

    // Filtre de statut
    const statusMatch = statusFilter === "all" || call.status === statusFilter;

    // Filtre audio
    const audioMatch =
      audioFilter === "all" ||
      (audioFilter === "with_audio" && call.upload) ||
      (audioFilter === "without_audio" && !call.upload);

    // Filtre origine
    const origineMatch =
      origineFilter === "all" || call.origine === origineFilter;

    return searchMatch && statusMatch && audioMatch && origineMatch;
  });
};
