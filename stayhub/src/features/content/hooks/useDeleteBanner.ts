import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bannerService } from "../services/banner.service";

export const useDeleteBanner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: banner, isLoading: isFetching, error } = useQuery({
    queryKey: ["banner", id],
    queryFn: () => bannerService.getById(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: () => bannerService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["activeBanners"] });
      navigate("/admin/banners");
    },
  });

  const handleConfirmDelete = () => mutation.mutate();
  const handleCancel = () => navigate("/admin/banners");

  return { banner, isFetching, fetchError: error ? "Failed to fetch banner details." : null, 
           isDeleting: mutation.isPending, handleConfirmDelete, handleCancel };
};