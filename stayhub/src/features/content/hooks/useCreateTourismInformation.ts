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
import { mapTourismFormToPayload } from "../utils/tourismInformationValidation";
import { tourismInfoSchema } from "../schemas/tourismInfoSchema";

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
      success(t("content.creatingTourismInfo", { defaultValue: "Tourism information created successfully." }));
      navigate(PATH.ADMIN.TOURISM_INFORMATION_MANAGEMENT);
    },
    onError: (err: unknown) => {
      const validationErrors = getApiValidationErrors(err);
      if (validationErrors) {
        setServerErrors(normalizeServerErrors(validationErrors) as Record<string, string>);
      } else {
        const errMsg = getApiErrorMessage(err, t('content.createFailed', { defaultValue: "Failed to create tourism information." }));
        setServerErrors({ _form: errMsg });
        showError(errMsg);
      }
    },
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    setServerErrors({});
    const payload = mapTourismFormToPayload(data);

    const validationResult = tourismInfoSchema.safeParse(payload);
    const localErrors: Record<string, string> = {};

    if (!validationResult.success) {
      validationResult.error.errors.forEach(err => {
        const path = err.path.join('.');
        localErrors[path] = t(`content.${err.message}`, { defaultValue: err.message });
      });
    }

    if (!data.imageFile && false /* requireImage is false by default in create? wait, original said requireImage: false in validate call */) {
      // If we ever need to force image on create
    }

    if (Object.keys(localErrors).length > 0) {
      setServerErrors(localErrors);
      return;
    }

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
