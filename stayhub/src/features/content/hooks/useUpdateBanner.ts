import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bannerService } from "../services/banner.service";
import type { UpdateBannerDTO } from "../types/banner";

export const useUpdateBanner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const { data: banner, isLoading: isFetching, error } = useQuery({
    queryKey: ["banner", id],
    queryFn: () => bannerService.getById(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateBannerDTO) => bannerService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["activeBanners"] });
      queryClient.invalidateQueries({ queryKey: ["banner", id] });
      navigate("/admin/banners");
    },
    onError: (error: any) => {
      if (error.response?.data?.errors) {
        setServerErrors(error.response.data.errors);
      }
    }
  });

  const handleSubmit = async (data: Record<string, any>) => {
    setServerErrors({});
    const dto: UpdateBannerDTO = {
      title: data.title,
      // Đảm bảo chỉ gửi File lên nếu người dùng upload mới
      imageFile: data.imageFile instanceof File ? data.imageFile : undefined,
      targetUrl: data.targetUrl,
      priority: data.priority !== undefined ? Number(data.priority) : 0,
      isActive: data.isActive === "Active",
    };
    mutation.mutate(dto);
  };

  const handleCancel = () => navigate("/admin/banners");

  return { id, banner, isFetching, fetchError: error ? "Failed to fetch banner." : null, 
           isSubmitting: mutation.isPending, serverErrors, handleSubmit, handleCancel };
};