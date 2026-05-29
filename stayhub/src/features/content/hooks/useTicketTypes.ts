import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../config/routes/route";
import { ticketTypeService } from "../services/ticketType.service";

const PAGE_SIZE = 5;

export const useTicketTypes = (searchTerm?: string) => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["ticketTypes", page, PAGE_SIZE, searchTerm],
    queryFn: () => ticketTypeService.getAll(page, PAGE_SIZE, searchTerm),
  });

  const handleCreate = () => navigate(`${PATH.ADMIN.TICKET_TYPE_MANAGEMENT}/create`);
  const handleEdit = (id: number | string) =>
    navigate(`${PATH.ADMIN.TICKET_TYPE_MANAGEMENT}/${id}/edit`);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.isError ? "Failed to fetch ticket types." : null,
    page,
    pageSize: PAGE_SIZE,
    setPage,
    handleCreate,
    handleEdit,
  };
};
