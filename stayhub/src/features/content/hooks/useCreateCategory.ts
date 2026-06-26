import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCategory } from "../services/category.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";

export const useCreateCategory = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    setServerErrors({});
    
    try {
      const generatedSlug = data.name
        ? data.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/[\s-]+/g, "-")
        : "";

      const payload = {
        name: data.name,
        slug: generatedSlug,
        description: data.description,
        isActive: data.isActive === "Active",
        iconFile: data.iconFile instanceof File ? data.iconFile : undefined,
      };

      await createCategory(payload);
      
      success("Category created successfully!");
      navigate(PATH.ADMIN.CATEGORY_MANAGEMENT);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setServerErrors(err.response.data.errors);
      }
      showError(err.response?.data?.message || "Failed to create category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(PATH.ADMIN.CATEGORY_MANAGEMENT);
  };

  return { handleSubmit, handleCancel, isSubmitting, serverErrors };
};