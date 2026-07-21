import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PATH } from "../../../config/routes/route";
import { useTranslation } from "../../../contexts/LocaleContext";
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
  const { t } = useTranslation();
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
      success(t("content.updatingTourismInfo") || "Tourism information updated successfully.");
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
    const clientErrors = validateTourismInformationForm(data, t, { requireImage: false });
    if (Object.keys(clientErrors).length > 0) {
      setServerErrors(clientErrors);
      return;
    }
    try {
      const isDuplicate = await tourismInformationService.checkDuplicate(
        String(data.name || ""),
        String(data.address || ""),
        id
      );
      if (isDuplicate) {
        const duplicateErrorMsg = t("content.duplicateTourismInfo");
        setServerErrors({
          name: duplicateErrorMsg,
          address: duplicateErrorMsg,
        });
        showError(duplicateErrorMsg);
        return;
      }
    } catch (err) {
      // ignore
    }

    setServerErrors({});
    const payload = mapTourismFormToPayload(data);

    mutation.mutate({
      ...payload,
      imageFile: data.imageFile instanceof File ? data.imageFile : undefined,
      removeImage: data.imageFile === null,
    });
  };

  const handleCancel = () => navigate(-1);

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
