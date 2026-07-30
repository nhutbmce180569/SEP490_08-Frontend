import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { userService } from "../services/user.service";
import { PATH } from "../../../config/routes/route";



export type UserFilters = {
  fullName?: string;
  role?: string;
};

export const useUsers = (filters?: UserFilters) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["users", page, pageSize, filters],
    queryFn: () => userService.filterUsers(page, pageSize, filters?.fullName, filters?.role),
  });

  const handleCreate = () => navigate(PATH.ADMIN.CREATE_USER);
  const handleEdit = (id: number) => navigate(PATH.ADMIN.EDIT_USER(id));
  const handleDelete = (id: number) => navigate(PATH.ADMIN.DELETE_USER(id));

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.isError ? "Failed to fetch users." : null,
    page,
    pageSize,
    setPage,
    setPageSize,
    handleCreate,
    handleEdit,
    handleDelete,
    refetch: query.refetch,
  };
};