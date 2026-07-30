import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../utils/axiosClient";
import { CONTENT_API } from "../../../config/api/content.api";
import { useToast } from "../../../contexts/ToastContext";
import { TOURISM_INFORMATION_STATUS } from "../types/tourismInformation";

export const useChangeTourismInformationStatus = (refetch?: () => void) => {
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const executeStatusChange = async (id: number | string, currentStatus?: string | null) => {
    const isActive = (currentStatus || "").toLowerCase() === "active";
    setUpdatingId(id);

    try {
      const endpoint = isActive
        ? CONTENT_API.TOURISM_INFORMATION.DEACTIVATE(id)
        : CONTENT_API.TOURISM_INFORMATION.ACTIVATE(id);

      const res: Record<string, unknown> = await apiClient.patch(endpoint);
      const message =
        (typeof res.message === "string" && res.message) ||
        (typeof res.data === "object" &&
          res.data !== null &&
          typeof (res.data as Record<string, unknown>).message === "string" &&
          ((res.data as Record<string, unknown>).message as string)) ||
        `Tourism information ${isActive ? "deactivated" : "activated"} successfully.`;

      success(message);
      queryClient.invalidateQueries({ queryKey: ["tourism-information"] });
      queryClient.invalidateQueries({ queryKey: ["tourism-information", id] });
      if (refetch) refetch();
    } catch (err: unknown) {
      const responseData =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message ===
          "string"
          ? (err as { response: { data: { message: string } } }).response.data.message
          : "Failed to change tourism information status.";

      showError(responseData);
    } finally {
      setUpdatingId(null);
    }
  };

  const isActiveStatus = (status?: string | null) =>
    (status || "").toLowerCase() === TOURISM_INFORMATION_STATUS.ACTIVE.toLowerCase();

  return { executeStatusChange, updatingId, isActiveStatus };
};
