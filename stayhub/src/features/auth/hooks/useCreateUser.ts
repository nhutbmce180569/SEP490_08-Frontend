import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import type { AdminCreatedUserDTO, CreateUserDTO } from "../types/user";
import { PATH } from "../../../config/routes/route";
import { useTranslation } from "../../../contexts/LocaleContext";

export const useCreateUser = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [createdAccount, setCreatedAccount] = useState<AdminCreatedUserDTO | null>(null);

  const mutation = useMutation({
    mutationFn: (data: CreateUserDTO) => userService.createUser(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setCreatedAccount(result);
    },
    onError: (error: any) => {
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
      } else if (error.response?.data?.message) {
        const msg = error.response.data.message;
        if (msg === "PhoneNumberExists") {
          setServerErrors({ general: t("errors.phoneNumberExists") });
        } else {
          setServerErrors({ general: msg });
        }
      }
    }
  });

  const handleSubmit = async (data: Record<string, any>) => {
    setServerErrors({});

    const dto: CreateUserDTO = {
      ...data,
      status: data.status || "Active",
      roleIds: Array.isArray(data.roleIds) ? data.roleIds.map(Number) : (data.roleIds ? [Number(data.roleIds)] : undefined),
    } as CreateUserDTO;
    
    mutation.mutate(dto);
  };

  const handleCancel = () => navigate(PATH.ADMIN.USER_MANAGEMENT);

  return {
    handleSubmit,
    handleCancel,
    isSubmitting: mutation.isPending,
    serverErrors,
    createdAccount,
  };
};
