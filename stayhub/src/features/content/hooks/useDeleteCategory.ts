import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCategoryById, deleteCategory } from "../services/category.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import type { ReadCategoryDTO } from "../types/category";

export const useDeleteCategory = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [category, setCategory] = useState<ReadCategoryDTO | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchCategory = async () => {
      try {
        const res = await getCategoryById(id);
        setCategory(res);
      } catch (err: any) {
        setFetchError("Failed to load category details.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchCategory();
  }, [id]);

  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteCategory(id);
      
      success("Category deleted successfully!");
      navigate(PATH.ADMIN.CATEGORY_MANAGEMENT);
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to delete category.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    navigate(PATH.ADMIN.CATEGORY_MANAGEMENT);
  };

  return { category, isFetching, fetchError, isDeleting, handleConfirmDelete, handleCancel };
};