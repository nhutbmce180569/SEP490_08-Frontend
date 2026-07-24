import { useTranslation } from "../../../contexts/LocaleContext";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../config/routes/route";
import { tourismInformationService } from "../services/tourismInformation.service";
import type { TourismInformationFilters } from "../types/tourismInformation";

export const useTourismInformation = (filters: TourismInformationFilters = {}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: [
      "tourism-information",
      page,
      pageSize,
      filters.searchTerm,
      filters.type,
      filters.status,
      filters.city,
    ],
    queryFn: () => tourismInformationService.getAll(page, pageSize, filters),
  });

  const handleCreate = () => navigate(PATH.ADMIN.CREATE_TOURISM_INFORMATION);
  const handleViewDetail = (id: number) => navigate(PATH.ADMIN.TOURISM_INFORMATION_DETAIL(id));
  const handleEdit = (id: number) => navigate(PATH.ADMIN.EDIT_TOURISM_INFORMATION(id));

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.isError ? t('content.fetchFailed', { defaultValue: "Failed to fetch tourism information." }) : null,
    page,
    pageSize,
    setPage,
    setPageSize,
    handleCreate,
    handleViewDetail,
    handleEdit,
  };
};
