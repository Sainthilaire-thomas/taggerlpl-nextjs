// utils.ts - Utilitaires pour CallTableList
import { Call, Order, OrderBy } from "./types";

// Fonction utilitaire pour formater la durée
export const formatDuration = (seconds: number | undefined): string => {
  if (!seconds || seconds === 0) return "0:00";
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
    case "completed":
      return "success";
    case "processing":
      return "warning";
    case "error":
      return "error";
    case "pending":
      return "info";
    default:
      return "default";
  }
};

// Fonction de comparaison pour le tri
export function getComparator<Key extends keyof Call>(
  order: Order,
  orderBy: Key
): (a: Call, b: Call) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T): number {
  const aValue = a[orderBy];
  const bValue = b[orderBy];

  // Gestion des valeurs undefined/null
  if (bValue === undefined || bValue === null) {
    if (aValue === undefined || aValue === null) return 0;
    return -1;
  }
  if (aValue === undefined || aValue === null) {
    return 1;
  }

  // ✅ Conversion en string pour comparaison sécurisée
  const aStr = String(aValue).toLowerCase();
  const bStr = String(bValue).toLowerCase();

  if (bStr < aStr) {
    return -1;
  }
  if (bStr > aStr) {
    return 1;
  }
  return 0;
}

// Fonction de filtrage des appels
export function filterCalls(
  calls: Call[],
  searchTerm: string,
  statusFilter: string,
  audioFilter: string,
  origineFilter: string
): Call[] {
  return calls.filter((call) => {
    // Filtre de recherche textuelle - avec conversion sécurisée en string
    const matchesSearch =
      !searchTerm ||
      call.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(call.callid).toLowerCase().includes(searchTerm.toLowerCase()); // ✅ Conversion sécurisée

    // Filtre de statut
    const matchesStatus =
      statusFilter === "all" || call.status === statusFilter;

    // Filtre audio
    const matchesAudio =
      audioFilter === "all" ||
      (audioFilter === "with" && call.upload && call.filepath) ||
      (audioFilter === "without" && (!call.upload || !call.filepath));

    // Filtre origine
    const matchesOrigine =
      origineFilter === "all" || call.origine === origineFilter;

    return matchesSearch && matchesStatus && matchesAudio && matchesOrigine;
  });
}

// Utilitaire pour créer des lots (batches)
export function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

// Utilitaire pour délai
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Validation des opérations en lot
export function validateBulkSelection(
  selectedCallIds: string[],
  allCalls: Call[]
): { isValid: boolean; message?: string } {
  if (selectedCallIds.length === 0) {
    return { isValid: false, message: "Aucun appel sélectionné" };
  }

  const selectedCalls = allCalls.filter(
    (call) => selectedCallIds.includes(String(call.callid)) // ✅ Conversion sécurisée
  );

  if (selectedCalls.length !== selectedCallIds.length) {
    return {
      isValid: false,
      message: "Certains appels sélectionnés n'existent plus",
    };
  }

  return { isValid: true };
}
