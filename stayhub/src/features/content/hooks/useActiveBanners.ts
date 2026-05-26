import { useQuery } from "@tanstack/react-query";
import { bannerService } from "../services/banner.service";

export const useActiveBanners = (pageSize: number = 10) => {
  return useQuery({
    queryKey: ["activeBanners", pageSize],
    queryFn: () => bannerService.getActive(1, pageSize),
  });
};