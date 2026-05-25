import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import type { UpdateUserDTO } from "../types/user";
import { PATH } from "../../../config/routes/route";

export const useUpdateUser = () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      navigate(PATH.ADMIN.USER_MANAGEMENT);
    },
    onError: (error: any) => {
      if (error.response?.data?.errors) {
        setServerErrors(error.response.data.errors);
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