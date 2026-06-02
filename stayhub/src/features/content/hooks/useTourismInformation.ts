import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../config/routes/route";
import { tourismInformationService } from "../services/tourismInformation.service";
import type { TourismInformationFilters } from "../types/tourismInformation";

const PAGE_SIZE = 8;

export const useTourismInformation = (filters: TourismInformationFilters = {}) => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: [
      "tourism-information",
      page,
      PAGE_SIZE,
      filters.searchTerm,
      filters.type,
      filters.status,
      filters.city,
    ],
    queryFn: () => tourismInformationService.getAll(page, PAGE_SIZE, filters),
  });

  const handleCreate = () => navigate(PATH.ADMIN.CREATE_TOURISM_INFORMATION);
  const handleViewDetail = (id: number) => navigate(PATH.ADMIN.TOURISM_INFORMATION_DETAIL(id));
  const handleEdit = (id: number) => navigate(PATH.ADMIN.EDIT_TOURISM_INFORMATION(id));

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.isError ? "Failed to fetch tourism information." : null,
    page,
    pageSize: PAGE_SIZE,
    setPage,
    handleCreate,
    handleViewDetail,
    handleEdit,
  };
};
