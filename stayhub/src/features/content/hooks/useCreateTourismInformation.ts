import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PATH } from "../../../config/routes/route";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useToast } from "../../../contexts/ToastContext";
import { tourismInformationService } from "../services/tourismInformation.service";
import type { CreateTourismInformationDTO } from "../types/tourismInformation";
import {
  getApiErrorMessage,
  getApiValidationErrors,
  normalizeServerErrors,
} from "../utils/apiError";
import {
  mapTourismFormToPayload,
  validateTourismInformationForm,
} from "../utils/tourismInformationValidation";

export const useCreateTourismInformation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: CreateTourismInformationDTO) => tourismInformationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tourism-information"] });
      success(t("content.creatingTourismInfo") || "Tourism information created successfully.");
      navigate(PATH.ADMIN.TOURISM_INFORMATION_MANAGEMENT);
    },
    onError: (err: unknown) => {
      const validationErrors = getApiValidationErrors(err);
      if (validationErrors) {
        setServerErrors(normalizeServerErrors(validationErrors) as Record<string, string>);
      }
      showError(getApiErrorMessage(err, "Failed to create tourism information."));
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
        String(data.address || "")
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
      imageFile: data.imageFile as File,
    });
  };

  const handleCancel = () => navigate(-1);

  return {
    handleSubmit,
    handleCancel,
    isSubmitting: mutation.isPending,
    serverErrors,
  };
};
