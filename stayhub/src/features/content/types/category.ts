export interface ReadCategoryDTO {
  id: number;
  name: string;
  slug: string;
  iconUrl?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  iconFile?: File | null;
}

export interface UpdateCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  iconFile?: File | null;
}

export interface PaginationDTO<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}