import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "../services/userService";

export const userQueryKeys = {
  all: ["users"] as const,
  search: (query: string, page: number) => [...userQueryKeys.all, "search", query, page] as const,
};

export const useSearchUsers = (query: string, page = 1, pageSize = 10, role?: string) => {
  return useQuery({
    queryKey: [...userQueryKeys.search(query, page), role ?? 'all'],
    queryFn: () => searchUsers(query, page, pageSize, role),
    enabled: query.trim().length > 0,
  });
};