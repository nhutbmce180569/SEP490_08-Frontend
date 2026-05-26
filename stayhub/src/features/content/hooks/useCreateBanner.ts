import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bannerService } from "../services/banner.service";
import type { CreateBannerDTO } from "../types/banner";

export const useCreateBanner = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: CreateBannerDTO) => bannerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["activeBanners"] });
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
    const dto: CreateBannerDTO = {
      title: data.title,
      imageFile: data.imageFile,
      targetUrl: data.targetUrl,
      priority: data.priority ? Number(data.priority) : 0,
      isActive: data.isActive === "Active",
    };
    mutation.mutate(dto);
  };

  const handleCancel = () => navigate("/admin/banners");

  return { handleSubmit, handleCancel, isSubmitting: mutation.isPending, serverErrors };
};