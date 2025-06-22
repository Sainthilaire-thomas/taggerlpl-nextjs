// Types partagés pour CallTableList
export interface Call {
  callid: string;
  filename?: string;
  description?: string;
  filepath?: string;
  upload?: boolean;
  audiourl?: string | null;
  status?: string;
  duree?: number;
  origine?: string;
  [key: string]: any;
}

export interface CallTableListProps {
  showMessage: (message: string) => void;
}

export type Order = "asc" | "desc";
export type OrderBy = "filename" | "duree" | "status" | "origine" | "callid";

export interface FilterState {
  searchTerm: string;
  statusFilter: string;
  audioFilter: string;
  origineFilter: string;
}

export interface SortState {
  order: Order;
  orderBy: OrderBy;
}

export interface PaginationState {
  page: number;
  rowsPerPage: number;
}
