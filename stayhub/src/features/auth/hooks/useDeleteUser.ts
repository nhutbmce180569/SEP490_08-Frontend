import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import { PATH } from "../../../config/routes/route";
import { useToast } from "../../../contexts/ToastContext";

export const useDeleteUser = () => {
  const { success, error: showError } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isFetching, error } = useQuery({
    queryKey: ["user", id],
    queryFn: () => userService.getUserById(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: () => userService.deleteUser(id!),
    onSuccess: (res) => {
      success(res?.message || "User deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate(PATH.ADMIN.USER_MANAGEMENT);
    },
    onError: () => {
      showError("Failed to delete user. Please try again.");
    }
  });

  const handleConfirmDelete = () => mutation.mutate();
  const handleCancel = () => navigate(PATH.ADMIN.USER_MANAGEMENT);

  return { user, isFetching, fetchError: error ? "Failed to fetch user details." : null, 
           isDeleting: mutation.isPending, handleConfirmDelete, handleCancel };
};