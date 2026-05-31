import { useQuery } from "@tanstack/react-query";
import { cancellationService } from "../services/cancellation.service";

// 2. Hook cho Admin/Manager: Lấy danh sách yêu cầu (có filter theo status)
export const useCancellationRequests = (status?: string) => {
  return useQuery({
    queryKey: ["cancellationRequests", status],
    queryFn: () => cancellationService.getRequests(status),
  });
};