import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCategory } from "../services/category.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTranslation } from "../../../contexts/LocaleContext";

export const useCreateCategory = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const handleSubmit = async (data: any) => {
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
        iconFile: data.iconFile instanceof File ? data.iconFile : undefined,
      };

      await createCategory(payload);
      
      success(t("content.categoryCreatedSuccess"));
      navigate(PATH.ADMIN.CATEGORY_MANAGEMENT);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setServerErrors(err.response.data.errors);
      }
      const msg = err.response?.data?.message || t("content.categoryCreateFailed");
      showError(msg);
      
      if (msg && typeof msg === "string") {
        const lower = msg.toLowerCase();
        if (lower.includes("tên") || lower.includes("name")) {
          setServerErrors((prev) => ({ ...prev, name: msg }));
        } else if (lower.includes("slug")) {
          setServerErrors((prev) => ({ ...prev, slug: msg }));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(PATH.ADMIN.CATEGORY_MANAGEMENT);
  };

  return { handleSubmit, handleCancel, isSubmitting, serverErrors };
};