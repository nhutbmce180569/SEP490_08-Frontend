import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { bannerService } from "../services/banner.service";

const PAGE_SIZE = 5;

export const useBanners = () => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["banners", page, PAGE_SIZE],
    queryFn: () => bannerService.getAll(page, PAGE_SIZE),
  });

  // Thay thế đường dẫn này theo route chuẩn của dự án của bạn nếu cần
  const handleCreate = () => navigate("/admin/banners/create");
  const handleEdit = (id: number) => navigate(`/admin/banners/${id}/edit`);
  const handleDelete = (id: number) => navigate(`/admin/banners/${id}/delete`);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.isError ? "Failed to fetch banners." : null,
    page,
    pageSize: PAGE_SIZE,
    setPage,
    handleCreate,
    handleEdit,
    handleDelete,
  };
};