export interface ReadTicketTypeDTO {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateTicketTypeDTO {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateTicketTypeDTO {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface TicketTypePaginationDTO<T> {
  data: T[];
  total: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}
