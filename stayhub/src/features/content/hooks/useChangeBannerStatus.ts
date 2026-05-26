import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../utils/axiosClient";
import { CONTENT_API } from "../../../config/api/content.api";
import { useToast } from "../../../contexts/ToastContext";

export const useChangeBannerStatus = (refetch?: () => void) => {
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const executeStatusChange = async (id: number | string, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      let res: any;
      if (currentStatus) {
        res = await apiClient.patch(CONTENT_API.BANNERS.DEACTIVATE(id));
      } else {
        res = await apiClient.patch(CONTENT_API.BANNERS.ACTIVATE(id));
      }
      
      const message = res?.data?.message || res?.message || `Banner ${currentStatus ? 'deactivated' : 'activated'} successfully.`;
      success(message);
      
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["banner", id] });
      
      if (refetch) refetch();
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to change banner status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return { executeStatusChange, updatingId };
};