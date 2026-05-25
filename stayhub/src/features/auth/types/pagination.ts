export interface PaginationDTO<T> {
  data?: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}