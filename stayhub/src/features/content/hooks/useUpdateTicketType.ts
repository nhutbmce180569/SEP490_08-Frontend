import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PATH } from "../../../config/routes/route";
import { useToast } from "../../../contexts/ToastContext";
import { ticketTypeService } from "../services/ticketType.service";
import type { ReadTicketTypeDTO } from "../types/ticketType";
import {
  getApiErrorMessage,
  getApiValidationErrors,
  normalizeServerErrors,
} from "../utils/apiError";

export const useUpdateTicketType = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [ticketType, setTicketType] = useState<ReadTicketTypeDTO | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!id) return;

    const fetchTicketType = async () => {
      setIsFetching(true);
      setFetchError(null);

      try {
        const res = await ticketTypeService.getById(id);
        setTicketType(res);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err, "Failed to load ticket type details.");
        setFetchError(message);
        showError(message);
      } finally {
        setIsFetching(false);
      }
    };

    fetchTicketType();
  }, [id, showError]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!id) return;

    setIsSubmitting(true);
    setServerErrors({});

    try {
      await ticketTypeService.update(id, {
        name: String(data.name ?? "").trim(),
        description: data.description ? String(data.description).trim() : undefined,
        minAge: data.minAge !== undefined && data.minAge !== "" && data.minAge !== null ? Number(data.minAge) : undefined,
        maxAge: data.maxAge !== undefined && data.maxAge !== "" && data.maxAge !== null ? Number(data.maxAge) : undefined,
        isActive: data.isActive === "Active",
      });

      success("Ticket type updated successfully.");
      navigate(PATH.ADMIN.TICKET_TYPE_MANAGEMENT);
    } catch (err: unknown) {
      const validationErrors = getApiValidationErrors(err);
      if (validationErrors) {
        setServerErrors(normalizeServerErrors(validationErrors));
      }
      showError(getApiErrorMessage(err, "Failed to update ticket type."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(PATH.ADMIN.TICKET_TYPE_MANAGEMENT);
  };

  return {
    id,
    ticketType,
    isFetching,
    fetchError,
    isSubmitting,
    serverErrors,
    handleSubmit,
    handleCancel,
  };
};
