import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../contexts/ToastContext";
import { ticketTypeService } from "../services/ticketType.service";
import { getApiErrorMessage } from "../utils/apiError";

export const useChangeTicketTypeStatus = () => {
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const executeStatusChange = async (id: number | string, currentStatus: boolean) => {
    setUpdatingId(id);

    try {
      const res = currentStatus
        ? await ticketTypeService.deactivate(id)
        : await ticketTypeService.activate(id);

      success(
        res?.message ||
          `Ticket type ${currentStatus ? "deactivated" : "activated"} successfully.`,
      );

      queryClient.invalidateQueries({ queryKey: ["ticketTypes"] });
      queryClient.invalidateQueries({ queryKey: ["ticketType", id] });
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Failed to change ticket type status."));
    } finally {
      setUpdatingId(null);
    }
  };

  return { executeStatusChange, updatingId };
};
