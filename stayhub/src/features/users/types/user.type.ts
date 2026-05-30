export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}