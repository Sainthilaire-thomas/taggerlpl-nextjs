// types.ts - Types pour CallTableList

export interface Call {
  callid: string | number; // ✅ Peut être string ou number
  filename?: string;
  filepath?: string;
  upload?: boolean;
  duree?: string;
  status?: string;
  origine?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CallTableListProps {
  showMessage: (message: string) => void;
}

export interface FilterState {
  searchTerm: string;
  statusFilter: string;
  audioFilter: string;
  origineFilter: string;
}

export type Order = "asc" | "desc";
export type OrderBy = keyof Call;

export interface SortState {
  order: Order;
  orderBy: OrderBy;
}

export interface PaginationState {
  page: number;
  rowsPerPage: number;
}

// Nouveaux types pour les actions en lot
export interface BulkActionState {
  selectedCalls: Set<string>;
  isSelectAll: boolean;
  bulkOrigineValue: string;
  isBulkProcessing: boolean;
}

// Props pour CallTableRow
export interface CallTableRowProps {
  call: Call;
  index: number;
  editingOrigine: string | null;
  onStartEditOrigine: (callid: string | number) => void; // ✅ Accepte les deux types
  onSaveOrigine: (callid: string | number, newOrigine: string) => void; // ✅ Accepte les deux types
  onCancelEditOrigine: () => void;
  onCallClick: (call: Call) => void;
  onDeleteClick: (call: Call) => void;
  // Nouveaux props pour la sélection
  isSelected?: boolean;
  onSelectionChange?: (callid: string | number, isSelected: boolean) => void; // ✅ Accepte les deux types
  disabled?: boolean;
}

// Props pour MobileCallCard
export interface MobileCallCardProps {
  call: Call;
  isExpanded: boolean;
  onToggleExpansion: (callid: string | number) => void; // ✅ Accepte les deux types
  onCallClick: (call: Call) => void;
  onDeleteClick: (call: Call) => void;
  // Nouveaux props pour la sélection mobile
  isSelected?: boolean;
  onSelectionChange?: (callid: string | number, isSelected: boolean) => void; // ✅ Accepte les deux types
  disabled?: boolean;
}

// Props pour CallTableFilters
export interface CallTableFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  uniqueOrigines: string[];
  resultCount: number;
  isMobile: boolean;
}

// Types pour l'optimisation et cache
export interface CallListCache {
  lastUpdate: number;
  data: Call[];
  filters: FilterState;
  sort: SortState;
}

// Types pour les opérations en lot
export interface BulkOperation {
  type: "UPDATE_ORIGINE" | "DELETE";
  callIds: string[];
  data?: any;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: string[];
}
