import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../config/routes/route";
import { useToast } from "../../../contexts/ToastContext";
import { ticketTypeService } from "../services/ticketType.service";
import {
  getApiErrorMessage,
  getApiValidationErrors,
  normalizeServerErrors,
} from "../utils/apiError";

export const useCreateTicketType = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, unknown>>({});
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    setServerErrors({});

    try {
      await ticketTypeService.create({
        name: String(data.name ?? "").trim(),
        description: data.description ? String(data.description).trim() : undefined,
        minAge: data.minAge !== undefined && data.minAge !== "" && data.minAge !== null ? Number(data.minAge) : undefined,
        maxAge: data.maxAge !== undefined && data.maxAge !== "" && data.maxAge !== null ? Number(data.maxAge) : undefined,
        isActive: data.isActive === "Active",
      });

      success("Ticket type created successfully.");
      navigate(PATH.ADMIN.TICKET_TYPE_MANAGEMENT);
    } catch (err: unknown) {
      const validationErrors = getApiValidationErrors(err);
      if (validationErrors) {
        setServerErrors(normalizeServerErrors(validationErrors));
      }
      showError(getApiErrorMessage(err, "Failed to create ticket type."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(PATH.ADMIN.TICKET_TYPE_MANAGEMENT);
  };

  return { handleSubmit, handleCancel, isSubmitting, serverErrors };
};
