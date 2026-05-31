import { useMutation, useQuery } from "@tanstack/react-query";
import { trackingService } from "../services/trackingService";

export const useGenerateTrackingToken = () => {
  return useMutation({
    mutationFn: trackingService.generateTrackingToken,
  });
};

export const useGetPublicTrackingInfo = (token: string) => {
  return useQuery({
    queryKey: ["publicTracking", token],
    queryFn: () => trackingService.getPublicTrackingInfo(token),
    enabled: !!token, // Chỉ chạy khi có token
    retry: false, // Tắt retry để nếu mã lỗi 404 thì render ra màn hình lỗi ngay
  });
};