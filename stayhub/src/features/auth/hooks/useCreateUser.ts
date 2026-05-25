import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import type { CreateUserDTO } from "../types/user";
import { PATH } from "../../../config/routes/route";

export const useCreateUser = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: CreateUserDTO) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate(PATH.ADMIN.USER_MANAGEMENT);
    },
    onError: (error: any) => {
      if (error.response?.data?.errors) {
        setServerErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setServerErrors({ general: error.response.data.message });
      }
    }
  });

  const handleSubmit = async (data: Record<string, any>) => {
    setServerErrors({});

    if (data.password !== data.confirmPassword) {
      setServerErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    const dto: CreateUserDTO = {
      ...data,
      status: data.status || "Active",
      roleIds: Array.isArray(data.roleIds) ? data.roleIds.map(Number) : (data.roleIds ? [Number(data.roleIds)] : undefined),
    } as CreateUserDTO;
    
    mutation.mutate(dto);
  };

  const handleCancel = () => navigate(PATH.ADMIN.USER_MANAGEMENT);

  return { handleSubmit, handleCancel, isSubmitting: mutation.isPending, serverErrors };
};