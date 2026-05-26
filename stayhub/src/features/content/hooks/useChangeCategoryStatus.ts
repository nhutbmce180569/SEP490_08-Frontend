import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { categoryService } from "../services/category.service";
import { useToast } from "../../../contexts/ToastContext";

export const useChangeCategoryStatus = (refetch?: () => void) => {
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
      
      success(res?.message || `Category ${currentStatus ? 'deactivated' : 'activated'} successfully.`);
      
      // Xoá cache để lấy dữ liệu mới nhất
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", id] });
      
      if (refetch) refetch();
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to change category status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return { executeStatusChange, updatingId };
};