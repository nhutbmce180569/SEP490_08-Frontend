import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCategories } from "../services/category.service";
import { PATH } from "../../../config/routes/route";
import type { ReadCategoryDTO, PaginationDTO } from "../types/category";

export const useCategories = (pageSize: number = 5, keyword?: string) => {
  const [data, setData] = useState<PaginationDTO<ReadCategoryDTO> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAllCategories(page, pageSize, keyword);
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load categories.");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, keyword]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = () => navigate(PATH.ADMIN.CATEGORY_MANAGEMENT + "/create");
  const handleEdit = (id: number | string) => navigate(`${PATH.ADMIN.CATEGORY_MANAGEMENT}/${id}/edit`);
  const handleDelete = (id: number | string) => navigate(`${PATH.ADMIN.CATEGORY_MANAGEMENT}/${id}/delete`);

  return { data, isLoading, error, page, pageSize, setPage, handleCreate, handleEdit, handleDelete };
};