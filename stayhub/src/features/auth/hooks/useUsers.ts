import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { userService } from "../services/user.service";
import { PATH } from "../../../config/routes/route";

const PAGE_SIZE = 10;

export type UserFilters = {
  fullName?: string;
  role?: string;
};

export const useUsers = (filters?: UserFilters) => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["users", page, PAGE_SIZE, filters],
    queryFn: () => userService.filterUsers(page, PAGE_SIZE, filters?.fullName, filters?.role),
  });

  const handleCreate = () => navigate(PATH.ADMIN.CREATE_USER);
  const handleEdit = (id: number) => navigate(PATH.ADMIN.EDIT_USER(id));
  const handleDelete = (id: number) => navigate(PATH.ADMIN.DELETE_USER(id));

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.isError ? "Failed to fetch users." : null,
    page,
    pageSize: PAGE_SIZE,
    setPage,
    handleCreate,
    handleEdit,
    handleDelete,
    refetch: query.refetch,
  };
};