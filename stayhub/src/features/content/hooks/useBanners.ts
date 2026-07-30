import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { bannerService } from "../services/banner.service";
import { useTranslation } from "../../../contexts/LocaleContext";

export const useBanners = (initialPageSize: number = 5, keyword?: string) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["banners", page, pageSize, keyword],
    queryFn: () => bannerService.getAll(page, pageSize, keyword),
  });

  const handleCreate = () => navigate("/admin/banners/create");
  const handleEdit = (id: number) => navigate(`/admin/banners/${id}/edit`);
  const handleDelete = (id: number) => navigate(`/admin/banners/${id}/delete`);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.isError ? t("content.failedToFetchBanners") : null,
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