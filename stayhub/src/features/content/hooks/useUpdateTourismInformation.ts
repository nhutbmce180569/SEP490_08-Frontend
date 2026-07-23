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
import { mapTourismFormToPayload } from "../utils/tourismInformationValidation";
import { tourismInfoSchema } from "../schemas/tourismInfoSchema";

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
      success(t("content.updatingTourismInfo", { defaultValue: "Tourism information updated successfully." }));
      navigate(PATH.ADMIN.TOURISM_INFORMATION_MANAGEMENT);
    },
    onError: (err: unknown) => {
      const validationErrors = getApiValidationErrors(err);
      if (validationErrors) {
        setServerErrors(normalizeServerErrors(validationErrors) as Record<string, string>);
      } else {
        const errMsg = getApiErrorMessage(err, t('content.updateFailed', { defaultValue: "Failed to update tourism information." }));
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

    if (Object.keys(localErrors).length > 0) {
      setServerErrors(localErrors);
      return;
    }

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
    fetchError: error ? t("content.fetchError", { defaultValue: "Failed to fetch tourism information." }) : null,
    isSubmitting: mutation.isPending,
    serverErrors,
    handleSubmit,
    handleCancel,
  };
};
