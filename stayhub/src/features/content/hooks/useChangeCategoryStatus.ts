import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { categoryService } from "../services/category.service";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from "../../../contexts/LocaleContext";

export const useChangeCategoryStatus = (refetch?: () => void) => {
  const { t } = useTranslation();
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const executeStatusChange = async (id: number | string, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      let res;
      if (currentStatus) {
        res = await categoryService.deactivateCategory(id);
      } else {
        res = await categoryService.activateCategory(id);
      }
      const successMessage = currentStatus ? t("content.categoryDeactivatedSuccess", "Category deactivated successfully.") : t("content.categoryActivatedSuccess", "Category activated successfully.");
      success(res?.message || successMessage);
      
      // Xoá cache để lấy dữ liệu mới nhất
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", id] });
      
      if (refetch) refetch();
    } catch (err: any) {
      showError(err.response?.data?.message || t("content.categoryStatusChangeFailed", "Failed to change category status."));
    } finally {
      setUpdatingId(null);
    }
  };

  return { executeStatusChange, updatingId };
};