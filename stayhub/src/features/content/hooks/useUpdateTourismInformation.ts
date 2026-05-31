import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PATH } from "../../../config/routes/route";
import { useToast } from "../../../contexts/ToastContext";
import { tourismInformationService } from "../services/tourismInformation.service";
import type { UpdateTourismInformationDTO } from "../types/tourismInformation";
import {
  getApiErrorMessage,
  getApiValidationErrors,
  normalizeServerErrors,
} from "../utils/apiError";
import {
  mapTourismFormToPayload,
  validateTourismInformationForm,
} from "../utils/tourismInformationValidation";

export const useUpdateTourismInformation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const {
    data: tourismInfo,
    isLoading: isFetching,
    error,
  } = useQuery({
    queryKey: ["tourism-information", id],
    queryFn: () => tourismInformationService.getAdminById(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateTourismInformationDTO) =>
      tourismInformationService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tourism-information"] });
      success("Tourism information updated successfully.");
      navigate(PATH.ADMIN.TOURISM_INFORMATION_MANAGEMENT);
    },
    onError: (err: unknown) => {
      const validationErrors = getApiValidationErrors(err);
      if (validationErrors) {
        setServerErrors(normalizeServerErrors(validationErrors) as Record<string, string>);
      }
      showError(getApiErrorMessage(err, "Failed to update tourism information."));
    },
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    const clientErrors = validateTourismInformationForm(data, { requireImage: false });
    if (Object.keys(clientErrors).length > 0) {
      setServerErrors(clientErrors);
      return;
    }

    setServerErrors({});
    const payload = mapTourismFormToPayload(data);

    mutation.mutate({
      ...payload,
      imageFile: data.imageFile instanceof File ? data.imageFile : undefined,
    });
  };

  const handleCancel = () => navigate(PATH.ADMIN.TOURISM_INFORMATION_MANAGEMENT);

  return {
    id,
    tourismInfo,
    isFetching,
    fetchError: error ? "Failed to fetch tourism information." : null,
    isSubmitting: mutation.isPending,
    serverErrors,
    handleSubmit,
    handleCancel,
  };
};
