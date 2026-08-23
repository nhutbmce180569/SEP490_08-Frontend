import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import type { UpdateUserDTO } from "../types/user";
import { PATH } from "../../../config/routes/route";

import { useTranslation } from "../../../contexts/LocaleContext";
import { useToast } from "../../../contexts/ToastContext";

export const useUpdateUser = () => {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const { data: user, isLoading: isFetching, error } = useQuery({
    queryKey: ["user", id],
    queryFn: () => userService.getUserById(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateUserDTO) => userService.updateUser(id!, data),
    onSuccess: (res) => {
      success(res?.message || t("admin.updateUserSuccess") || "User updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      navigate(PATH.ADMIN.USER_MANAGEMENT);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message;
      let displayMsg = msg;
      if (msg === "PhoneNumberExists") displayMsg = t("errors.phoneNumberExists");
      else if (msg === "Cannot edit Customer accounts.") displayMsg = t("errors.cannotEditCustomer");
      else if (msg === "Cannot edit or block other Admin accounts.") displayMsg = t("errors.cannotEditAdmin");

      showError(displayMsg || t("admin.updateUserError") || "Failed to update user. Please check the inputs.");
      if (error.response?.data?.errors) {
        const translatedErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(([key, val]) => {
          const firstErrorMsg = Array.isArray(val) ? val[0] : String(val);
          if (firstErrorMsg === "FullNameCannotContainSpecialCharacters") {
            translatedErrors[key] = t("errors.fullNameNoSpecialChars");
          } else {
            translatedErrors[key] = firstErrorMsg;
          }
        });
        setServerErrors(translatedErrors);
      } else if (displayMsg) {
        setServerErrors({ general: displayMsg });
      }
    }
  });

  const handleSubmit = async (data: Record<string, any>) => {
    setServerErrors({});
    const dto: UpdateUserDTO = {
      ...data,
      roleIds: Array.isArray(data.roleIds) ? data.roleIds.map(Number) : (data.roleIds ? [Number(data.roleIds)] : undefined),
    } as UpdateUserDTO;
    
    mutation.mutate(dto);
  };

  const handleCancel = () => navigate(PATH.ADMIN.USER_MANAGEMENT);

  return { id, user, isFetching, fetchError: error ? "Failed to fetch user." : null, 
           isSubmitting: mutation.isPending, serverErrors, handleSubmit, handleCancel };
};