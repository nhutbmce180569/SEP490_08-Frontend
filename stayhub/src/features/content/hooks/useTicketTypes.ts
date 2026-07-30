import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../config/routes/route";
import { ticketTypeService } from "../services/ticketType.service";

export const useTicketTypes = (searchTerm?: string, initialPageSize: number = 5) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["ticketTypes", page, pageSize, searchTerm],
    queryFn: () => ticketTypeService.getAll(page, pageSize, searchTerm),
  });

  const handleCreate = () => navigate(`${PATH.ADMIN.TICKET_TYPE_MANAGEMENT}/create`);
  const handleEdit = (id: number | string) =>
    navigate(`${PATH.ADMIN.TICKET_TYPE_MANAGEMENT}/${id}/edit`);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.isError ? "Failed to fetch ticket types." : null,
    page,
    pageSize,
    setPage,
    setPageSize,
    handleCreate,
    handleEdit,
  };
};
