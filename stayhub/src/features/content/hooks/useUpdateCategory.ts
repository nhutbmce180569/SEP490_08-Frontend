import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCategoryById, updateCategory } from "../services/category.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import type { ReadCategoryDTO } from "../types/category";

export const useUpdateCategory = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [category, setCategory] = useState<ReadCategoryDTO | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    const fetchCategory = async () => {
      try {
        const res = await getCategoryById(id);
        setCategory(res);
      } catch (err: any) {
        setFetchError("Failed to load category details.");
        showError("Failed to load category details.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchCategory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    setIsSubmitting(true);
    setServerErrors({});
    
    try {
      const finalSlug = data.slug || (data.name
        ? data.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/[\s-]+/g, "-")
        : "");

      const payload = {
        name: data.name,
        slug: finalSlug,
        description: data.description,
        isActive: data.isActive === "Active",
        iconFile: data.iconFile instanceof File ? data.iconFile : undefined, 
      };

      await updateCategory(id, payload);
      
      success("Category updated successfully!");
      navigate(PATH.ADMIN.CATEGORY_MANAGEMENT);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setServerErrors(err.response.data.errors);
      }
      showError(err.response?.data?.message || "Failed to update category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(PATH.ADMIN.CATEGORY_MANAGEMENT);
  };

  return { id, category, isFetching, fetchError, isSubmitting, serverErrors, handleSubmit, handleCancel };
};