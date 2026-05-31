import { useMutation, useQuery } from "@tanstack/react-query";
import { locationTrackingService } from "../services/locationTrackingService";

export const useShareLocation = () => {
  return useMutation({
    mutationFn: locationTrackingService.shareLocation,
  });
};

export const useGetPublicLocation = (token: string) => {
  return useQuery({
    queryKey: ["publicLocation", token],
    queryFn: () => locationTrackingService.getPublicLocation(token),
    enabled: !!token, // Chỉ gọi API khi token hợp lệ
    retry: false, // Không retry để báo lỗi 404 (Hết hạn) ngay lập tức
    refetchOnWindowFocus: false, // Tránh gọi lại API khi chuyển tab vì ta dùng SignalR
  });
};